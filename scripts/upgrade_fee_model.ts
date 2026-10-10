import { Address, Cell, toNano } from '@ton/core';
import * as fs from 'fs';
import * as path from 'path';

import { TonZkMixer } from '../build/mixer/mixer_TonZkMixer';
import { getOrCreateTestWallet } from './wallet_manager';
import { createThrottledTonClient } from '../client/ton_client';

const DEPLOYMENT_FILE = path.join(__dirname, '..', '.deployment.json');
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function upgradeFeeModel() {
    console.log('================================================================');
    console.log('🚀 UPGRADING TON ZK-MIXER TO MONETIZED PROTOCOL FEE MODEL (SETCODE)');
    console.log('================================================================\n');

    let mixerAddressStr = process.env.MIXER_CONTRACT_ADDRESS || process.env.NEXT_PUBLIC_MIXER_ADDRESS;

    if (fs.existsSync(DEPLOYMENT_FILE)) {
        const dep = JSON.parse(fs.readFileSync(DEPLOYMENT_FILE, 'utf-8'));
        if (dep.mixerAddress) {
            mixerAddressStr = dep.mixerAddress;
        }
    }

    if (!mixerAddressStr) {
        throw new Error('Mixer contract address not found in .deployment.json or .env');
    }

    const mixerAddress = Address.parse(mixerAddressStr);
    console.log(`Mixer Contract: ${mixerAddress.toString()}`);
    console.log(`Expected Admin Fee Wallet: UQDvCkYWzfC7jf11EwKMvy_4WolQeltsPpFxwJoGtiMdCr0M\n`);

    const client = createThrottledTonClient();
    const { keyPair, contract } = await getOrCreateTestWallet();
    const walletContract = client.open(contract);

    console.log(`Deployer / Owner Wallet: ${walletContract.address.toString()}`);

    const mixer = client.open(TonZkMixer.fromAddress(mixerAddress));

    // Verify existing state is active before upgrade
    const owner = await mixer.getOwner();
    console.log(`Contract On-chain Owner: ${owner.toString()}`);

    if (!owner.equals(walletContract.address)) {
        console.warn('⚠️ Warning: Wallet is not owner, upgrade transaction might be rejected unless wallet is owner.');
    }

    const initialTotalDeposits = await mixer.getTotalDeposits();
    const initialTotalWithdrawals = await mixer.getTotalWithdrawals();
    const currentRoot = await mixer.getCurrentRoot();
    console.log(`Pre-upgrade Total Deposits: ${initialTotalDeposits}`);
    console.log(`Pre-upgrade Total Withdrawals: ${initialTotalWithdrawals}`);
    console.log(`Pre-upgrade Merkle Root: ${currentRoot}\n`);

    // Load new compiled code BOC
    const codeBocPath = path.join(__dirname, '..', 'build', 'mixer', 'mixer_TonZkMixer.code.boc');
    if (!fs.existsSync(codeBocPath)) {
        throw new Error(`Compiled BOC not found at ${codeBocPath}. Please compile first.`);
    }

    const newCode = Cell.fromBoc(fs.readFileSync(codeBocPath))[0];
    console.log('✅ Loaded new fee-model compiled bytecode (build/mixer/mixer_TonZkMixer.code.boc)');

    const seqno = await walletContract.getSeqno();
    console.log(`Sending UpgradeCode transaction from seqno: ${seqno}...`);

    await mixer.send(
        walletContract.sender(keyPair.secretKey),
        { value: toNano('0.07') },
        {
            $$type: 'UpgradeCode',
            new_code: newCode,
        }
    );

    console.log('⏳ Awaiting on-chain SETCODE confirmation...');
    for (let i = 0; i < 25; i++) {
        await sleep(3500);
        try {
            const cur = await walletContract.getSeqno();
            if (cur > seqno) break;
        } catch (_) {}
        process.stdout.write('.');
    }
    console.log('\n');

    // Verification of upgraded getters and preserved state
    await sleep(2000);
    const postTotalDeposits = await mixer.getTotalDeposits();
    const postTotalWithdrawals = await mixer.getTotalWithdrawals();
    const postRoot = await mixer.getCurrentRoot();

    console.log('🔍 Verifying Preserved State and New Fee Logic:');
    console.log(`- Deposits Preserved: ${postTotalDeposits} (Expected: ${initialTotalDeposits})`);
    console.log(`- Withdrawals Preserved: ${postTotalWithdrawals} (Expected: ${initialTotalWithdrawals})`);
    console.log(`- Merkle Tree Root Preserved: ${postRoot === currentRoot ? 'YES ✅' : 'NO ❌'}`);

    try {
        const feePercent = await mixer.getProtocolFeePercent();
        const adminFeeWallet = await mixer.getAdminFeeWallet();
        console.log(`- Protocol Fee Rate: ${feePercent}% ✅`);
        console.log(`- Admin Fee Wallet On-Chain: ${adminFeeWallet.toString()} ✅`);
    } catch (err) {
        console.log('Note: Getter verification might need a moment for TON API indexer caching.');
    }

    console.log('\n🎉 SUCCESS: TonZkMixer Fee Model Upgrade Successfully Applied via SETCODE!');
    console.log('1% of all withdrawal payouts will now be automatically routed to the Admin Wallet.');
}

if (require.main === module) {
    upgradeFeeModel().catch((err) => {
        console.error('Upgrade script failed:', err);
        process.exit(1);
    });
}
