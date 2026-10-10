'use client';

import React, { useState } from 'react';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import {
    KeyRound,
    Copy,
    Check,
    Download,
    AlertTriangle,
    Shield,
    ArrowRight,
    Loader2,
    CheckCircle2,
    ExternalLink,
} from 'lucide-react';
import { createDepositNote, DepositNote } from '../lib/crypto';
import { buildDepositTransaction } from '../lib/ton';
import { TESTNET_EXPLORER_URL, UPFRONT_POOL_TIERS } from '../lib/contracts';

interface DepositCardProps {
    onDepositSuccess?: () => void;
}

export function DepositCard({ onDepositSuccess }: DepositCardProps) {
    const [tonConnectUI] = useTonConnectUI();
    const wallet = useTonWallet();

    const [selectedPool, setSelectedPool] = useState<'0.1' | '1.0' | '5.0'>('1.0');
    const currentTier = UPFRONT_POOL_TIERS[selectedPool] || UPFRONT_POOL_TIERS['1.0'];

    const [note, setNote] = useState<DepositNote | null>(null);
    const [hasCopied, setHasCopied] = useState(false);
    const [isBackedUp, setIsBackedUp] = useState(false);
    const [isDepositing, setIsDepositing] = useState(false);
    const [depositTxSuccess, setDepositTxSuccess] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleGenerateNote = () => {
        setErrorMessage(null);
        setDepositTxSuccess(null);
        const newNote = createDepositNote(`${currentTier.poolAmount}`);
        setNote(newNote);
        setHasCopied(false);
        setIsBackedUp(false);
    };

    const handleCopyNote = async () => {
        if (!note) return;
        try {
            await navigator.clipboard.writeText(note.encoded);
            setHasCopied(true);
            setTimeout(() => setHasCopied(false), 2500);
        } catch (_) {
            setErrorMessage('Failed to copy to clipboard');
        }
    };

    const handleDownloadNote = () => {
        if (!note) return;
        const blob = new Blob(
            [
                `========================================\n` +
                `TON ZERO-KNOWLEDGE MIXER DEPOSIT NOTE\n` +
                `========================================\n\n` +
                `Amount:         ${note.amount}\n` +
                `Secret Note:    ${note.encoded}\n` +
                `Commitment:     ${note.commitment.toString()}\n` +
                `Nullifier Hash: ${note.nullifierHash.toString()}\n\n` +
                `IMPORTANT INSTRUCTIONS:\n` +
                `- Keep this file completely private.\n` +
                `- Paste this Secret Note on the Withdraw tab to claim your funds.\n` +
                `- NEVER share this note with anyone!\n`
            ],
            { type: 'text/plain;charset=utf-8' }
        );
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tonzk-note-${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        setIsBackedUp(true);
    };

    const handleDeposit = async () => {
        if (!note) return;
        setErrorMessage(null);

        if (!wallet) {
            tonConnectUI.openModal();
            return;
        }

        try {
            setIsDepositing(true);
            // Dynamically resolve pool tier from the generated note or currently selected pool
            const noteAmountStr = note.amount.replace(' TON', '').trim();
            const tier = UPFRONT_POOL_TIERS[noteAmountStr] || UPFRONT_POOL_TIERS[selectedPool] || UPFRONT_POOL_TIERS['1.0'];

            const txRequest = buildDepositTransaction(note.commitment, tier.totalNano);
            const result = await tonConnectUI.sendTransaction(txRequest);

            setDepositTxSuccess(result.boc || 'Transaction dispatched');
            onDepositSuccess?.();
        } catch (err: any) {
            console.error('Deposit error:', err);
            setErrorMessage(err.message || 'Deposit transaction cancelled or failed');
        } finally {
            setIsDepositing(false);
        }
    };

    return (
        <div className="bg-glass-card rounded-2xl p-6 sm:p-8 border border-white/10 relative overflow-hidden transition-all">
            {/* Top decorative gradient bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-emerald-400 to-teal-500" />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
                        <Shield className="w-6 h-6 text-cyan-400" />
                        <span>Anonymous Deposit</span>
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-400 mt-1">
                        Deposit TON into the privacy pool with upfront gas & protocol fees. Full denomination payout upon withdrawal.
                    </p>
                </div>
            </div>

            {/* Step 1: Select Denomination */}
            <div className="mb-4">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    1. Select Pool Denomination
                </label>
                <div className="grid grid-cols-3 gap-3">
                    {(['0.1', '1.0', '5.0'] as const).map((poolId) => {
                        const tier = UPFRONT_POOL_TIERS[poolId];
                        const isSelected = selectedPool === poolId;
                        const isCurrentActive = poolId === '1.0';
                        return (
                            <button
                                key={poolId}
                                type="button"
                                onClick={() => {
                                    setSelectedPool(poolId);
                                    setNote(null);
                                    setDepositTxSuccess(null);
                                }}
                                className={`py-3 px-3 sm:px-4 rounded-xl border text-center font-medium transition-all cursor-pointer ${
                                    isSelected
                                        ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300 shadow-md shadow-cyan-500/10'
                                        : 'bg-glass-inner border-white/5 text-gray-300 hover:border-white/20'
                                }`}
                            >
                                <div className="text-base sm:text-lg font-bold">{tier.poolAmount}</div>
                                <div className="text-[11px] text-gray-400 mt-0.5">
                                    {isCurrentActive ? '🟢 Active Pool' : 'Standard'}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Dynamic Upfront Cost Breakdown */}
            <div className="bg-[#080d1a] border border-cyan-500/20 rounded-xl p-4 mb-6 shadow-inner space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400 font-medium">Pool Amount:</span>
                    <span className="text-white font-bold">{currentTier.poolAmount}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400 font-medium flex items-center gap-1.5">
                        <span>Protocol & Relayer Fee:</span>
                        <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded font-semibold">
                            Paid Upfront
                        </span>
                    </span>
                    <span className="text-cyan-300 font-bold">{currentTier.fee}</span>
                </div>
                <div className="h-px bg-white/10 my-1" />
                <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-gray-200 font-bold">Total to Pay:</span>
                    <span className="text-cyan-400 font-extrabold text-sm sm:text-base tracking-wide">{currentTier.total}</span>
                </div>
                <div className="pt-0.5 flex items-center gap-1.5 text-[11px] text-emerald-400">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span>Fees are paid upfront. You will receive exactly {currentTier.poolAmount} on withdrawal.</span>
                </div>
            </div>

            {/* Step 2: Generate Secret Note */}
            {!note ? (
                <div className="bg-glass-inner rounded-xl p-5 border border-white/5 text-center mb-6">
                    <p className="text-sm text-gray-300 mb-4">
                        Generate a cryptographically secure random secret and nullifier directly in your browser.
                    </p>
                    <button
                        type="button"
                        onClick={handleGenerateNote}
                        className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-black font-bold text-sm flex items-center justify-center gap-2 mx-auto shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
                    >
                        <KeyRound className="w-4 h-4" />
                        <span>Generate Secret Note</span>
                    </button>
                </div>
            ) : (
                <div className="mb-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                            <KeyRound className="w-3.5 h-3.5" />
                            <span>2. Your Secret Deposit Note</span>
                        </label>
                        <span className="text-[11px] text-emerald-400 font-medium">100% Client-Side Generated</span>
                    </div>

                    {/* Note Box */}
                    <div className="relative bg-[#070b14] rounded-xl p-4 border border-cyan-500/30 font-mono text-xs text-cyan-200 break-all select-all shadow-inner">
                        {note.encoded}
                    </div>

                    {/* Actions: Copy & Download */}
                    <div className="flex flex-wrap items-center gap-2.5">
                        <button
                            type="button"
                            onClick={handleCopyNote}
                            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                                hasCopied
                                    ? 'bg-emerald-500 text-black'
                                    : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
                            }`}
                        >
                            {hasCopied ? (
                                <>
                                    <Check className="w-4 h-4" />
                                    <span>Copied to Clipboard!</span>
                                </>
                            ) : (
                                <>
                                    <Copy className="w-4 h-4" />
                                    <span>Copy Secret Note</span>
                                </>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={handleDownloadNote}
                            className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/10 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
                            title="Download backup text file"
                        >
                            <Download className="w-4 h-4 text-cyan-400" />
                            <span>Download .txt</span>
                        </button>
                    </div>

                    {/* Security Warning */}
                    <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs leading-relaxed">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                            <span className="font-bold">CRITICAL: Save this note securely! </span>
                            You will need this exact string to withdraw your funds anonymously. If lost, your deposit
                            cannot be recovered.
                        </div>
                    </div>

                    {/* Backup Confirmation Checkbox */}
                    <label className="flex items-center gap-3 p-2 cursor-pointer select-none text-xs text-gray-300">
                        <input
                            type="checkbox"
                            checked={isBackedUp}
                            onChange={(e) => setIsBackedUp(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-600 bg-gray-900 text-cyan-500 focus:ring-cyan-400"
                        />
                        <span>I have securely backed up my Secret Note</span>
                    </label>

                    {/* Step 3: Deposit Button */}
                    <div className="pt-2">
                        <button
                            type="button"
                            disabled={!isBackedUp || isDepositing}
                            onClick={handleDeposit}
                            className={`w-full py-4 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all ${
                                !isBackedUp || isDepositing
                                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-white/5'
                                    : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black shadow-lg shadow-emerald-500/20 cursor-pointer'
                            }`}
                        >
                            {isDepositing ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Confirm in Tonkeeper / Wallet...</span>
                                </>
                            ) : !wallet ? (
                                <>
                                    <span>Connect Wallet to Pay {currentTier.total}</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            ) : (
                                <>
                                    <span>Pay {currentTier.total} (Deposit {currentTier.poolAmount})</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Error Message Display */}
            {errorMessage && (
                <div className="mt-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                    {errorMessage}
                </div>
            )}

            {/* Success Banner */}
            {depositTxSuccess && (
                <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs space-y-2">
                    <div className="flex items-center gap-2 font-bold text-emerald-300">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Deposit transaction broadcasted successfully!</span>
                    </div>
                    <p className="text-gray-300">
                        Your commitment is being added to the Merkle tree. Once confirmed on TON Testnet, your note will
                        be ready for anonymous withdrawal.
                    </p>
                </div>
            )}
        </div>
    );
}
