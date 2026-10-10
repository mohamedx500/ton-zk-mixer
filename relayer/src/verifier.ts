import * as fs from 'fs';
import { Address, beginCell } from '@ton/core';
import { TonClient } from '@ton/ton';
import { VERIFICATION_KEY_PATH, MIXER_ADDRESS } from './config';

const snarkjs = require('snarkjs');

const BLS12381_R = 52435875175126190479447740508185965837690552500527637822603658699938581184513n;

export function addressToScalar(address: Address): bigint {
    const s = beginCell().storeAddress(address).endCell().beginParse();
    s.skip(11);
    const addrHash = s.loadUintBig(256);
    return addrHash % BLS12381_R;
}

let cachedVKey: any = null;

function getVerificationKey() {
    if (!cachedVKey) {
        if (!fs.existsSync(VERIFICATION_KEY_PATH)) {
            throw new Error(`Verification key file not found at: ${VERIFICATION_KEY_PATH}`);
        }
        cachedVKey = JSON.parse(fs.readFileSync(VERIFICATION_KEY_PATH, 'utf-8'));
    }
    return cachedVKey;
}

export interface VerificationRequest {
    rawProof: any;
    publicSignals: string[];
    root: string;
    nullifierHash: string;
    recipient: string;
    assetId: string;
}

/**
 * Perform comprehensive Anti-Spam verification on incoming relay requests:
 * 1. Off-chain cryptographic verification using snarkjs
 * 2. Signal binding validation (root, nullifierHash, recipient, assetId)
 * 3. On-chain validation: Nullifier unspent, Root known, Mixer unpaused
 */
export async function verifyRelayRequest(
    client: TonClient,
    req: VerificationRequest
): Promise<{
    isValid: boolean;
    root: bigint;
    nullifierHash: bigint;
    recipientAddress: Address;
    assetId: bigint;
}> {
    const vkey = getVerificationKey();

    // 1. Off-Chain Groth16 cryptographic verification
    const isValidProof = await snarkjs.groth16.verify(vkey, req.publicSignals, req.rawProof);
    if (!isValidProof) {
        throw new Error('Anti-Spam Reject: Groth16 cryptographic proof is INVALID.');
    }

    const rootBigInt = BigInt(req.root);
    const nullifierBigInt = BigInt(req.nullifierHash);
    const assetIdBigInt = BigInt(req.assetId || '0');
    const recipientAddr = Address.parse(req.recipient);
    const expectedRecipientScalar = addressToScalar(recipientAddr);

    // 2. Validate Public Signals match payload arguments exactly
    if (
        req.publicSignals[0] !== rootBigInt.toString() ||
        req.publicSignals[1] !== nullifierBigInt.toString() ||
        req.publicSignals[2] !== expectedRecipientScalar.toString() ||
        req.publicSignals[3] !== assetIdBigInt.toString()
    ) {
        throw new Error('Anti-Spam Reject: Public signals do not match request parameters.');
    }

    // 3. On-Chain verification against TonZkMixer contract
    const mixerAddr = Address.parse(MIXER_ADDRESS);

    // Check Nullifier Spent
    const nullifierRes = await client.runMethod(mixerAddr, 'isNullifierSpent', [
        { type: 'int', value: nullifierBigInt },
    ]);
    const isSpent = nullifierRes.stack.readBoolean();
    if (isSpent) {
        throw new Error('Anti-Spam Reject: Nullifier has ALREADY been spent on-chain.');
    }

    // Check Known Root
    const rootRes = await client.runMethod(mixerAddr, 'isKnownRoot', [
        { type: 'int', value: rootBigInt },
    ]);
    const isKnown = rootRes.stack.readBoolean();
    if (!isKnown) {
        throw new Error('Anti-Spam Reject: Root is unknown to the on-chain Merkle tree.');
    }

    // Check Paused status
    const pausedRes = await client.runMethod(mixerAddr, 'isPaused');
    const isPaused = pausedRes.stack.readBoolean();
    if (isPaused) {
        throw new Error('Anti-Spam Reject: Mixer contract is currently PAUSED by admin.');
    }

    return {
        isValid: true,
        root: rootBigInt,
        nullifierHash: nullifierBigInt,
        recipientAddress: recipientAddr,
        assetId: assetIdBigInt,
    };
}
