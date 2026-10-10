import { Address, Cell, beginCell } from '@ton/core';
import { Buffer } from 'buffer';
import { buildBls12381, utils } from 'ffjavascript';
import { DepositNote, MerkleProof, addressToScalar } from './crypto';

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
    proofTimeMs: number;
}

// Cached wasm and zkey buffers in browser memory to avoid re-fetching
let cachedWasm: Uint8Array | null = null;
let cachedZkey: Uint8Array | null = null;

async function loadCircuitArtifacts(
    onProgress?: (step: string) => void
): Promise<{ wasm: Uint8Array; zkey: Uint8Array }> {
    if (cachedWasm && cachedZkey) {
        onProgress?.('Using cached circuit artifacts...');
        return { wasm: cachedWasm, zkey: cachedZkey };
    }

    onProgress?.('Fetching circuit WASM and proving key (~1.9 MB)...');

    const [wasmRes, zkeyRes] = await Promise.all([
        fetch('/circuits/mixer.wasm'),
        fetch('/circuits/mixer_final.zkey'),
    ]);

    if (!wasmRes.ok || !zkeyRes.ok) {
        throw new Error('Failed to load circuit artifacts from server');
    }

    const [wasmBuf, zkeyBuf] = await Promise.all([
        wasmRes.arrayBuffer(),
        zkeyRes.arrayBuffer(),
    ]);

    cachedWasm = new Uint8Array(wasmBuf);
    cachedZkey = new Uint8Array(zkeyBuf);

    return { wasm: cachedWasm, zkey: cachedZkey };
}

/**
 * Compress BLS12-381 G1/G2 affine coordinates into serialized compressed wire format
 * matching the TON TVM BLS12-381 pairing specification.
 */
async function compressGroth16Proof(proof: any): Promise<{
    piA: Uint8Array;
    piB: Uint8Array;
    piC: Uint8Array;
}> {
    const curve = await buildBls12381();
    try {
        const proofProc = utils.unstringifyBigInts(proof);

        // G1 compressed for pi_a (48 bytes)
        const p1 = curve.G1.fromObject(proofProc.pi_a);
        const buffA = new Uint8Array(48);
        curve.G1.toRprCompressed(buffA, 0, p1);
        if (buffA[0] & 128) buffA[0] |= 32;
        buffA[0] |= 128;

        // G2 compressed for pi_b (96 bytes)
        const p2 = curve.G2.fromObject(proofProc.pi_b);
        const buffB = new Uint8Array(96);
        curve.G2.toRprCompressed(buffB, 0, p2);
        if (buffB[0] & 128) buffB[0] |= 32;
        buffB[0] |= 128;

        // G1 compressed for pi_c (48 bytes)
        const p3 = curve.G1.fromObject(proofProc.pi_c);
        const buffC = new Uint8Array(48);
        curve.G1.toRprCompressed(buffC, 0, p3);
        if (buffC[0] & 128) buffC[0] |= 32;
        buffC[0] |= 128;

        return {
            piA: buffA,
            piB: buffB,
            piC: buffC,
        };
    } finally {
        if (curve && typeof curve.terminate === 'function') {
            await curve.terminate();
        }
    }
}

/**
 * Generate a complete Zero-Knowledge Groth16 Proof 100% in the user's browser
 */
export async function generateClientWithdrawProof(
    note: DepositNote,
    merkleProof: MerkleProof,
    recipient: Address,
    assetId: bigint = BigInt(0),
    onProgress?: (step: string) => void
): Promise<ZkWithdrawProof> {
    const startTime = Date.now();
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

    onProgress?.('Loading circuit artifacts into memory...');
    const { wasm, zkey } = await loadCircuitArtifacts(onProgress);

    onProgress?.('Computing witness & executing Groth16 prover...');
    const snarkjs = await import('snarkjs');
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        circuitInput,
        wasm,
        zkey
    );

    onProgress?.('Compressing BLS12-381 G1 & G2 curve points...');
    const compressed = await compressGroth16Proof(proof);

    // Pack into TON Cell buffers
    const piA = beginCell().storeBuffer(Buffer.from(compressed.piA)).endCell();
    const piB = beginCell().storeBuffer(Buffer.from(compressed.piB)).endCell();
    const piC = beginCell().storeBuffer(Buffer.from(compressed.piC)).endCell();

    const proofTimeMs = Date.now() - startTime;
    onProgress?.(`ZK-SNARK proof generated successfully in ${proofTimeMs}ms!`);

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
        proofTimeMs,
    };
}
