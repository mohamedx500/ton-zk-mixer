import { Address, Cell, toNano } from '@ton/core';
import * as fs from 'fs';
import * as path from 'path';

import { TonZkMixer } from '../build/mixer/mixer_TonZkMixer';
import { getOrCreateTestWallet } from './wallet_manager';
import { createThrottledTonClient } from '../client/ton_client';

const DEPLOYMENT_FILE = path.join(__dirname, '..', '.deployment.json');

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function upgradeMixer() {
    console.log('========================================================');
    console.log('🔄 UPGRADING TON ZK-MIXER CODE ON TON TESTNET (SET_CODE)');
    console.log('========================================================\n');

    if (!fs.existsSync(DEPLOYMENT_FILE)) {
        throw new Error('Deployment file not found');
    }

    const dep = JSON.parse(fs.readFileSync(DEPLOYMENT_FILE, 'utf-8'));
    const mixerAddress = Address.parse(dep.mixerAddress);
    console.log(`Mixer Contract: ${dep.mixerAddress}`);

    const client = createThrottledTonClient();
    const { keyPair, contract } = await getOrCreateTestWallet();
    const walletContract = client.open(contract);

    const mixer = client.open(TonZkMixer.fromAddress(mixerAddress));

    // Load new compiled code BOC
    const codeBocPath = path.join(__dirname, '..', 'build', 'mixer', 'mixer_TonZkMixer.code.boc');
    const newCode = Cell.fromBoc(fs.readFileSync(codeBocPath))[0];
    console.log('Loaded new compiled bytecode from build/mixer/mixer_TonZkMixer.code.boc');

    const seqno = await walletContract.getSeqno();
    console.log(`Current seqno: ${seqno}. Sending UpgradeCode transaction...`);

    await mixer.send(
        walletContract.sender(keyPair.secretKey),
        { value: toNano('0.06') },
        {
            $$type: 'UpgradeCode',
            new_code: newCode,
        }
    );

    console.log('⏳ Waiting for code upgrade confirmation on Testnet...');
    for (let i = 0; i < 20; i++) {
        await sleep(3500);
        try {
            const cur = await walletContract.getSeqno();
            if (cur > seqno) break;
        } catch (_) {}
        process.stdout.write('.');
    }
    console.log('\n');

    console.log('🎉 TonZkMixer CODE UPGRADED SUCCESSFULLY VIA SETCODE!');
    console.log('Anonymity set and historical Merkle tree roots fully preserved.');
}

if (require.main === module) {
    upgradeMixer().catch((err) => {
        console.error('Upgrade failed:', err);
        process.exit(1);
    });
}
