export const MIXER_ADDRESS_STRING = '0QAz-Jy7XX5pMi925pFFHGzTgKRqirwK7CgtZMT5mGAhknET';
export const TONCENTER_TESTNET_RPC = 'https://testnet.toncenter.com/api/v2/jsonRPC';

export const OP_DEPOSIT_TON = 0x1001;
export const OP_WITHDRAW = 0x1002;
export const OP_JETTON_NOTIFICATION = 0x7362d09c;

export const TON_DENOMINATION = BigInt(1_000_000_000); // 1.0 TON
export const DEPOSIT_GAS_FEE = BigInt(70_000_000); // 0.07 TON
export const WITHDRAW_GAS_FEE = BigInt(180_000_000); // 0.18 TON

export const TESTNET_EXPLORER_URL = (addr: string) => `https://testnet.tonscan.org/address/${addr}`;
export const TESTNET_TX_EXPLORER_URL = (hash: string) => `https://testnet.tonscan.org/tx/${hash}`;
