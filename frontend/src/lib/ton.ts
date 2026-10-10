import { Address, beginCell, Cell, fromNano, toNano } from '@ton/core';
import { TonClient } from '@ton/ton';
import {
    MIXER_ADDRESS_STRING,
    TONCENTER_RPC,
    TONCENTER_API_KEY,
    IS_MAINNET,
    OP_DEPOSIT_TON,
    OP_WITHDRAW,
    TON_DENOMINATION,
    DEPOSIT_GAS_FEE,
    WITHDRAW_GAS_FEE,
} from './contracts';
import { MerkleTree } from './crypto';
import { ZkWithdrawProof } from './prover';

let clientInstance: TonClient | null = null;

export function getTonClient(): TonClient {
    if (clientInstance) return clientInstance;

    const client = new TonClient({
        endpoint: TONCENTER_RPC,
        apiKey: TONCENTER_API_KEY ? TONCENTER_API_KEY : undefined,
    });
    const api = (client as any).api;
    const originalDoCall = api.doCall.bind(api);
    let lastCallTime = 0;
    let callQueue: Promise<any> = Promise.resolve();

    api.doCall = async function (method: string, body: any, codec: any) {
        return new Promise((resolve, reject) => {
            callQueue = callQueue.then(async () => {
                let attempts = 0;
                while (attempts < 6) {
                    const now = Date.now();
                    const elapsed = now - lastCallTime;
                    if (elapsed < 1400) {
                        await new Promise((r) => setTimeout(r, 1400 - elapsed));
                    }
                    lastCallTime = Date.now();

                    try {
                        const result = await originalDoCall(method, body, codec);
                        resolve(result);
                        return;
                    } catch (err: any) {
                        attempts++;
                        const is429 =
                            (err?.message && err.message.includes('429')) ||
                            (err?.response && err.response.status === 429);

                        if (is429) {
                            await new Promise((r) => setTimeout(r, 3500));
                        } else if (attempts >= 6) {
                            reject(err);
                            return;
                        } else {
                            await new Promise((r) => setTimeout(r, 2000));
                        }
                    }
                }
            }).catch(reject);
        });
    };

    clientInstance = client;
    return client;
}

export interface MixerProtocolState {
    address: string;
    balance: string;
    currentRoot: string;
    nextIndex: number;
    isPaused: boolean;
    totalDeposits: number;
    totalWithdrawals: number;
    anonymitySetSize: number;
}

/**
 * Fetch live on-chain stats and state of the Mixer smart contract
 */
export async function fetchMixerState(): Promise<MixerProtocolState> {
    const client = getTonClient();
    const mixerAddr = Address.parse(MIXER_ADDRESS_STRING);

    const [state, rootRes, nextIdxRes, pausedRes, depositsRes, withdrawalsRes] = await Promise.all([
        client.getContractState(mixerAddr),
        client.runMethod(mixerAddr, 'currentRoot').catch(() => null),
        client.runMethod(mixerAddr, 'nextIndex').catch(() => null),
        client.runMethod(mixerAddr, 'isPaused').catch(() => null),
        client.runMethod(mixerAddr, 'totalDeposits').catch(() => null),
        client.runMethod(mixerAddr, 'totalWithdrawals').catch(() => null),
    ]);

    const currentRoot = rootRes ? rootRes.stack.readBigNumber().toString() : '0';
    const nextIndex = nextIdxRes ? Number(nextIdxRes.stack.readBigNumber()) : 0;
    const isPaused = pausedRes ? pausedRes.stack.readBoolean() : false;
    const totalDeposits = depositsRes ? Number(depositsRes.stack.readBigNumber()) : nextIndex;
    const totalWithdrawals = withdrawalsRes ? Number(withdrawalsRes.stack.readBigNumber()) : 0;

    return {
        address: MIXER_ADDRESS_STRING,
        balance: fromNano(state.balance),
        currentRoot,
        nextIndex,
        isPaused,
        totalDeposits,
        totalWithdrawals,
        anonymitySetSize: Math.max(0, nextIndex - totalWithdrawals),
    };
}

