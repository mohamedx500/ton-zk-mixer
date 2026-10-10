export const TON_NETWORK = (process.env.NEXT_PUBLIC_TON_NETWORK || 'mainnet').toLowerCase() as
    | 'mainnet'
    | 'testnet';

export const IS_MAINNET = TON_NETWORK === 'mainnet';

export const MIXER_ADDRESS_STRING =
    process.env.NEXT_PUBLIC_MIXER_ADDRESS ||
    (IS_MAINNET ? 'UQBc0izk6rtfjroHgkzP4pEBUHfMCtSS1CGT988kw8DbqY7A' : '0QAz-Jy7XX5pMi925pFFHGzTgKRqirwK7CgtZMT5mGAhknET');

export const TONCENTER_RPC =
    process.env.NEXT_PUBLIC_TON_RPC_ENDPOINT ||
    (IS_MAINNET
        ? 'https://toncenter.com/api/v2/jsonRPC'
        : 'https://testnet.toncenter.com/api/v2/jsonRPC');

export const TONCENTER_API_KEY = process.env.NEXT_PUBLIC_TONCENTER_API_KEY || '';

export const RELAYER_ENDPOINT = process.env.NEXT_PUBLIC_RELAYER_URL || '/api/relay';

export const OP_DEPOSIT_TON = 0x1001;
export const OP_WITHDRAW = 0x1002;
export const OP_JETTON_NOTIFICATION = 0x7362d09c;

export const TON_DENOMINATION = BigInt(1_000_000_000); // 1.0 TON
export const DEPOSIT_GAS_FEE = BigInt(70_000_000); // 0.07 TON
export const WITHDRAW_GAS_FEE = BigInt(180_000_000); // 0.18 TON

export const EXPLORER_URL = (addr: string) =>
    IS_MAINNET ? `https://tonscan.org/address/${addr}` : `https://testnet.tonscan.org/address/${addr}`;

export const TX_EXPLORER_URL = (hash: string) =>
    IS_MAINNET ? `https://tonscan.org/tx/${hash}` : `https://testnet.tonscan.org/tx/${hash}`;

// Upfront Tiered Fee Structure
export interface PoolTier {
    id: string;
    poolAmount: string;
    fee: string;
    total: string;
    poolAmountNano: bigint;
    feeNano: bigint;
    totalNano: bigint;
}

export const UPFRONT_POOL_TIERS: Record<string, PoolTier> = {
    '1': {
        id: '1',
        poolAmount: '1 TON',
        fee: '0.20 TON',
        total: '1.20 TON',
        poolAmountNano: BigInt(1_000_000_000),
        feeNano: BigInt(200_000_000),
        totalNano: BigInt(1_200_000_000),
    },
    '10': {
        id: '10',
        poolAmount: '10 TON',
        fee: '0.50 TON',
        total: '10.50 TON',
        poolAmountNano: BigInt(10_000_000_000),
        feeNano: BigInt(500_000_000),
        totalNano: BigInt(10_500_000_000),
    },
    '100': {
        id: '100',
        poolAmount: '100 TON',
        fee: '2.00 TON',
        total: '102.00 TON',
        poolAmountNano: BigInt(100_000_000_000),
        feeNano: BigInt(2_000_000_000),
        totalNano: BigInt(102_000_000_000),
    },
};

// Backwards-compatible aliases
export const TESTNET_EXPLORER_URL = EXPLORER_URL;
export const TESTNET_TX_EXPLORER_URL = TX_EXPLORER_URL;
export const TONCENTER_TESTNET_RPC = TONCENTER_RPC;
