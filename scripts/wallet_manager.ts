import { mnemonicNew, mnemonicToPrivateKey, KeyPair } from '@ton/crypto';
import { WalletContractV4, TonClient, fromNano } from '@ton/ton';
import { Address } from '@ton/core';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Interface representing a managed TON Testnet Wallet
 */
export interface ManagedWallet {
    mnemonic: string[];
    publicKey: string;
    secretKey: string;
    address: string;
    rawAddress: string;
}

const WALLET_FILE = path.join(__dirname, '..', '.testnet_wallet.json');

/**
 * Generate a new TON testnet wallet or load the existing saved wallet.
 * This guarantees idempotent runs during testing and deployment.
 */
export async function getOrCreateTestWallet(): Promise<{
    wallet: ManagedWallet;
    keyPair: KeyPair;
    contract: WalletContractV4;
}> {
    let mnemonic: string[];

    if (fs.existsSync(WALLET_FILE)) {
        const data = JSON.parse(fs.readFileSync(WALLET_FILE, 'utf-8'));
        mnemonic = data.mnemonic;
        console.log('📂 Loaded existing testnet wallet from .testnet_wallet.json');
    } else {
        mnemonic = await mnemonicNew(24);
        console.log('✨ Generated brand new 24-word testnet mnemonic');
    }

    const keyPair = await mnemonicToPrivateKey(mnemonic);
    const contract = WalletContractV4.create({
        workchain: 0,
        publicKey: keyPair.publicKey,
    });

    const testnetAddress = contract.address.toString({ testOnly: true, bounceable: false });
    const rawAddress = contract.address.toRawString();

    const managedWallet: ManagedWallet = {
        mnemonic,
        publicKey: keyPair.publicKey.toString('hex'),
        secretKey: keyPair.secretKey.toString('hex'),
        address: testnetAddress,
        rawAddress,
    };

    if (!fs.existsSync(WALLET_FILE)) {
        fs.writeFileSync(WALLET_FILE, JSON.stringify(managedWallet, null, 2), 'utf-8');
        console.log(`💾 Saved wallet credentials to ${WALLET_FILE}`);
    }

    return { wallet: managedWallet, keyPair, contract };
}

/**
 * Check balance of the wallet on TON Testnet
 */
export async function getWalletBalance(addressStr: string): Promise<bigint> {
    const endpoint = 'https://testnet.toncenter.com/api/v2/jsonRPC';
    const client = new TonClient({ endpoint });
    try {
        const address = Address.parse(addressStr);
        const balance = await client.getBalance(address);
        return balance;
    } catch (e) {
        console.warn('⚠️ Could not fetch balance from TON Testnet RPC:', e);
        return 0n;
    }
}

// Standalone execution
if (require.main === module) {
    (async () => {
        const { wallet } = await getOrCreateTestWallet();
        console.log('\n======================================================');
        console.log('🔑 TON TESTNET WALLET GENERATED:');
        console.log(`Address (Testnet Non-bounceable): ${wallet.address}`);
        console.log(`Address (Raw):                    ${wallet.rawAddress}`);
        console.log('======================================================\n');

        const balance = await getWalletBalance(wallet.address);
        console.log(`Current Balance: ${fromNano(balance)} TON\n`);
    })();
}
