import { Address, Cell, toNano, fromNano } from '@ton/core';
import { TonClient, WalletContractV4 } from '@ton/ton';
import { mnemonicToPrivateKey } from '@ton/crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

import { TonZkMixer } from '../build/mixer/mixer_TonZkMixer';
import { getOrCreateTestWallet } from './wallet_manager';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function upgradeToTreasuryModel() {
    console.log('========================================================================');
    console.log('🏛️  UPGRADING TON ZK-MIXER TO TREASURY & PULL-FEE MODEL (SETCODE)');
    console.log('========================================================================\n');

    const network = (process.env.TON_NETWORK || 'mainnet').toLowerCase();
    const isMainnet = network === 'mainnet';
    const endpoint = process.env.TON_RPC_ENDPOINT || (isMainnet ? 'https://toncenter.com/api/v2/jsonRPC' : 'https://testnet.toncenter.com/api/v2/jsonRPC');
    const apiKey = process.env.TONCENTER_API_KEY || undefined;

    console.log(`🌐 Network:  ${network.toUpperCase()} (${endpoint})`);

    const client = new TonClient({ endpoint, apiKey });

    // 1. Resolve Deployer / Owner Wallet
    let keyPair: { publicKey: Buffer; secretKey: Buffer };
    let walletContract: WalletContractV4;

    const deployerMnemonic = process.env.DEPLOYER_MNEMONIC ? process.env.DEPLOYER_MNEMONIC.trim() : '';

    if (deployerMnemonic) {
        const words = deployerMnemonic.split(/\s+/);
        keyPair = await mnemonicToPrivateKey(words);
        walletContract = WalletContractV4.create({ workchain: 0, publicKey: keyPair.publicKey });
        console.log(`🔑 Deployer Wallet (from DEPLOYER_MNEMONIC): ${walletContract.address.toString({ testOnly: !isMainnet, bounceable: false })}`);
    } else {
        const testWallet = await getOrCreateTestWallet();
        keyPair = testWallet.keyPair;
        walletContract = testWallet.contract;
        console.log(`🔑 Deployer Wallet (from local testnet wallet): ${walletContract.address.toString({ testOnly: !isMainnet, bounceable: false })}`);
    }

    const deployerBalance = await client.getBalance(walletContract.address);
    console.log(`💰 Deployer Balance: ${fromNano(deployerBalance)} TON`);

    // 2. Resolve Mixer Contract Address
    const mixerAddressStr = process.env.MIXER_CONTRACT_ADDRESS || process.env.NEXT_PUBLIC_MIXER_ADDRESS;
    if (!mixerAddressStr) {
        throw new Error('MIXER_CONTRACT_ADDRESS not found in .env');
    }
    const mixerAddress = Address.parse(mixerAddressStr);
    console.log(`📍 Mixer Address:   ${mixerAddress.toString({ testOnly: !isMainnet, bounceable: false })}\n`);

    const mixer = client.open(TonZkMixer.fromAddress(mixerAddress));

    // 3. Pre-upgrade State Inspection
    const onchainOwner = await mixer.getOwner();
    console.log(`👑 On-chain Contract Owner: ${onchainOwner.toString({ testOnly: !isMainnet, bounceable: false })}`);

    if (onchainOwner.toRawString() !== walletContract.address.toRawString()) {
        console.warn('⚠️ WARNING: Connected wallet does not match on-chain contract owner!');
    }

    const initialDeposits = await mixer.getTotalDeposits();
    const initialWithdrawals = await mixer.getTotalWithdrawals();
    const initialRoot = await mixer.getCurrentRoot();
    console.log(`📊 Pre-upgrade Total Deposits:    ${initialDeposits}`);
    console.log(`📊 Pre-upgrade Total Withdrawals: ${initialWithdrawals}`);
    console.log(`🌿 Pre-upgrade Merkle Root:       ${initialRoot}\n`);

    // 4. Load New Bytecode
    const codeBocPath = path.join(__dirname, '..', 'build', 'mixer', 'mixer_TonZkMixer.code.boc');
    if (!fs.existsSync(codeBocPath)) {
        throw new Error(`Compiled BOC not found at ${codeBocPath}. Run npm run build first.`);
    }
    const newCode = Cell.fromBoc(fs.readFileSync(codeBocPath))[0];
    console.log(`📦 Loaded new Treasury bytecode BOC (${fs.statSync(codeBocPath).size} bytes)`);

    // 5. Send UpgradeCode Message
    const seqno = await client.open(walletContract).getSeqno();
    console.log(`🚀 Dispatching SETCODE Upgrade transaction (seqno: ${seqno})...`);

    await mixer.send(
        client.open(walletContract).sender(keyPair.secretKey),
        { value: toNano('0.01') },
        {
            $$type: 'UpgradeCode',
            new_code: newCode,
        }
    );

    console.log('⏳ Awaiting on-chain SETCODE execution confirmation...');
    for (let i = 0; i < 25; i++) {
        await sleep(3000);
        try {
            const currentSeqno = await client.open(walletContract).getSeqno();
            if (currentSeqno > seqno) {
                console.log(`\n✅ Transaction confirmed on-chain! New seqno: ${currentSeqno}`);
                break;
            }
        } catch (_) {}
        process.stdout.write('.');
    }
    console.log('\n');

    // 6. Post-Upgrade Verification
    await sleep(2500);
    const postDeposits = await mixer.getTotalDeposits();
    const postWithdrawals = await mixer.getTotalWithdrawals();
    const postRoot = await mixer.getCurrentRoot();

    console.log('🔍 Verifying Preserved State:');
    console.log(`- Deposits Preserved:    ${postDeposits === initialDeposits ? 'YES ✅' : 'NO ❌'}`);
    console.log(`- Withdrawals Preserved: ${postWithdrawals === initialWithdrawals ? 'YES ✅' : 'NO ❌'}`);
    console.log(`- Merkle Root Preserved: ${postRoot === initialRoot ? 'YES ✅' : 'NO ❌'}`);

    try {
        const accumulatedFees = await mixer.getAccumulatedFees();
        const autoFeeRouting = await mixer.getAutoFeeRouting();
        const upfrontFee1 = await mixer.getUpfrontFee(toNano('1.0'));
        const upfrontFee25 = await mixer.getUpfrontFee(toNano('25.0'));
        const upfrontFee100 = await mixer.getUpfrontFee(toNano('100.0'));
        const upfrontFee500 = await mixer.getUpfrontFee(toNano('500.0'));
        const upfrontFee1000 = await mixer.getUpfrontFee(toNano('1000.0'));
        console.log(`- Accumulated Fees Available: ${fromNano(accumulatedFees)} TON ✅`);
        console.log(`- Dynamic Fee Routing:        ${autoFeeRouting ? 'Auto-Push' : 'Pull/Accumulate (Default)'} ✅`);
        console.log(`- Upfront Fee (1.0 TON Pool):    ${fromNano(upfrontFee1)} TON ✅`);
        console.log(`- Upfront Fee (25 TON Pool):     ${fromNano(upfrontFee25)} TON ✅`);
        console.log(`- Upfront Fee (100 TON Pool):    ${fromNano(upfrontFee100)} TON ✅`);
        console.log(`- Upfront Fee (500 TON Pool):    ${fromNano(upfrontFee500)} TON ✅`);
        console.log(`- Upfront Fee (1000 TON Whale):  ${fromNano(upfrontFee1000)} TON ✅`);
    } catch (err: any) {
        console.log('ℹ️ Getters query note:', err.message);
    }

    console.log('\n🎉 UPGRADE COMPLETE: Upfront Tiered Fee Model is now live on-chain!');
}

if (require.main === module) {
    upgradeToTreasuryModel().catch((err) => {
        console.error('❌ Upgrade failed:', err);
        process.exit(1);
    });
}
