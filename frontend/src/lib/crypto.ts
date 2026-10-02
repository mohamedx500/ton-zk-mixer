import { Address, beginCell } from '@ton/core';

/**
 * BLS12-381 Scalar Field Order r
 */
export const BLS12381_R = BigInt('52435875175126190479447740508185965837690552500527637822603658699938581184513');

// MiMC Round Constants Generator parameters
const MIMC_A = BigInt('6364136223846793005');
const MIMC_B = BigInt('1442695040888963407');
const MIMC_ROUNDS = 64;

/**
 * Deterministic MiMC Permutation matching Circom and Tact smart contract
 */
export function mimcPermutation(x: bigint, k: bigint): bigint {
    let state = ((x % BLS12381_R) + BLS12381_R) % BLS12381_R;
    let key = ((k % BLS12381_R) + BLS12381_R) % BLS12381_R;
    let c = BigInt(0);

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
    return mimcPermutation(input, BigInt(0));
}

/**
 * Generate a random 256-bit scalar within the BLS12-381 field
 * Works isomorphically in Browser (window.crypto) and Node.js
 */
export function randomFieldElement(): bigint {
    while (true) {
        const array = new Uint8Array(32);
        if (typeof window !== 'undefined' && window.crypto) {
            window.crypto.getRandomValues(array);
        } else {
            const nodeCrypto = require('crypto');
            const bytes = nodeCrypto.randomBytes(32);
            for (let i = 0; i < 32; i++) array[i] = bytes[i];
        }
        let hex = '';
        for (let i = 0; i < 32; i++) {
            hex += array[i].toString(16).padStart(2, '0');
        }
        const num = BigInt('0x' + hex);
        if (num < BLS12381_R && num > BigInt(0)) {
            return num;
        }
    }
}

export interface DepositNote {
    secret: bigint;
    nullifier: bigint;
    commitment: bigint;
    nullifierHash: bigint;
    amount: string; // e.g. "1.0 TON"
    encoded: string;
}

/**
 * Create a new deposit note with random secret and nullifier
 */
export function createDepositNote(amount: string = '1.0 TON'): DepositNote {
    const secret = randomFieldElement();
    const nullifier = randomFieldElement();

    const commitment = mimcHash2(nullifier, secret);
    const nullifierHash = mimcHash1(nullifier);

    const secretHex = secret.toString(16).padStart(64, '0');
    const nullifierHex = nullifier.toString(16).padStart(64, '0');
    const encoded = `tonzk-${amount.replace(/\s+/g, '-')}-${secretHex}-${nullifierHex}`;

    return {
        secret,
        nullifier,
        commitment,
        nullifierHash,
        amount,
        encoded,
    };
}

/**
 * Parse an encoded note string into a DepositNote object
 */
export function parseDepositNote(noteString: string): DepositNote {
    const trimmed = noteString.trim();
    const parts = trimmed.split('-');
    if (parts.length < 4 || parts[0] !== 'tonzk') {
        throw new Error('Invalid note format. Must start with "tonzk-"');
    }

    const nullifierHex = parts[parts.length - 1];
    const secretHex = parts[parts.length - 2];
    const amount = parts.slice(1, parts.length - 2).join(' ');

    const secret = BigInt('0x' + secretHex);
    const nullifier = BigInt('0x' + nullifierHex);

    if (secret >= BLS12381_R || nullifier >= BLS12381_R) {
        throw new Error('Note values exceed field modulus');
    }

    const commitment = mimcHash2(nullifier, secret);
    const nullifierHash = mimcHash1(nullifier);

    return {
        secret,
        nullifier,
        commitment,
        nullifierHash,
        amount,
        encoded: trimmed,
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
        this.zeros = [BigInt(0)];
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
            throw new Error(`Leaf index ${leafIndex} out of bounds (total leaves: ${this.leaves.length})`);
        }

        const pathElements: bigint[] = [];
        const pathIndices: number[] = [];

        let currentIdx = leafIndex;
        let currentLeaves = [...this.leaves];

        // Pad leaves to capacity for tree traversal
        const totalLeaves = 2 ** this.levels;
        while (currentLeaves.length < totalLeaves) {
            currentLeaves.push(BigInt(0));
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
