import { Address, fromNano } from '@ton/core';
import { MIXER_ADDRESS_STRING } from './contracts';
import { getTonClient } from './ton';

export const ADMIN_WALLET_ADDRESS = 'UQDvCkYWzfC7jf11EwKMvy_4WolQeltsPpFxwJoGtiMdCr0M';

// Canonical parsed address string for strict comparison
export const ADMIN_CANONICAL_STRING = (() => {
    try {
        return Address.parse(ADMIN_WALLET_ADDRESS).toString();
    } catch {
        return '';
    }
})();

/**
 * Authentication Guard:
 * Parse address using @ton/core Address.parse().toString() to ensure correct format comparison.
 * Verifies if the wallet exactly matches UQDvCkYWzfC7jf11EwKMvy_4WolQeltsPpFxwJoGtiMdCr0M.
 */
export function isAuthorizedAdmin(walletAddress?: string | null): boolean {
    if (!walletAddress) return false;
    try {
        const parsed = Address.parse(walletAddress).toString();
        return (
            parsed === ADMIN_CANONICAL_STRING ||
            walletAddress.trim() === ADMIN_WALLET_ADDRESS
        );
    } catch {
        return false;
    }
}

export interface DepositRecord {
    time: string;
    timestamp: number;
    amount: string;
    commitment: string;
    hash: string;
}

export interface WithdrawalRecord {
    time: string;
    timestamp: number;
    recipient: string;
    amountReceived: string;
    adminFee: string;
    hash: string;
}

export interface AdminMetrics {
    tvlTon: string;
    totalAdminFeesTon: string;
    totalDepositsCount: number;
    totalWithdrawalsCount: number;
    adminWalletBalance: string;
    protocolFeePercent: number;
    contractAddress: string;
    adminWalletAddress: string;
    recentDeposits: DepositRecord[];
    recentWithdrawals: WithdrawalRecord[];
}

/**
 * Fetch live on-chain protocol metrics for the Admin Dashboard
 */
export async function fetchAdminMetrics(): Promise<AdminMetrics> {
    const client = getTonClient();
    const mixerAddr = Address.parse(MIXER_ADDRESS_STRING);
    const adminAddr = Address.parse(ADMIN_WALLET_ADDRESS);

    // Fetch contract state, admin wallet balance, and contract getters in parallel
    const [
        mixerState,
        adminState,
        depositsRes,
        withdrawalsRes,
        feePercentRes,
        txs,
    ] = await Promise.all([
        client.getContractState(mixerAddr),
        client.getContractState(adminAddr).catch(() => ({ balance: 0n })),
        client.runMethod(mixerAddr, 'totalDeposits').catch(() => null),
        client.runMethod(mixerAddr, 'totalWithdrawals').catch(() => null),
        client.runMethod(mixerAddr, 'protocolFeePercent').catch(() => null),
        client.getTransactions(mixerAddr, { limit: 50 }).catch(() => []),
    ]);

    const totalDepositsCount = depositsRes ? Number(depositsRes.stack.readBigNumber()) : 0;
    const totalWithdrawalsCount = withdrawalsRes ? Number(withdrawalsRes.stack.readBigNumber()) : 0;
    const protocolFeePercent = feePercentRes ? Number(feePercentRes.stack.readBigNumber()) : 1;

    const tvlTon = fromNano(mixerState.balance);
    const adminWalletBalance = fromNano(adminState.balance);

    const recentDeposits: DepositRecord[] = [];
    const recentWithdrawals: WithdrawalRecord[] = [];
    let cumulativeFeesCoins = 0n;

    for (const tx of txs) {
        if (!tx.inMessage || tx.inMessage.info.type !== 'internal') continue;

        try {
            const body = tx.inMessage.body.beginParse();
            if (body.remainingBits < 32) continue;

            const op = body.loadUint(32);
            const timeStr = new Date(tx.now * 1000).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            });
            const hash = tx.hash().toString('hex');

            // 0x1001 = DepositTon
            if (op === 0x1001 && body.remainingBits >= 256) {
                const commitmentBig = body.loadUintBig(256);
                recentDeposits.push({
                    time: timeStr,
                    timestamp: tx.now,
                    amount: '1.00',
                    commitment: '0x' + commitmentBig.toString(16).padStart(64, '0'),
                    hash,
                });
            }
            // 0x1002 = Withdraw
            else if (op === 0x1002) {
                let recipient = 'Anonymous Recipient';
                let amountReceived = '0.99';
                let adminFee = '0.01';

                for (const outMsg of tx.outMessages.values()) {
                    if (outMsg.info.type === 'internal') {
                        const dest = outMsg.info.dest.toString();
                        const val = fromNano(outMsg.info.value.coins);
                        const destParsed = Address.parse(dest).toString();

                        if (destParsed === ADMIN_CANONICAL_STRING) {
                            adminFee = Number(val).toFixed(2);
                            cumulativeFeesCoins += outMsg.info.value.coins;
                        } else {
                            recipient = dest;
                            amountReceived = Number(val).toFixed(2);
                        }
                    }
                }

                // If from legacy withdrawal before upgrade, estimate 1% fee
                if (adminFee === '0.00' || adminFee === '0.01') {
                    adminFee = '0.01';
                }

                recentWithdrawals.push({
                    time: timeStr,
                    timestamp: tx.now,
                    recipient,
                    amountReceived,
                    adminFee,
                    hash,
                });
            }
        } catch (e) {
            // Skip unparseable malformed messages gracefully
        }
    }

    // Sort descending by time
    recentDeposits.sort((a, b) => b.timestamp - a.timestamp);
    recentWithdrawals.sort((a, b) => b.timestamp - a.timestamp);

    // Calculate total admin fees earned across all withdrawals
    const totalAdminFeesCalculated = (totalWithdrawalsCount * 0.01).toFixed(2);

    return {
        tvlTon: Number(tvlTon).toFixed(2),
        totalAdminFeesTon: totalAdminFeesCalculated,
        totalDepositsCount,
        totalWithdrawalsCount,
        adminWalletBalance: Number(adminWalletBalance).toFixed(4),
        protocolFeePercent,
        contractAddress: MIXER_ADDRESS_STRING,
        adminWalletAddress: ADMIN_WALLET_ADDRESS,
        recentDeposits,
        recentWithdrawals,
    };
}
