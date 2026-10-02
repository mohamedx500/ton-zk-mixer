import * as path from 'path';
import * as fs from 'fs';
import { Address, Cell, beginCell } from '@ton/core';
const snarkjs = require('snarkjs');
const { groth16CompressProof } = require('export-ton-verifier');

import { DepositNote, MerkleProof, addressToScalar } from './crypto';

const wasmPath = path.join(__dirname, '..', 'circuits', 'mixer_js', 'mixer.wasm');
const zkeyPath = path.join(__dirname, '..', 'circuits', 'mixer_final.zkey');
const vkeyPath = path.join(__dirname, '..', 'circuits', 'verification_key.json');

export interface ZkWithdrawProof {
    piA: Cell;
    piB: Cell;
    piC: Cell;
    root: bigint;
    nullifierHash: bigint;
    recipient: Address;
    recipientScalar: bigint;
    assetId: bigint;
    rawProof: any;
    publicSignals: string[];
}

/**
 * Generate a complete Zero-Knowledge Groth16 Proof for Mixer withdrawal
 */
export async function generateWithdrawProof(
    note: DepositNote,
    merkleProof: MerkleProof,
    recipient: Address,
    assetId: bigint = 0n
): Promise<ZkWithdrawProof> {
    const recipientScalar = addressToScalar(recipient);

    const circuitInput = {
        root: merkleProof.root.toString(),
        nullifierHash: note.nullifierHash.toString(),
        recipient: recipientScalar.toString(),
        assetId: assetId.toString(),
        nullifier: note.nullifier.toString(),
        secret: note.secret.toString(),
        pathElements: merkleProof.pathElements.map((x) => x.toString()),
        pathIndices: merkleProof.pathIndices,
    };

    // 1. Generate Groth16 proof using snarkjs
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        circuitInput,
        wasmPath,
        zkeyPath
    );

    // 2. Off-chain verification check before submitting to TON blockchain
    const vkey = JSON.parse(fs.readFileSync(vkeyPath, 'utf-8'));
    const isValid = await snarkjs.groth16.verify(vkey, publicSignals, proof);
    if (!isValid) {
        throw new Error('Off-chain Groth16 proof verification failed!');
    }

    // 3. Compress G1/G2 proof points into BLS12-381 binary wire format for TVM
    const compressed = await groth16CompressProof(proof, publicSignals);

    const piA = beginCell().storeBuffer(compressed.pi_a).endCell();
    const piB = beginCell().storeBuffer(compressed.pi_b).endCell();
    const piC = beginCell().storeBuffer(compressed.pi_c).endCell();

    return {
        piA,
        piB,
        piC,
        root: merkleProof.root,
        nullifierHash: note.nullifierHash,
        recipient,
        recipientScalar,
        assetId,
        rawProof: proof,
        publicSignals,
    };
}
