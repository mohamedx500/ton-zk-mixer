import * as dotenv from 'dotenv';
import * as path from 'path';

// Load from root .env first, then fallback to local relayer/.env
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

export const TON_NETWORK = (process.env.TON_NETWORK || 'testnet').toLowerCase() as 'mainnet' | 'testnet';
export const IS_MAINNET = TON_NETWORK === 'mainnet';

export const PORT = process.env.RELAYER_PORT
    ? parseInt(process.env.RELAYER_PORT, 10)
    : process.env.PORT
    ? parseInt(process.env.PORT, 10)
    : 4000;

export const MIXER_ADDRESS =
    process.env.MIXER_CONTRACT_ADDRESS ||
    process.env.MIXER_ADDRESS ||
    (IS_MAINNET ? '' : '0QAz-Jy7XX5pMi925pFFHGzTgKRqirwK7CgtZMT5mGAhknET');

export const TON_RPC_ENDPOINT =
    process.env.TON_RPC_ENDPOINT ||
    (IS_MAINNET
        ? 'https://toncenter.com/api/v2/jsonRPC'
        : 'https://testnet.toncenter.com/api/v2/jsonRPC');

export const TONCENTER_API_KEY = process.env.TONCENTER_API_KEY || '';
export const RELAYER_MNEMONIC = process.env.RELAYER_MNEMONIC || '';

export const VERIFICATION_KEY_PATH = path.join(__dirname, '..', 'config', 'verification_key.json');
export const RELAYER_WALLET_FILE = path.join(__dirname, '..', '.relayer_wallet.json');

// Gas fee the relayer attaches to execute the BLS pairing and payout transfer
export const RELAY_GAS_FEE = process.env.RELAYER_GAS_FEE
    ? BigInt(process.env.RELAYER_GAS_FEE)
    : 180_000_000n; // 0.18 TON default
