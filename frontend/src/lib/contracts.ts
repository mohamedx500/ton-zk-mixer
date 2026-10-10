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
    label: string;
    category: 'micro' | 'standard' | 'whale';
    poolAmount: string;
    fee: string;
    total: string;
    poolAmountNano: bigint;
    feeNano: bigint;
    totalNano: bigint;
}

export const POOL_TIER_IDS = [
    '0.05',
    '0.1',
    '0.5',
    '1.0',
    '5.0',
    '10.0',
    '50.0',
    '100.0',
    '500.0',
] as const;

export type PoolTierId = (typeof POOL_TIER_IDS)[number];

export const UPFRONT_POOL_TIERS: Record<string, PoolTier> = {
    '0.05': {
        id: '0.05',
        label: '🦐 Micro',
        category: 'micro',
        poolAmount: '0.05 TON',
        fee: '0.01 TON',
        total: '0.06 TON',
        poolAmountNano: BigInt(50_000_000),
        feeNano: BigInt(10_000_000),
        totalNano: BigInt(60_000_000),
    },
    '0.1': {
        id: '0.1',
        label: '🦀 Shrimp',
        category: 'micro',
        poolAmount: '0.1 TON',
        fee: '0.02 TON',
        total: '0.12 TON',
        poolAmountNano: BigInt(100_000_000),
        feeNano: BigInt(20_000_000),
        totalNano: BigInt(120_000_000),
    },
    '0.10': {
        id: '0.1',
        label: '🦀 Shrimp',
        category: 'micro',
        poolAmount: '0.1 TON',
        fee: '0.02 TON',
        total: '0.12 TON',
        poolAmountNano: BigInt(100_000_000),
        feeNano: BigInt(20_000_000),
        totalNano: BigInt(120_000_000),
    },
    '0.5': {
        id: '0.5',
        label: '🐟 Fish',
        category: 'micro',
        poolAmount: '0.5 TON',
        fee: '0.08 TON',
        total: '0.58 TON',
        poolAmountNano: BigInt(500_000_000),
        feeNano: BigInt(80_000_000),
        totalNano: BigInt(580_000_000),
    },
    '0.50': {
        id: '0.5',
        label: '🐟 Fish',
        category: 'micro',
        poolAmount: '0.5 TON',
        fee: '0.08 TON',
        total: '0.58 TON',
        poolAmountNano: BigInt(500_000_000),
        feeNano: BigInt(80_000_000),
        totalNano: BigInt(580_000_000),
    },
    '1.0': {
        id: '1.0',
        label: '🐬 Standard',
        category: 'standard',
        poolAmount: '1.0 TON',
        fee: '0.20 TON',
        total: '1.20 TON',
        poolAmountNano: BigInt(1_000_000_000),
        feeNano: BigInt(200_000_000),
        totalNano: BigInt(1_200_000_000),
    },
    '1': {
        id: '1.0',
        label: '🐬 Standard',
        category: 'standard',
        poolAmount: '1.0 TON',
        fee: '0.20 TON',
        total: '1.20 TON',
        poolAmountNano: BigInt(1_000_000_000),
        feeNano: BigInt(200_000_000),
        totalNano: BigInt(1_200_000_000),
    },
    '5.0': {
        id: '5.0',
        label: '🦈 Shark',
        category: 'standard',
        poolAmount: '5.0 TON',
        fee: '0.35 TON',
        total: '5.35 TON',
        poolAmountNano: BigInt(5_000_000_000),
        feeNano: BigInt(350_000_000),
        totalNano: BigInt(5_350_000_000),
    },
    '5': {
        id: '5.0',
        label: '🦈 Shark',
        category: 'standard',
        poolAmount: '5.0 TON',
        fee: '0.35 TON',
        total: '5.35 TON',
        poolAmountNano: BigInt(5_000_000_000),
        feeNano: BigInt(350_000_000),
        totalNano: BigInt(5_350_000_000),
    },
    '10.0': {
        id: '10.0',
        label: '🐋 Orca',
        category: 'standard',
        poolAmount: '10.0 TON',
        fee: '0.50 TON',
        total: '10.50 TON',
        poolAmountNano: BigInt(10_000_000_000),
        feeNano: BigInt(500_000_000),
        totalNano: BigInt(10_500_000_000),
    },
    '10': {
        id: '10.0',
        label: '🐋 Orca',
        category: 'standard',
        poolAmount: '10.0 TON',
        fee: '0.50 TON',
        total: '10.50 TON',
        poolAmountNano: BigInt(10_000_000_000),
        feeNano: BigInt(500_000_000),
        totalNano: BigInt(10_500_000_000),
    },
    '50.0': {
        id: '50.0',
        label: '🐳 Whale',
        category: 'whale',
        poolAmount: '50.0 TON',
        fee: '1.20 TON',
        total: '51.20 TON',
        poolAmountNano: BigInt(50_000_000_000),
        feeNano: BigInt(1_200_000_000),
        totalNano: BigInt(51_200_000_000),
    },
    '50': {
        id: '50.0',
        label: '🐳 Whale',
        category: 'whale',
        poolAmount: '50.0 TON',
        fee: '1.20 TON',
        total: '51.20 TON',
        poolAmountNano: BigInt(50_000_000_000),
        feeNano: BigInt(1_200_000_000),
        totalNano: BigInt(51_200_000_000),
    },
    '100.0': {
        id: '100.0',
        label: '🌊 Jumbo',
        category: 'whale',
        poolAmount: '100.0 TON',
        fee: '2.00 TON',
        total: '102.00 TON',
        poolAmountNano: BigInt(100_000_000_000),
        feeNano: BigInt(2_000_000_000),
        totalNano: BigInt(102_000_000_000),
    },
    '100': {
        id: '100.0',
        label: '🌊 Jumbo',
        category: 'whale',
        poolAmount: '100.0 TON',
        fee: '2.00 TON',
        total: '102.00 TON',
        poolAmountNano: BigInt(100_000_000_000),
        feeNano: BigInt(2_000_000_000),
        totalNano: BigInt(102_000_000_000),
    },
    '500.0': {
        id: '500.0',
        label: '👑 Leviathan',
        category: 'whale',
        poolAmount: '500.0 TON',
        fee: '5.00 TON',
        total: '505.00 TON',
        poolAmountNano: BigInt(500_000_000_000),
        feeNano: BigInt(5_000_000_000),
        totalNano: BigInt(505_000_000_000),
    },
    '500': {
        id: '500.0',
        label: '👑 Leviathan',
        category: 'whale',
        poolAmount: '500.0 TON',
        fee: '5.00 TON',
        total: '505.00 TON',
        poolAmountNano: BigInt(500_000_000_000),
        feeNano: BigInt(5_000_000_000),
        totalNano: BigInt(505_000_000_000),
    },
};

// Backwards-compatible aliases
export const TESTNET_EXPLORER_URL = EXPLORER_URL;
export const TESTNET_TX_EXPLORER_URL = TX_EXPLORER_URL;
export const TONCENTER_TESTNET_RPC = TONCENTER_RPC;
