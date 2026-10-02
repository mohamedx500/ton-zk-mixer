import { Address, beginCell } from '@ton/core';
import * as crypto from 'crypto';

/**
 * BLS12-381 Scalar Field Order r
 */
export const BLS12381_R = 52435875175126190479447740508185965837690552500527637822603658699938581184513n;

// MiMC Round Constants Generator parameters
const MIMC_A = 6364136223846793005n;
const MIMC_B = 1442695040888963407n;
const MIMC_ROUNDS = 64;

/**
 * Deterministic MiMC Permutation matching Circom and Tact implementation
 */
export function mimcPermutation(x: bigint, k: bigint): bigint {
    let state = (x % BLS12381_R + BLS12381_R) % BLS12381_R;
    let key = (k % BLS12381_R + BLS12381_R) % BLS12381_R;
    let c = 0n;

    for (let i = 0; i < MIMC_ROUNDS; i++) {
        const t = (state + key + c) % BLS12381_R;
        const t2 = (t * t) % BLS12381_R;
        const t4 = (t2 * t2) % BLS12381_R;
        state = (t4 * t) % BLS12381_R;
        c = (c * MIMC_A + MIMC_B) % BLS12381_R;
    }

    return (state + key) % BLS12381_R;
}

/**
 * 2-to-1 compressor hash: H(left, right) = MiMC(left, right)
 */
export function mimcHash2(left: bigint, right: bigint): bigint {
    return mimcPermutation(left, right);
}

/**
 * 1-input hash: H(in) = MiMC(in, 0)
 */
export function mimcHash1(input: bigint): bigint {
    return mimcPermutation(input, 0n);
}

/**
 * Generate a random scalar within the BLS12-381 field
 */
export function randomFieldElement(): bigint {
    while (true) {
        const bytes = crypto.randomBytes(32);
        const num = BigInt('0x' + bytes.toString('hex'));
        if (num < BLS12381_R) {
            return num;
        }
    }
}

/**
 * Deposit note data structure
 */
export interface DepositNote {
    secret: bigint;
    nullifier: bigint;
    commitment: bigint;
    nullifierHash: bigint;
}

/**
 * Create a new random deposit note
 */
export function createDepositNote(): DepositNote {
    const secret = randomFieldElement();
    const nullifier = randomFieldElement();
    const commitment = mimcHash2(nullifier, secret);
    const nullifierHash = mimcHash1(nullifier);

    return {
        secret,
        nullifier,
        commitment,
        nullifierHash,
    };
}

/**
 * Convert TON Address to 256-bit scalar matching Tact contract's parseAddressScalar
 */
export function addressToScalar(address: Address): bigint {
    const s = beginCell().storeAddress(address).endCell().beginParse();
    s.skip(11);
    const addrHash = s.loadUintBig(256);
    return addrHash % BLS12381_R;
}

/**
 * Merkle Tree Proof structure
 */
export interface MerkleProof {
    root: bigint;
    pathElements: bigint[];
    pathIndices: number[];
}

/**
 * Off-chain Merkle Tree (matches smart contract incremental tree)
 */
export class MerkleTree {
    readonly levels: number;
    readonly capacity: number;
    readonly zeros: bigint[];
    leaves: bigint[];

    constructor(levels: number = 8) {
        this.levels = levels;
        this.capacity = 2 ** levels;
        this.leaves = [];

        // Precompute empty level zeros
        this.zeros = [0n];
        for (let i = 0; i < levels; i++) {
            this.zeros.push(mimcHash2(this.zeros[i], this.zeros[i]));
        }
    }

    insert(leaf: bigint): number {
        if (this.leaves.length >= this.capacity) {
            throw new Error(`Merkle tree is full (capacity ${this.capacity})`);
        }
        const index = this.leaves.length;
        this.leaves.push(leaf);
        return index;
    }

    getRoot(): bigint {
        return this.computeSubtreeRoot(0, this.levels);
    }

    private computeSubtreeRoot(startIndex: number, level: number): bigint {
        if (level === 0) {
            return this.leaves[startIndex] ?? this.zeros[0];
        }

        const half = 2 ** (level - 1);
        const left = this.computeSubtreeRoot(startIndex, level - 1);
        const right = this.computeSubtreeRoot(startIndex + half, level - 1);

        return mimcHash2(left, right);
    }

    getProof(leafIndex: number): MerkleProof {
        if (leafIndex < 0 || leafIndex >= this.leaves.length) {
            throw new Error(`Leaf index ${leafIndex} out of bounds`);
        }

        const pathElements: bigint[] = [];
        const pathIndices: number[] = [];

        let currentIdx = leafIndex;
        let currentLeaves = [...this.leaves];

        // Pad leaves to capacity for tree traversal
        const totalLeaves = 2 ** this.levels;
        while (currentLeaves.length < totalLeaves) {
            currentLeaves.push(0n);
        }

        for (let level = 0; level < this.levels; level++) {
            const isRight = currentIdx % 2;
            pathIndices.push(isRight);

            const siblingIdx = isRight ? currentIdx - 1 : currentIdx + 1;
            pathElements.push(currentLeaves[siblingIdx] ?? this.zeros[level]);

            const nextLevelLeaves: bigint[] = [];
            for (let i = 0; i < currentLeaves.length; i += 2) {
                const l = currentLeaves[i];
                const r = currentLeaves[i + 1] ?? this.zeros[level];
                nextLevelLeaves.push(mimcHash2(l, r));
            }

            currentLeaves = nextLevelLeaves;
            currentIdx = Math.floor(currentIdx / 2);
        }

        return {
            root: currentLeaves[0],
            pathElements,
            pathIndices,
        };
    }
}
