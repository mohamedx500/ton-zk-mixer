import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Address, Cell, toNano, beginCell } from '@ton/core';
import '@ton/test-utils';

import { TonZkMixer } from '../build/mixer/mixer_TonZkMixer';
import { Verifier } from '../build/verifier/verifier_Verifier';
import { createDepositNote, MerkleTree, addressToScalar, DepositNote } from '../client/crypto';
import { generateWithdrawProof } from '../client/prover';

describe('TonZkMixer End-to-End Sandbox Protocol Test', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let alice: SandboxContract<TreasuryContract>;
    let bobRecipient: SandboxContract<TreasuryContract>;
    let mallory: SandboxContract<TreasuryContract>;
    let mockJettonWallet: SandboxContract<TreasuryContract>;

    let mixer: SandboxContract<TonZkMixer>;
    let verifierContract: SandboxContract<Verifier>;
    let sharedTree: MerkleTree;

    const TON_DENOMINATION = toNano('1.0');
    const JETTON_DENOMINATION = 100_000_000n; // 100 Jetton tokens (e.g. 6 decimals)

    // Notes used across test steps
    let aliceNote1: DepositNote;
    let aliceNote2: DepositNote;
    let aliceNote3: DepositNote;
    let jettonNote: DepositNote;

    beforeAll(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');
        alice = await blockchain.treasury('alice');
        bobRecipient = await blockchain.treasury('bobRecipient');
        mallory = await blockchain.treasury('mallory');
        mockJettonWallet = await blockchain.treasury('mockJettonWallet');

        sharedTree = new MerkleTree(8);

        // 1. Deploy standalone Verifier contract
        verifierContract = blockchain.openContract(await Verifier.fromInit());
        const verifierDeployResult = await verifierContract.send(
            deployer.getSender(),
            { value: toNano('0.1') },
            null
        );
        expect(verifierDeployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: verifierContract.address,
            deploy: true,
            success: true,
        });

        // 2. Deploy main TonZkMixer contract
        mixer = blockchain.openContract(
            await TonZkMixer.fromInit(deployer.address, TON_DENOMINATION)
        );

        const deployResult = await mixer.send(
            deployer.getSender(),
            { value: toNano('0.2') },
            null
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: mixer.address,
            deploy: true,
            success: true,
        });

        // Verify initial state
        expect(await mixer.getIsPaused()).toBe(false);
        expect(await mixer.getNextIndex()).toBe(0n);
        expect(await mixer.getTotalDeposits()).toBe(0n);
        expect(await mixer.getTotalWithdrawals()).toBe(0n);
        expect((await mixer.getOwner()).equals(deployer.address)).toBe(true);

        const initialRoot = await mixer.getCurrentRoot();
        expect(initialRoot).toBe(sharedTree.getRoot());
        expect(await mixer.getIsKnownRoot(initialRoot)).toBe(true);
    });

    it('1. Should accept native TON deposit and update on-chain Merkle tree', async () => {
        aliceNote1 = createDepositNote();
        sharedTree.insert(aliceNote1.commitment);
        const expectedRoot = sharedTree.getRoot();

        const depositResult = await mixer.send(
            alice.getSender(),
            {
                value: TON_DENOMINATION + toNano('0.06'), // 1 TON deposit + gas
            },
            {
                $$type: 'DepositTon',
                commitment: aliceNote1.commitment,
            }
        );

        expect(depositResult.transactions).toHaveTransaction({
            from: alice.address,
            to: mixer.address,
            success: true,
        });

        // Verify contract updated nextIndex and currentRoot matches off-chain calculation
        expect(await mixer.getNextIndex()).toBe(1n);
        expect(await mixer.getTotalDeposits()).toBe(1n);

        const contractRoot = await mixer.getCurrentRoot();
        expect(contractRoot).toBe(expectedRoot);
        expect(await mixer.getIsKnownRoot(contractRoot)).toBe(true);
    });

    it('2. Should verify ZK-SNARK Groth16 proof on-chain and anonymously withdraw TON', async () => {
        aliceNote2 = createDepositNote();
        const leafIndex = sharedTree.insert(aliceNote2.commitment);
        const merkleProof = sharedTree.getProof(leafIndex);

        // Perform deposit of note 2
        const depositResult = await mixer.send(
            alice.getSender(),
            {
                value: TON_DENOMINATION + toNano('0.06'),
            },
            {
                $$type: 'DepositTon',
                commitment: aliceNote2.commitment,
            }
        );

        expect(depositResult.transactions).toHaveTransaction({
            from: alice.address,
            to: mixer.address,
            success: true,
        });

        const onchainRoot = await mixer.getCurrentRoot();
        expect(onchainRoot).toBe(sharedTree.getRoot());

        // Generate off-chain zero-knowledge proof for fresh address Bob
        const zkProof = await generateWithdrawProof(
            aliceNote2,
            merkleProof,
            bobRecipient.address,
            0n // Native TON assetId
        );

        const bobBalanceBefore = await bobRecipient.getBalance();

        // Submit withdrawal transaction with ZK proof
        const withdrawResult = await mixer.send(
            alice.getSender(), // Any relayer can submit
            {
                value: toNano('0.15'), // Gas for TVM pairing and transfers
            },
            {
                $$type: 'Withdraw',
                piA: zkProof.piA,
                piB: zkProof.piB,
                piC: zkProof.piC,
                root: zkProof.root,
                nullifierHash: zkProof.nullifierHash,
                recipient: bobRecipient.address,
                assetId: 0n,
            }
        );

        // Expect payout to Bob
        expect(withdrawResult.transactions).toHaveTransaction({
            from: mixer.address,
            to: bobRecipient.address,
            success: true,
        });

        const bobBalanceAfter = await bobRecipient.getBalance();
        expect(bobBalanceAfter).toBeGreaterThan(bobBalanceBefore);

        // Verify nullifier is marked as spent
        expect(await mixer.getIsNullifierSpent(aliceNote2.nullifierHash)).toBe(true);
        expect(await mixer.getTotalWithdrawals()).toBe(1n);
    });

    it('3. Safeguard: Should prevent double-spending the same nullifier', async () => {
        // Re-attempt withdrawal of aliceNote2 which was already spent in Test 2
        const leafIndex = 1; // aliceNote2 was at index 1
        const merkleProof = sharedTree.getProof(leafIndex);

        const zkProof = await generateWithdrawProof(
            aliceNote2,
            merkleProof,
            bobRecipient.address,
            0n
        );

        // Second withdrawal attempt with same nullifier MUST fail
        const replayResult = await mixer.send(
            mallory.getSender(),
            { value: toNano('0.15') },
            {
                $$type: 'Withdraw',
                piA: zkProof.piA,
                piB: zkProof.piB,
                piC: zkProof.piC,
                root: zkProof.root,
                nullifierHash: zkProof.nullifierHash,
                recipient: bobRecipient.address,
                assetId: 0n,
            }
        );

        expect(replayResult.transactions).toHaveTransaction({
            from: mallory.address,
            to: mixer.address,
            success: false,
            exitCode: 1006, // ERR_NULLIFIER_SPENT
        });
    });

    it('4. Safeguard: Should reject proof tampering / front-running attack', async () => {
        aliceNote3 = createDepositNote();
        const leafIndex = sharedTree.insert(aliceNote3.commitment);
        const merkleProof = sharedTree.getProof(leafIndex);

        await mixer.send(
            alice.getSender(),
            { value: TON_DENOMINATION + toNano('0.06') },
            {
                $$type: 'DepositTon',
                commitment: aliceNote3.commitment,
            }
        );

        // Proof was generated specifically for Bob
        const zkProof = await generateWithdrawProof(
            aliceNote3,
            merkleProof,
            bobRecipient.address,
            0n
        );

        // Mallory intercepts proof and attempts to substitute her own address as recipient
        const attackResult = await mixer.send(
            mallory.getSender(),
            { value: toNano('0.15') },
            {
                $$type: 'Withdraw',
                piA: zkProof.piA,
                piB: zkProof.piB,
                piC: zkProof.piC,
                root: zkProof.root,
                nullifierHash: zkProof.nullifierHash,
                recipient: mallory.address, // Tampered recipient!
                assetId: 0n,
            }
        );

        expect(attackResult.transactions).toHaveTransaction({
            from: mallory.address,
            to: mixer.address,
            success: false,
            exitCode: 1007, // ERR_INVALID_PROOF
        });
    });

    it('5. Universal Jetton Support: Should handle dynamic Jetton deposit and anonymous withdrawal', async () => {
        jettonNote = createDepositNote();
        const leafIndex = sharedTree.insert(jettonNote.commitment);
        const merkleProof = sharedTree.getProof(leafIndex);

        const jettonAssetId = addressToScalar(mockJettonWallet.address);

        // Forward payload containing commitment
        const forwardPayload = beginCell()
            .storeUint(jettonNote.commitment, 256)
            .endCell();

        // Simulate JettonNotification from mockJettonWallet to Mixer
        const jettonDepositResult = await mixer.send(
            mockJettonWallet.getSender(),
            { value: toNano('0.1') },
            {
                $$type: 'JettonNotification',
                query_id: 1n,
                amount: JETTON_DENOMINATION,
                sender: alice.address,
                forward_payload: forwardPayload.asSlice(),
            }
        );

        expect(jettonDepositResult.transactions).toHaveTransaction({
            from: mockJettonWallet.address,
            to: mixer.address,
            success: true,
        });

        // Verify Jetton pool was dynamically registered with the deposit amount
        expect(await mixer.getPoolDenomination(jettonAssetId)).toBe(JETTON_DENOMINATION);

        // Generate ZK proof binding the Jetton assetId
        const zkProof = await generateWithdrawProof(
            jettonNote,
            merkleProof,
            bobRecipient.address,
            jettonAssetId
        );

        // Withdraw Jettons anonymously
        const jettonWithdrawResult = await mixer.send(
            alice.getSender(),
            { value: toNano('0.15') },
            {
                $$type: 'Withdraw',
                piA: zkProof.piA,
                piB: zkProof.piB,
                piC: zkProof.piC,
                root: zkProof.root,
                nullifierHash: zkProof.nullifierHash,
                recipient: bobRecipient.address,
                assetId: jettonAssetId,
            }
        );

        // Expect JettonTransfer dispatched to mockJettonWallet
        expect(jettonWithdrawResult.transactions).toHaveTransaction({
            from: mixer.address,
            to: mockJettonWallet.address,
            success: true,
        });

        // Verify Jetton nullifier spent
        expect(await mixer.getIsNullifierSpent(jettonNote.nullifierHash)).toBe(true);
    });

    it('6. Emergency Safeguards: Pause, Unpause, and Emergency Rescue', async () => {
        // Non-owner cannot pause
        const unauthorizedPause = await mixer.send(
            mallory.getSender(),
            { value: toNano('0.05') },
            { $$type: 'SetPaused', paused: true }
        );
        expect(unauthorizedPause.transactions).toHaveTransaction({
            from: mallory.address,
            to: mixer.address,
            success: false,
            exitCode: 1001, // ERR_NOT_OWNER
        });

        // Owner pauses contract
        await mixer.send(
            deployer.getSender(),
            { value: toNano('0.05') },
            { $$type: 'SetPaused', paused: true }
        );
        expect(await mixer.getIsPaused()).toBe(true);

        // Deposits while paused are blocked
        const blockedDeposit = await mixer.send(
            alice.getSender(),
            { value: TON_DENOMINATION + toNano('0.06') },
            { $$type: 'DepositTon', commitment: 12345n }
        );
        expect(blockedDeposit.transactions).toHaveTransaction({
            from: alice.address,
            to: mixer.address,
            success: false,
            exitCode: 1002, // ERR_PAUSED
        });

        // Owner unpauses contract
        await mixer.send(
            deployer.getSender(),
            { value: toNano('0.05') },
            { $$type: 'SetPaused', paused: false }
        );
        expect(await mixer.getIsPaused()).toBe(false);

        // Emergency rescue funds
        const rescueResult = await mixer.send(
            deployer.getSender(),
            { value: toNano('0.05') },
            {
                $$type: 'EmergencyRescue',
                recipient: deployer.address,
                amount: toNano('0.1'),
                jettonWallet: null,
            }
        );
        expect(rescueResult.transactions).toHaveTransaction({
            from: mixer.address,
            to: deployer.address,
            success: true,
        });
    });

    it('7. Upgradable Architecture: Code upgrade via set_code preserves state and anonymity set', async () => {
        const rootBefore = await mixer.getCurrentRoot();
        const nextIndexBefore = await mixer.getNextIndex();
        const totalDepositsBefore = await mixer.getTotalDeposits();

        // Non-owner cannot upgrade code
        const dummyCode = verifierContract.init!.code;
        const unauthorizedUpgrade = await mixer.send(
            mallory.getSender(),
            { value: toNano('0.05') },
            { $$type: 'UpgradeCode', new_code: dummyCode }
        );
        expect(unauthorizedUpgrade.transactions).toHaveTransaction({
            from: mallory.address,
            to: mixer.address,
            success: false,
            exitCode: 1001, // ERR_NOT_OWNER
        });

        // Owner upgrades code
        const upgradeResult = await mixer.send(
            deployer.getSender(),
            { value: toNano('0.05') },
            { $$type: 'UpgradeCode', new_code: mixer.init!.code } // self-code upgrade test
        );
        expect(upgradeResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: mixer.address,
            success: true,
        });

        // Anonymity set & state is 100% preserved
        expect(await mixer.getCurrentRoot()).toBe(rootBefore);
        expect(await mixer.getNextIndex()).toBe(nextIndexBefore);
        expect(await mixer.getTotalDeposits()).toBe(totalDepositsBefore);
    });
});
