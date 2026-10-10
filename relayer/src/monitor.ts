import { Address, fromNano, toNano, internal } from '@ton/core';
import { TonClient, WalletContractV4 } from '@ton/ton';
import { mnemonicToPrivateKey } from '@ton/crypto';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const network = (process.env.TON_NETWORK || 'mainnet').toLowerCase();
const isMainnet = network === 'mainnet';
const endpoint = process.env.TON_RPC_ENDPOINT || (isMainnet ? 'https://toncenter.com/api/v2/jsonRPC' : 'https://testnet.toncenter.com/api/v2/jsonRPC');
const apiKey = process.env.TONCENTER_API_KEY || undefined;

// Configuration thresholds: optimized for low dynamic fees (0.04 TON/tx)
const MIN_RELAYER_BALANCE = process.env.RELAYER_MIN_BALANCE
    ? toNano(process.env.RELAYER_MIN_BALANCE)
    : toNano('0.06'); // Threshold: 0.06 TON

const TOPUP_AMOUNT = process.env.RELAYER_TOPUP_AMOUNT
    ? toNano(process.env.RELAYER_TOPUP_AMOUNT)
    : toNano('0.15'); // Automated refill: 0.15 TON

const CHECK_INTERVAL_MS = parseInt(process.env.MONITOR_INTERVAL_MS || '15000', 10);

export async function runTopupCycle(client: TonClient, deployerWallet: WalletContractV4, deployerSecretKey: Buffer, relayerAddress: Address): Promise<void> {
    const relayerBalance = await client.getBalance(relayerAddress);
    const deployerBalance = await client.getBalance(deployerWallet.address);

    console.log(`[${new Date().toLocaleTimeString()}] 📊 [Monitor] Relayer: ${fromNano(relayerBalance)} TON | Deployer: ${fromNano(deployerBalance)} TON`);

    if (relayerBalance < MIN_RELAYER_BALANCE) {
        console.log(`⚠️ [Monitor] Relayer balance (${fromNano(relayerBalance)} TON) dropped below threshold (${fromNano(MIN_RELAYER_BALANCE)} TON)!`);

        // Check if deployer has enough balance for top-up + gas
        if (deployerBalance < TOPUP_AMOUNT + toNano('0.05')) {
            console.error(`❌ [Monitor] Deployer wallet has insufficient funds (${fromNano(deployerBalance)} TON) to execute top-up of ${fromNano(TOPUP_AMOUNT)} TON.`);
            return;
        }

        console.log(`🚀 [Monitor] Initiating automated cross-wallet top-up of ${fromNano(TOPUP_AMOUNT)} TON to Relayer (${relayerAddress.toString({ testOnly: !isMainnet, bounceable: false })})...`);

        const deployerContract = client.open(deployerWallet);
        const seqno = await deployerContract.getSeqno();

        await deployerContract.sendTransfer({
            seqno,
            secretKey: deployerSecretKey,
            messages: [
                internal({
                    to: relayerAddress,
                    value: TOPUP_AMOUNT,
                    bounce: false,
                    body: 'TonZkMixer Automated Relayer Gas Top-Up',
                }),
            ],
        });

        console.log(`⏳ [Monitor] Top-up transaction broadcasted (seqno: ${seqno}). Awaiting on-chain confirmation...`);

        // Wait for seqno increment
        for (let i = 0; i < 20; i++) {
            await new Promise((r) => setTimeout(r, 3000));
            try {
                const currentSeqno = await deployerContract.getSeqno();
                if (currentSeqno > seqno) {
                    console.log(`🎉 [Monitor] Auto-TopUp confirmed! Relayer gas reserves successfully replenished.`);
                    break;
                }
            } catch (_) {}
        }
    }
}

export async function startRelayerMonitor() {
    console.log('========================================================================');
    console.log('🤖 TON ZK-MIXER AUTOMATED RELAYER GUARDIAN & TOP-UP MONITOR');
    console.log('========================================================================\n');

    const deployerMnemonicStr = (process.env.DEPLOYER_MNEMONIC || '').trim();
    const relayerMnemonicStr = (process.env.RELAYER_MNEMONIC || '').trim();

    if (!deployerMnemonicStr) {
        throw new Error('DEPLOYER_MNEMONIC is not configured in .env. Cannot start auto-top-up monitor.');
    }
    if (!relayerMnemonicStr) {
        throw new Error('RELAYER_MNEMONIC is not configured in .env. Cannot start auto-top-up monitor.');
    }

    const deployerKp = await mnemonicToPrivateKey(deployerMnemonicStr.split(/\s+/));
    const relayerKp = await mnemonicToPrivateKey(relayerMnemonicStr.split(/\s+/));

    const deployerWallet = WalletContractV4.create({ workchain: 0, publicKey: deployerKp.publicKey });
    const relayerWallet = WalletContractV4.create({ workchain: 0, publicKey: relayerKp.publicKey });

    const client = new TonClient({ endpoint, apiKey });

    console.log(`🌐 Network:           ${network.toUpperCase()}`);
    console.log(`🔑 Deployer Wallet:   ${deployerWallet.address.toString({ testOnly: !isMainnet, bounceable: false })}`);
    console.log(`⚡ Relayer Wallet:    ${relayerWallet.address.toString({ testOnly: !isMainnet, bounceable: false })}`);
    console.log(`📉 Min Relayer Gas:   ${fromNano(MIN_RELAYER_BALANCE)} TON`);
    console.log(`⛽ Top-Up Refill:     ${fromNano(TOPUP_AMOUNT)} TON`);
    console.log(`⏱️ Check Interval:    ${CHECK_INTERVAL_MS / 1000}s\n`);

    console.log('🛡️ Auto-TopUp Sentinel active. Monitoring wallet balances...\n');

    const loop = async () => {
        try {
            await runTopupCycle(client, deployerWallet, deployerKp.secretKey, relayerWallet.address);
        } catch (err: any) {
            console.error(`⚠️ [Monitor Loop Warning]:`, err.message);
        } finally {
            setTimeout(loop, CHECK_INTERVAL_MS);
        }
    };

    loop();
}

if (require.main === module) {
    startRelayerMonitor().catch((err) => {
        console.error('❌ Monitor fatal error:', err);
        process.exit(1);
    });
}
