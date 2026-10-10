import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { WalletContractV4, toNano, fromNano, TonClient } from '@ton/ton';
import { Address } from '@ton/core';
import { mnemonicToPrivateKey } from '@ton/crypto';
import { TonZkMixer } from '../build/mixer/mixer_TonZkMixer';

// Load environment variables
const ENV_PATH = path.join(__dirname, '..', '.env');
dotenv.config({ path: ENV_PATH });

const MAINNET_DEPLOYMENT_FILE = path.join(__dirname, '..', '.deployment.mainnet.json');

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
    console.log('========================================================================');
    console.log('🏛️  TON ZK-MIXER - MAINNET SMART CONTRACT DEPLOYMENT PIPELINE');
    console.log('========================================================================\n');

    const mnemonicStr = process.env.DEPLOYER_MNEMONIC;
    if (!mnemonicStr || mnemonicStr.trim().split(/\s+/).length < 12) {
        console.error('❌ ERROR: Missing or invalid DEPLOYER_MNEMONIC in .env file!');
        console.error('Please configure your 24-word seed phrase in .env:');
        console.error('  DEPLOYER_MNEMONIC="word1 word2 ... word24"\n');
        process.exit(1);
    }

    const mnemonic = mnemonicStr.trim().split(/\s+/);
    const keyPair = await mnemonicToPrivateKey(mnemonic);
    const contract = WalletContractV4.create({
        workchain: 0,
        publicKey: keyPair.publicKey,
    });

    const mainnetAddress = contract.address.toString({
        testOnly: false,
        bounceable: false,
    });
    console.log(`Deployer Address (Mainnet): ${mainnetAddress}`);

    const rawEndpoint = process.env.TON_RPC_ENDPOINT || 'https://toncenter.com/api/v2/jsonRPC';
    const endpoint = rawEndpoint.includes('testnet') ? 'https://toncenter.com/api/v2/jsonRPC' : rawEndpoint;
    const apiKey = process.env.TONCENTER_API_KEY ? process.env.TONCENTER_API_KEY.trim() : undefined;

    const client = new TonClient({
        endpoint,
        apiKey,
    });

    console.log(`Connecting to TON Mainnet RPC: ${endpoint}...`);
    const balance = await client.getBalance(contract.address);
    console.log(`Deployer Balance on Mainnet:   ${fromNano(balance)} TON\n`);

    const minRequired = toNano('0.4');
    if (balance < minRequired) {
        console.error(`❌ INSUFFICIENT BALANCE ON MAINNET!`);
        console.error(`Wallet ${mainnetAddress} has ${fromNano(balance)} TON.`);
        console.error(`Please fund this wallet with at least 0.5 TON to cover contract code storage and deployment.`);
        process.exit(1);
    }

    const tonDenomination = toNano('1.0');
    console.log('📦 Initializing TonZkMixer code & state cell...');
    const mixerInit = await TonZkMixer.fromInit(contract.address, tonDenomination);
    const mixer = client.open(mixerInit);

    const mixerMainnetAddr = mixer.address.toString({
        testOnly: false,
        bounceable: false,
    });
    console.log(`Target Contract Address: ${mixerMainnetAddr}`);
    console.log(`Explorer Link:          https://tonscan.org/address/${mixerMainnetAddr}\n`);

    const isDeployed = await client.isContractDeployed(mixer.address);
    if (isDeployed) {
        console.log('✅ TonZkMixer is ALREADY DEPLOYED on TON Mainnet!');
        saveDeployment(mixerMainnetAddr, mixer.address.toRawString(), tonDenomination.toString());
        return;
    }

    console.log('📤 Broadcasting deploy transaction with 0.25 TON initial storage endowment...');
    const walletContract = client.open(contract);
    const seqno = await walletContract.getSeqno();

    const sender = walletContract.sender(keyPair.secretKey);
    await mixer.send(
        sender,
        { value: toNano('0.25') },
        null
    );

    console.log('⏳ Waiting for Mainnet validators to confirm deployment block...');
    let currentSeqno = seqno;
    for (let i = 0; i < 30; i++) {
        await sleep(4000);
        try {
            currentSeqno = await walletContract.getSeqno();
            if (currentSeqno > seqno) break;
        } catch (_) {}
        process.stdout.write('.');
    }
    console.log('\n');

    const confirmed = await client.isContractDeployed(mixer.address);
    if (!confirmed) {
        console.error('⚠️ Transaction was broadcast, but deployment confirmation is still pending.');
        console.error(`Check status on explorer: https://tonscan.org/address/${mixerMainnetAddr}`);
        return;
    }

    console.log('🎉 TON ZK-MIXER SUCCESSFULLY DEPLOYED TO TON MAINNET!');
    console.log(`Contract Address: ${mixerMainnetAddr}`);
    console.log(`Raw Address:      ${mixer.address.toRawString()}`);
    console.log(`Explorer:         https://tonscan.org/address/${mixerMainnetAddr}\n`);

    saveDeployment(mixerMainnetAddr, mixer.address.toRawString(), tonDenomination.toString());
}

function saveDeployment(mixerAddress: string, rawAddress: string, denomination: string) {
    fs.writeFileSync(
        MAINNET_DEPLOYMENT_FILE,
        JSON.stringify(
            {
                network: 'mainnet',
                mixerAddress,
                rawAddress,
                tonDenomination: denomination,
                deployedAt: new Date().toISOString(),
            },
            null,
            2
        )
    );
    console.log(`💾 Saved Mainnet deployment metadata to ${MAINNET_DEPLOYMENT_FILE}`);

    // Update .env file with the deployed address
    try {
        if (fs.existsSync(ENV_PATH)) {
            let envContent = fs.readFileSync(ENV_PATH, 'utf-8');
            envContent = envContent.replace(
                /MIXER_CONTRACT_ADDRESS=.*/g,
                `MIXER_CONTRACT_ADDRESS=${mixerAddress}`
            );
            envContent = envContent.replace(
                /NEXT_PUBLIC_MIXER_ADDRESS=.*/g,
                `NEXT_PUBLIC_MIXER_ADDRESS=${mixerAddress}`
            );
            fs.writeFileSync(ENV_PATH, envContent, 'utf-8');
            console.log(`🔄 Automatically updated MIXER_CONTRACT_ADDRESS in .env`);
        }
    } catch (_) {}
}

main().catch((err) => {
    console.error('\n❌ Deployment Failed:', err);
    process.exit(1);
});
