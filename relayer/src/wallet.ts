import * as fs from 'fs';
import { mnemonicNew, mnemonicToPrivateKey, KeyPair } from '@ton/crypto';
import { WalletContractV4, TonClient, fromNano, toNano } from '@ton/ton';
import { Address } from '@ton/core';
import {
    RELAYER_WALLET_FILE,
    TON_RPC_ENDPOINT,
    TONCENTER_API_KEY,
    RELAYER_MNEMONIC,
    IS_MAINNET,
} from './config';

export interface RelayerWalletData {
    mnemonic: string[];
    publicKey: string;
    secretKey: string;
    address: string;
}

let clientInstance: TonClient | null = null;

export function getRelayerTonClient(): TonClient {
    if (clientInstance) return clientInstance;

    const client = new TonClient({
        endpoint: TON_RPC_ENDPOINT,
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

export async function getOrCreateRelayerWallet(): Promise<{
    walletData: RelayerWalletData;
    keyPair: KeyPair;
    contract: WalletContractV4;
    client: TonClient;
}> {
    const client = getRelayerTonClient();

    let walletData: RelayerWalletData;

    if (RELAYER_MNEMONIC && RELAYER_MNEMONIC.trim().split(/\s+/).length >= 12) {
        // Loaded directly from .env configuration
        const mnemonic = RELAYER_MNEMONIC.trim().split(/\s+/);
        const keyPair = await mnemonicToPrivateKey(mnemonic);
        const contract = WalletContractV4.create({
            workchain: 0,
            publicKey: keyPair.publicKey,
        });

        walletData = {
            mnemonic,
            publicKey: keyPair.publicKey.toString('hex'),
            secretKey: keyPair.secretKey.toString('hex'),
            address: contract.address.toString({
                testOnly: !IS_MAINNET,
                bounceable: false,
            }),
        };
    } else if (fs.existsSync(RELAYER_WALLET_FILE)) {
        walletData = JSON.parse(fs.readFileSync(RELAYER_WALLET_FILE, 'utf-8'));
    } else {
        const mnemonic = await mnemonicNew(24);
        const keyPair = await mnemonicToPrivateKey(mnemonic);
        const contract = WalletContractV4.create({
            workchain: 0,
            publicKey: keyPair.publicKey,
        });

        walletData = {
            mnemonic,
            publicKey: keyPair.publicKey.toString('hex'),
            secretKey: keyPair.secretKey.toString('hex'),
            address: contract.address.toString({
                testOnly: !IS_MAINNET,
                bounceable: false,
            }),
        };

        fs.writeFileSync(RELAYER_WALLET_FILE, JSON.stringify(walletData, null, 2), 'utf-8');
    }

    const keyPair: KeyPair = {
        publicKey: Buffer.from(walletData.publicKey, 'hex'),
        secretKey: Buffer.from(walletData.secretKey, 'hex'),
    };

    const contract = WalletContractV4.create({
        workchain: 0,
        publicKey: keyPair.publicKey,
    });

    return {
        walletData,
        keyPair,
        contract,
        client,
    };
}

export async function getRelayerBalance(): Promise<bigint> {
    const { contract, client } = await getOrCreateRelayerWallet();
    return await client.getBalance(contract.address);
}
