import { Address, Cell, toNano, Sender, beginCell } from '@ton/core';
import { TonClient } from '@ton/ton';
import { TonZkMixer } from '../build/mixer/mixer_TonZkMixer';
import { DepositNote, MerkleTree, createDepositNote, addressToScalar } from './crypto';
import { generateWithdrawProof, ZkWithdrawProof } from './prover';

/**
 * Universal TON & Jetton ZK-Mixer Client SDK
 */
export class MixerClient {
    readonly client: TonClient;
    readonly mixerAddress: Address;
    readonly tree: MerkleTree;

    constructor(client: TonClient, mixerAddress: Address) {
        this.client = client;
        this.mixerAddress = mixerAddress;
        this.tree = new MerkleTree(8);
    }

    /**
     * Synchronize off-chain Merkle tree from on-chain transactions and deposit events.
     * Reconstructs the exact incremental Merkle tree state matching contract storage.
     */
    async syncTreeFromChain(limit: number = 100): Promise<MerkleTree> {
        const txs = await this.client.getTransactions(this.mixerAddress, { limit });
        const chronological = [...txs].reverse();
        this.tree.leaves = [];

        for (const tx of chronological) {
            if (tx.inMessage && tx.inMessage.info.type === 'internal') {
                const body = tx.inMessage.body.beginParse();
                if (body.remainingBits >= 32 + 256) {
                    const op = body.loadUint(32);
                    if (op === 0x1001) {
                        // DepositTon
                        const commitment = body.loadUintBig(256);
                        this.tree.insert(commitment);
                    } else if (op === 0x7362d09c) {
                        // JettonNotification
                        body.loadUint(64); // query_id
                        body.loadCoins();  // amount
                        body.loadAddress(); // sender
                        let commitment: bigint | null = null;
                        if (body.remainingBits >= 256) {
                            commitment = body.loadUintBig(256);
                        } else if (body.remainingRefs > 0) {
                            const ref = body.loadRef().beginParse();
                            if (ref.remainingBits >= 256) {
                                commitment = ref.loadUintBig(256);
                            }
                        }
                        if (commitment !== null) {
                            this.tree.insert(commitment);
                        }
                    }
                }
            }
        }
        return this.tree;
    }

    /**
     * Create a new deposit note with random secret and nullifier
     */
    createNote(): DepositNote {
        return createDepositNote();
    }

    /**
     * Deposit native TON into the mixer pool
     */
    async depositTon(
        sender: Sender,
        note: DepositNote,
        amount: bigint = toNano('1.0'),
        gasFee: bigint = toNano('0.06')
    ) {
        const mixer = this.client.open(TonZkMixer.fromAddress(this.mixerAddress));
        
        await mixer.send(
            sender,
            { value: amount + gasFee },
            {
                $$type: 'DepositTon',
                commitment: note.commitment,
            }
        );

        const leafIndex = this.tree.insert(note.commitment);
        return { leafIndex, commitment: note.commitment, root: this.tree.getRoot() };
    }

    /**
     * Deposit ANY Jetton into the mixer pool via TEP-74 transfer notification
     */
    async depositJetton(
        sender: Sender,
        userJettonWalletAddress: Address,
        note: DepositNote,
        jettonAmount: bigint,
        gasFee: bigint = toNano('0.1')
    ) {
        const forwardPayload = beginCell()
            .storeUint(note.commitment, 256)
            .endCell();

        // Send JettonTransfer to user's JettonWallet pointing destination to Mixer
        const transferBody = beginCell()
            .storeUint(0x0f8a7ea5, 32) // op::transfer
            .storeUint(0, 64)          // query_id
            .storeCoins(jettonAmount)
            .storeAddress(this.mixerAddress) // to mixer
            .storeAddress(sender.address)    // response_destination
            .storeBit(0)                     // null custom_payload
            .storeCoins(toNano('0.05'))      // forward_ton_amount
            .storeBit(1)                     // forward_payload in ref
            .storeRef(forwardPayload)
            .endCell();

        await sender.send({
            to: userJettonWalletAddress,
            value: gasFee,
            body: transferBody,
        });

        const leafIndex = this.tree.insert(note.commitment);
        return { leafIndex, commitment: note.commitment, root: this.tree.getRoot() };
    }

    /**
     * Generate zero-knowledge proof for anonymous withdrawal
     */
    async prepareWithdrawal(
        note: DepositNote,
        leafIndex: number,
        recipient: Address,
        assetId: bigint = 0n
    ): Promise<ZkWithdrawProof> {
        const merkleProof = this.tree.getProof(leafIndex);
        return await generateWithdrawProof(note, merkleProof, recipient, assetId);
    }

    /**
     * Submit anonymous withdrawal to the mixer contract
     */
    async withdraw(
        relayerOrSender: Sender,
        proof: ZkWithdrawProof,
        gasFee: bigint = toNano('0.15')
    ) {
        const mixer = this.client.open(TonZkMixer.fromAddress(this.mixerAddress));

        await mixer.send(
            relayerOrSender,
            { value: gasFee },
            {
                $$type: 'Withdraw',
                piA: proof.piA,
                piB: proof.piB,
                piC: proof.piC,
                root: proof.root,
                nullifierHash: proof.nullifierHash,
                recipient: proof.recipient,
                assetId: proof.assetId,
            }
        );
    }

    /**
     * Fetch contract state and getters
     */
    async getState() {
        const mixer = this.client.open(TonZkMixer.fromAddress(this.mixerAddress));
        const [currentRoot, nextIndex, isPaused, totalDeposits, totalWithdrawals, owner] = await Promise.all([
            mixer.getCurrentRoot(),
            mixer.getNextIndex(),
            mixer.getIsPaused(),
            mixer.getTotalDeposits(),
            mixer.getTotalWithdrawals(),
            mixer.getOwner(),
        ]);

        return {
            currentRoot,
            nextIndex,
            isPaused,
            totalDeposits,
            totalWithdrawals,
            owner,
        };
    }
}