/**
 * Check if a specific nullifier hash has already been spent on-chain
 */
export async function checkNullifierSpent(nullifierHash: bigint): Promise<boolean> {
    const client = getTonClient();
    const mixerAddr = Address.parse(MIXER_ADDRESS_STRING);

    try {
        const res = await client.runMethod(mixerAddr, 'isNullifierSpent', [
            { type: 'int', value: nullifierHash },
        ]);
        return res.stack.readBoolean();
    } catch (_) {
        return false;
    }
}

/**
 * Check if a root is currently a known valid historical root
 */
export async function checkKnownRoot(root: bigint): Promise<boolean> {
    const client = getTonClient();
    const mixerAddr = Address.parse(MIXER_ADDRESS_STRING);

    try {
        const res = await client.runMethod(mixerAddr, 'isKnownRoot', [
            { type: 'int', value: root },
        ]);
        return res.stack.readBoolean();
    } catch (_) {
        return false;
    }
}

/**
 * Synchronize Merkle tree directly from on-chain transaction history
 */
export async function syncTreeFromBlockchain(
    onProgress?: (msg: string) => void
): Promise<MerkleTree> {
    onProgress?.('Fetching on-chain deposit history...');
    const client = getTonClient();
    const mixerAddr = Address.parse(MIXER_ADDRESS_STRING);

    const txs = await client.getTransactions(mixerAddr, { limit: 100 });
    const chronological = [...txs].reverse();
    const tree = new MerkleTree(8);

    let count = 0;
    for (const tx of chronological) {
        if (tx.inMessage && tx.inMessage.info.type === 'internal') {
            const body = tx.inMessage.body.beginParse();
            if (body.remainingBits >= 32 + 256) {
                const op = body.loadUint(32);
                if (op === OP_DEPOSIT_TON) {
                    const commitment = body.loadUintBig(256);
                    tree.insert(commitment);
                    count++;
                } else if (op === 0x7362d09c) {
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
                        tree.insert(commitment);
                        count++;
                    }
                }
            }
        }
    }

    onProgress?.(`Synced ${count} historical commitments from blockchain.`);
    return tree;
}

/**
 * Construct TonConnect SendTransaction payload for Deposit
 */
export function buildDepositTransaction(commitment: bigint, value: bigint = TON_DENOMINATION + DEPOSIT_GAS_FEE) {
    const bodyCell = beginCell()
        .storeUint(OP_DEPOSIT_TON, 32)
        .storeUint(commitment, 256)
        .endCell();

    return {
        validUntil: Math.floor(Date.now() / 1000) + 360,
        messages: [
            {
                address: MIXER_ADDRESS_STRING,
                amount: value.toString(),
                payload: bodyCell.toBoc().toString('base64'),
            },
        ],
    };
}

/**
 * Construct TonConnect SendTransaction payload for Anonymous Withdrawal
 */
export function buildWithdrawTransaction(proof: ZkWithdrawProof, gasFee: bigint = WITHDRAW_GAS_FEE) {
    const b0 = beginCell();
    b0.storeUint(OP_WITHDRAW, 32);
    b0.storeRef(proof.piA);
    b0.storeRef(proof.piB);

    const b1 = beginCell();
    b1.storeRef(proof.piC);
    b1.storeUint(proof.root, 256);
    b1.storeUint(proof.nullifierHash, 256);
    b1.storeAddress(proof.recipient);

    const b2 = beginCell();
    b2.storeUint(proof.assetId, 256);
    b1.storeRef(b2.endCell());

    b0.storeRef(b1.endCell());
    const bodyCell = b0.endCell();

    return {
        validUntil: Math.floor(Date.now() / 1000) + 360,
        messages: [
            {
                address: MIXER_ADDRESS_STRING,
                amount: gasFee.toString(),
                payload: bodyCell.toBoc().toString('base64'),
            },
        ],
    };
}
