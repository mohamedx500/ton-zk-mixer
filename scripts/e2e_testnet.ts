import { WalletContractV4, toNano, fromNano } from '@ton/ton';
import { Address } from '@ton/core';
import { mnemonicNew, mnemonicToPrivateKey } from '@ton/crypto';
import * as fs from 'fs';
import * as path from 'path';

import { TonZkMixer } from '../build/mixer/mixer_TonZkMixer';
import { getOrCreateTestWallet } from './wallet_manager';
import { createDepositNote, MerkleTree } from '../client/crypto';
import { generateWithdrawProof } from '../client/prover';
import { createThrottledTonClient } from '../client/ton_client';
import { MixerClient } from '../client/mixer_sdk';

const DEPLOYMENT_FILE = path.join(__dirname, '..', '.deployment.json');

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitSeqno(walletContract: any, prevSeqno: number, timeoutSec: number = 75) {
    for (let i = 0; i < timeoutSec / 4; i++) {
        await sleep(4000);
        try {
            const cur = await walletContract.getSeqno();
            if (cur > prevSeqno) return cur;
        } catch (_) {}
        process.stdout.write('.');
    }
    throw new Error('Transaction confirmation timed out on TON Testnet.');
}

export async function runTestnetE2E() {
    console.log('========================================================');
    console.log('🌐 TON TESTNET LIVE END-TO-END ZERO-KNOWLEDGE MIXER TEST');
    console.log('========================================================\n');

    const client = createThrottledTonClient();
    const { wallet, keyPair, contract } = await getOrCreateTestWallet();
    const balance = await client.getBalance(Address.parse(wallet.address));

    console.log(`Deployer / Alice Wallet: ${wallet.address}`);
    console.log(`Balance:                 ${fromNano(balance)} TON\n`);

    const minRequired = toNano('1.5');
    if (balance < minRequired) {
        throw new Error(
            `INSUFFICIENT_FUNDS: Test wallet ${wallet.address} has ${fromNano(balance)} TON. Need at least 1.5 TON.`
        );
    }

    const walletContract = client.open(contract);

    // 1. Connect to deployed Mixer contract
    if (!fs.existsSync(DEPLOYMENT_FILE)) {
        throw new Error('Mixer contract not yet deployed. Please run deploy_mixer.ts first.');
    }

    const dep = JSON.parse(fs.readFileSync(DEPLOYMENT_FILE, 'utf-8'));
    const mixerAddress = Address.parse(dep.mixerAddress);
    console.log(`🏛️ Connected to TonZkMixer at: ${dep.mixerAddress}`);

    const mixer = client.open(TonZkMixer.fromAddress(mixerAddress));
    const tonDenomination = toNano('1.0');

    // 2. Generate a brand new, completely unlinked recipient wallet (Bob)
    console.log('\n🔑 Generating brand new Bob recipient keypair...');
    const bobMnemonic = await mnemonicNew(24);
    const bobKeyPair = await mnemonicToPrivateKey(bobMnemonic);
    const bobContract = WalletContractV4.create({
        workchain: 0,
        publicKey: bobKeyPair.publicKey,
    });
    const bobAddress = bobContract.address;
    const bobAddrStr = bobAddress.toString({ testOnly: true, bounceable: false });
    console.log(`Bob Recipient Address: ${bobAddrStr}`);

    const bobBalanceBefore = await client.getBalance(bobAddress);
    console.log(`Bob Initial Balance:    ${fromNano(bobBalanceBefore)} TON\n`);

    // 3. Alice performs Deposit
    console.log('--------------------------------------------------------');
    console.log('📥 STEP 1: ALICE DEPOSITS 1.0 TON INTO THE MIXER');
    console.log('--------------------------------------------------------');

    const mixerClient = new MixerClient(client, mixerAddress);
    console.log('🔄 Syncing Merkle tree from on-chain history...');
    await mixerClient.syncTreeFromChain();
    console.log(`Historical leaves on-chain: ${mixerClient.tree.leaves.length}`);

    const note = createDepositNote();
    const leafIndex = mixerClient.tree.insert(note.commitment);
    const merkleProof = mixerClient.tree.getProof(leafIndex);

    console.log(`Deposit Leaf Index: ${leafIndex}`);
    console.log(`Commitment:         ${note.commitment.toString()}`);
    console.log(`NullifierHash:      ${note.nullifierHash.toString()}`);

    let seq = await walletContract.getSeqno();
    await mixer.send(
        walletContract.sender(keyPair.secretKey),
        {
            value: tonDenomination + toNano('0.07'), // 1.0 TON deposit + gas fee
        },
        {
            $$type: 'DepositTon',
            commitment: note.commitment,
        }
    );

    console.log('⏳ Waiting for deposit confirmation on TON Testnet...');
    await waitSeqno(walletContract, seq);
    console.log('\n✅ Deposit confirmed on-chain!');

    // Wait 3.5 seconds for indexer/blocks to settle
    await sleep(3500);

    const nextIndexOnchain = await mixer.getNextIndex();
    console.log(`Next Leaf Index On-chain: ${nextIndexOnchain.toString()}`);

    const currentRoot = await mixer.getCurrentRoot();
    console.log(`On-chain Merkle Root:     ${currentRoot.toString()}`);
    console.log(`Off-chain Tree Root:      ${mixerClient.tree.getRoot().toString()}`);

    if (currentRoot !== mixerClient.tree.getRoot()) {
        throw new Error('Merkle root mismatch between client and on-chain state!');
    }
    console.log('✨ On-chain and Off-chain Merkle roots MATCH PERFECTLY!');

    // 4. Generate Zero-Knowledge Groth16 Proof off-chain
    console.log('\n--------------------------------------------------------');
    console.log('⚡ STEP 2: GENERATING ZERO-KNOWLEDGE PROOF OFF-CHAIN');
    console.log('--------------------------------------------------------');
    console.log('Proving knowledge of secret and nullifier for leaf in root without revealing leaf index...');
    const startProof = Date.now();
    const zkProof = await generateWithdrawProof(
        note,
        merkleProof,
        bobAddress,
        0n // Native TON assetId
    );
    console.log(`✅ Groth16 BLS12-381 proof generated in ${Date.now() - startProof} ms!`);

    // 5. Submit Anonymous Withdrawal to Bob
    console.log('\n--------------------------------------------------------');
    console.log('📤 STEP 3: SUBMITTING ANONYMOUS WITHDRAWAL TO BOB');
    console.log('--------------------------------------------------------');

    seq = await walletContract.getSeqno();
    await mixer.send(
        walletContract.sender(keyPair.secretKey), // Acting as relayer
        {
            value: toNano('0.18'), // Gas for TVM BLS pairing verification & payout transfer
        },
        {
            $$type: 'Withdraw',
            piA: zkProof.piA,
            piB: zkProof.piB,
            piC: zkProof.piC,
            root: zkProof.root,
            nullifierHash: zkProof.nullifierHash,
            recipient: bobAddress,
            assetId: 0n,
        }
    );

    console.log('⏳ Waiting for withdrawal verification & payout on Testnet...');
    await waitSeqno(walletContract, seq);
    console.log('\n✅ Withdrawal confirmed on-chain!');

    // 6. Verify Bob received the payout on Testnet
    console.log('⏳ Waiting for Bob recipient wallet to receive payout on Testnet...');
    let bobBalanceAfter = 0n;
    for (let i = 0; i < 7; i++) {
        await sleep(3500);
        bobBalanceAfter = await client.getBalance(bobAddress);
        if (bobBalanceAfter > 0n) break;
        process.stdout.write('.');
    }
    console.log(`\n🎉 Bob Final Balance:   ${fromNano(bobBalanceAfter)} TON`);
    console.log(`Received Payout:       ${fromNano(bobBalanceAfter - bobBalanceBefore)} TON`);

    const isSpent = await mixer.getIsNullifierSpent(note.nullifierHash);
    console.log(`Nullifier Spent Status: ${isSpent}`);

    if (bobBalanceAfter === 0n || !isSpent) {
        throw new Error('Withdrawal verification or payout failed!');
    }

    console.log('\n========================================================');
    console.log('🏆 TON TESTNET E2E ZERO-KNOWLEDGE FLOW PASSED 100%!');
    console.log('========================================================\n');
}

if (require.main === module) {
    runTestnetE2E().catch((err) => {
        console.error('\n❌ E2E Testnet Run Failed:', err.message);
        process.exit(1);
    });
}
