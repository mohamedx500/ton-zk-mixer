import * as fs from 'fs';
import * as path from 'path';
import { Address, toNano, fromNano } from '@ton/core';
import { mnemonicNew, mnemonicToPrivateKey } from '@ton/crypto';
import { WalletContractV4, TonClient } from '@ton/ton';
import { TonZkMixer } from '../build/mixer/mixer_TonZkMixer';
import { getOrCreateTestWallet } from './wallet_manager';
import { MixerClient } from '../client/mixer_sdk';
import { createDepositNote } from '../client/crypto';
import { generateWithdrawProof } from '../client/prover';
import { createThrottledTonClient } from '../client/ton_client';

const DEPLOYMENT_FILE = path.join(__dirname, '..', '.deployment.json');
const RELAYER_URL = 'http://localhost:4000';

function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
}

async function waitSeqno(walletContract: any, currentSeqno: number) {
    for (let i = 0; i < 25; i++) {
        await sleep(3500);
        const seq = await walletContract.getSeqno();
        if (seq > currentSeqno) return seq;
    }
    throw new Error('Transaction confirmation timeout on TON testnet');
}

async function main() {
    console.log('=======================================================');
    console.log('⚡ TESTING TON ZK-MIXER GASLESS RELAYER NETWORK');
    console.log('=======================================================');

    // 0. Verify Relayer is online and healthy
    console.log('\n📡 STEP 0: CHECKING RELAYER HEALTH & GAS BALANCE');
    const healthRes = await fetch(`${RELAYER_URL}/health`);
    if (!healthRes.ok) {
        throw new Error(`Relayer not responding at ${RELAYER_URL}. Please start relayer server.`);
    }
    const healthData: any = await healthRes.json();
    console.log('Relayer Status: ', healthData.status);
    console.log('Relayer Address:', healthData.relayerAddress);
    console.log('Relayer Balance:', healthData.balance);

    // 1. Connect to deployed Mixer contract & Alice wallet
    const dep = JSON.parse(fs.readFileSync(DEPLOYMENT_FILE, 'utf-8'));
    const mixerAddress = Address.parse(dep.mixerAddress);
    console.log(`\n🏛️ Mixer Contract: ${dep.mixerAddress}`);

    const client = createThrottledTonClient();

    const { keyPair, contract: aliceContract, wallet: aliceWallet } = await getOrCreateTestWallet();
    const aliceBalance = await client.getBalance(aliceContract.address);
    console.log(`Alice (Depositor) Address: ${aliceWallet.address}`);
    console.log(`Alice Balance:            ${fromNano(aliceBalance)} TON`);

    const walletContract = client.open(aliceContract);
    const mixer = client.open(TonZkMixer.fromAddress(mixerAddress));

    // 2. Generate brand new 0-balance Bob recipient
    console.log('\n--------------------------------------------------------');
    console.log('👤 STEP 1: GENERATING FRESH BOB RECIPIENT WALLET (0 TON)');
    console.log('--------------------------------------------------------');
    const bobMnemonic = await mnemonicNew(24);
    const bobKeyPair = await mnemonicToPrivateKey(bobMnemonic);
    const bobContract = WalletContractV4.create({
        workchain: 0,
        publicKey: bobKeyPair.publicKey,
    });
    const bobAddress = bobContract.address;
    const bobAddrStr = bobAddress.toString({ testOnly: true, bounceable: false });
    console.log(`Bob Address:         ${bobAddrStr}`);

    const bobBalanceBefore = await client.getBalance(bobAddress);
    console.log(`Bob Initial Balance: ${fromNano(bobBalanceBefore)} TON (FRESH WALLET)`);
    if (bobBalanceBefore !== 0n) {
        throw new Error('Bob wallet is not fresh (balance != 0)');
    }

    // 3. Test Anti-Spam: Submit Malicious / Tampered Proof to Relayer
    console.log('\n--------------------------------------------------------');
    console.log('🛡️ STEP 2: ANTI-SPAM DEFENSE TEST (TAMPERED PROOF)');
    console.log('--------------------------------------------------------');
    const fakeRelayPayload = {
        rawProof: { pi_a: ['1', '2', '1'], pi_b: [['1', '2'], ['3', '4'], ['1', '0']], pi_c: ['5', '6', '1'], protocol: 'groth16' },
        publicSignals: ['12345', '67890', '11111', '0'],
        piABase64: 'te6cckEBAQEAAgAAAEysrqA=',
        piBBase64: 'te6cckEBAQEAAgAAAEysrqA=',
        piCBase64: 'te6cckEBAQEAAgAAAEysrqA=',
        root: '12345',
        nullifierHash: '67890',
        recipient: bobAddrStr,
        assetId: '0',
    };

    const spamRes = await fetch(`${RELAYER_URL}/relay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fakeRelayPayload),
    });
    const spamData: any = await spamRes.json();
    console.log('Anti-Spam HTTP Status:', spamRes.status);
    console.log('Anti-Spam Rejection:  ', spamData.error);
    if (spamRes.status !== 400 || !spamData.error?.includes('Anti-Spam')) {
        throw new Error('Anti-spam test failed! Relayer should have rejected invalid proof.');
    }
    console.log('✅ Anti-Spam correctly caught and dropped malicious request without submitting transaction!');

    // 4. Alice Deposits 1.0 TON into Mixer
    console.log('\n--------------------------------------------------------');
    console.log('📥 STEP 3: ALICE DEPOSITS 1.0 TON INTO THE MIXER');
    console.log('--------------------------------------------------------');
    const mixerClient = new MixerClient(client, mixerAddress);
    await mixerClient.syncTreeFromChain();
    console.log(`Current Tree Leaves before deposit: ${mixerClient.tree.leaves.length}`);

    const note = createDepositNote();
    const leafIndex = mixerClient.tree.insert(note.commitment);
    const merkleProof = mixerClient.tree.getProof(leafIndex);

    console.log(`Deposit Commitment:  ${note.commitment.toString()}`);
    console.log(`Nullifier Hash:      ${note.nullifierHash.toString()}`);
    console.log(`Target Leaf Index:   ${leafIndex}`);

    let seq = await walletContract.getSeqno();
    await mixer.send(
        walletContract.sender(keyPair.secretKey),
        {
            value: toNano('1.0') + toNano('0.07'), // 1.0 TON deposit + gas
        },
        {
            $$type: 'DepositTon',
            commitment: note.commitment,
        }
    );

    console.log('⏳ Waiting for Alice deposit to be confirmed on TON testnet...');
    await waitSeqno(walletContract, seq);
    console.log('✅ Deposit confirmed on-chain!');

    // Wait 3 seconds for indexer sync
    await sleep(3500);

    // 5. Generate Groth16 BLS12-381 proof for Bob
    console.log('\n--------------------------------------------------------');
    console.log('🔐 STEP 4: GENERATING ZERO-KNOWLEDGE PROOF FOR BOB');
    console.log('--------------------------------------------------------');
    const pStart = Date.now();
    const zkProof = await generateWithdrawProof(note, merkleProof, bobAddress, 0n);
    console.log(`✅ ZK-SNARK Proof generated in ${Date.now() - pStart}ms!`);

    // 6. Submit Proof via Relayer (Gasless)
    console.log('\n--------------------------------------------------------');
    console.log('🚀 STEP 5: DISPATCHING GASLESS WITHDRAWAL VIA RELAYER');
    console.log('--------------------------------------------------------');
    const relayPayload = {
        rawProof: zkProof.rawProof,
        publicSignals: zkProof.publicSignals,
        piABase64: zkProof.piA.toBoc().toString('base64'),
        piBBase64: zkProof.piB.toBoc().toString('base64'),
        piCBase64: zkProof.piC.toBoc().toString('base64'),
        root: zkProof.root.toString(),
        nullifierHash: zkProof.nullifierHash.toString(),
        recipient: bobAddrStr,
        assetId: '0',
    };

    const relayRes = await fetch(`${RELAYER_URL}/relay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(relayPayload),
    });

    const relayData: any = await relayRes.json();
    console.log('Relayer Response HTTP Status:', relayRes.status);
    console.log('Relayer Response Data:       ', relayData);

    if (!relayRes.ok || !relayData.success) {
        throw new Error(`Relayer failed to process valid withdrawal: ${relayData.error}`);
    }
    console.log(`🎉 Relayer broadcasted withdrawal! Seqno: ${relayData.txSeqno}`);

    // 7. Verify Bob receives funds on TON Testnet
    console.log('\n--------------------------------------------------------');
    console.log('💰 STEP 6: VERIFYING BOB WALLET BALANCE INCREASE');
    console.log('--------------------------------------------------------');
    console.log('⏳ Waiting for Bob recipient wallet to receive payout on Testnet...');
    let bobBalanceAfter = 0n;
    for (let i = 0; i < 12; i++) {
        await sleep(3500);
        bobBalanceAfter = await client.getBalance(bobAddress);
        if (bobBalanceAfter > 0n) break;
        process.stdout.write('.');
    }
    console.log('');

    console.log(`Bob Final Balance:    ${fromNano(bobBalanceAfter)} TON`);
    console.log(`Received Amount:      ${fromNano(bobBalanceAfter - bobBalanceBefore)} TON`);

    if (bobBalanceAfter === 0n) {
        throw new Error('Bob did not receive payout within timeout!');
    }

    // 8. Verify Nullifier is marked as spent on-chain
    const isSpent = await mixer.getIsNullifierSpent(note.nullifierHash);
    console.log(`Nullifier Spent On-Chain: ${isSpent}`);
    if (!isSpent) {
        throw new Error('Nullifier should be spent on-chain!');
    }

    // 9. Verify Double-Spend Prevention via Relayer
    console.log('\n--------------------------------------------------------');
    console.log('🛡️ STEP 7: DOUBLE-SPEND REJECTION TEST VIA RELAYER');
    console.log('--------------------------------------------------------');
    const doubleSpendRes = await fetch(`${RELAYER_URL}/relay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(relayPayload),
    });
    const doubleSpendData: any = await doubleSpendRes.json();
    console.log('Double-Spend HTTP Status:', doubleSpendRes.status);
    console.log('Double-Spend Rejection:  ', doubleSpendData.error);
    if (doubleSpendRes.status !== 400 || !doubleSpendData.error?.includes('ALREADY been spent')) {
        throw new Error('Relayer did not reject double-spend attempt!');
    }
    console.log('✅ Double-spend successfully blocked by Relayer anti-spam engine!');

    console.log('\n=======================================================');
    console.log('🏆 ALL RELAYER TESTS PASSED FLAWLESSLY!');
    console.log('=======================================================');
}

main().catch((err) => {
    console.error('\n❌ Test Error:', err);
    process.exit(1);
});
