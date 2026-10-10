'use client';

import React, { useState } from 'react';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { motion, AnimatePresence } from 'framer-motion';
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
    Sparkles,
    Eye,
    EyeOff,
    FileText,
} from 'lucide-react';
import { createDepositNote, DepositNote } from '../lib/crypto';
import { buildDepositTransaction } from '../lib/ton';
import { UPFRONT_POOL_TIERS, POOL_TIER_IDS, PoolTierId } from '../lib/contracts';
import { TonIcon, TonDiamond, ZkCircuitIcon } from './TonIcons';
import { BottomSheet } from './BottomSheet';

interface DepositCardProps {
    onDepositSuccess?: () => void;
}

export function DepositCard({ onDepositSuccess }: DepositCardProps) {
    const [tonConnectUI] = useTonConnectUI();
    const wallet = useTonWallet();

    const [selectedPool, setSelectedPool] = useState<PoolTierId>('1.0');
    const currentTier = UPFRONT_POOL_TIERS[selectedPool] || UPFRONT_POOL_TIERS['1.0'];

    const [note, setNote] = useState<DepositNote | null>(null);
    const [hasCopied, setHasCopied] = useState(false);
    const [isBackedUp, setIsBackedUp] = useState(false);
    const [isDepositing, setIsDepositing] = useState(false);
    const [depositTxSuccess, setDepositTxSuccess] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [showFullNote, setShowFullNote] = useState(false);
    const [isConfirmDrawerOpen, setIsConfirmDrawerOpen] = useState(false);

    const handleGenerateNote = () => {
        setErrorMessage(null);
        setDepositTxSuccess(null);
        const newNote = createDepositNote(`${currentTier.poolAmount}`);
        setNote(newNote);
        setHasCopied(false);
        setIsBackedUp(false);
        setIsConfirmDrawerOpen(true);
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
            const noteAmountStr = note.amount.replace(' TON', '').trim();
            const tier = UPFRONT_POOL_TIERS[noteAmountStr] || UPFRONT_POOL_TIERS[selectedPool] || UPFRONT_POOL_TIERS['1.0'];

            const txRequest = buildDepositTransaction(note.commitment, tier.totalNano);
            const result = await tonConnectUI.sendTransaction(txRequest);

            setDepositTxSuccess(result.boc || 'Transaction dispatched');
            setIsConfirmDrawerOpen(false);
            onDepositSuccess?.();
        } catch (err: any) {
            console.error('Deposit error:', err);
            setErrorMessage(err.message || 'Deposit transaction cancelled or failed');
        } finally {
            setIsDepositing(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="bg-glass-card rounded-2xl p-5 sm:p-8 border border-white/10 relative overflow-hidden transition-all shadow-2xl backdrop-blur-2xl"
        >
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
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold">
                    <TonIcon className="w-4 h-4" />
                    <span>TON Native</span>
                </div>
            </div>

            {/* Step 1: Select Denomination */}
            <div className="mb-5">
                <div className="flex items-center justify-between mb-2.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                        <ZkCircuitIcon className="w-4 h-4 text-cyan-400" />
                        <span>1. Select Pool Denomination (1 TON to 1000 TON)</span>
                    </label>
                    <span className="text-[11px] text-cyan-400 font-semibold bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full">
                        {currentTier.category.toUpperCase()}
                    </span>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {POOL_TIER_IDS.map((poolId) => {
                        const tier = UPFRONT_POOL_TIERS[poolId];
                        const isSelected = selectedPool === poolId;
                        const isCurrentActive = poolId === '1.0';

                        return (
                            <motion.button
                                key={poolId}
                                type="button"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                    setSelectedPool(poolId);
                                    setNote(null);
                                    setDepositTxSuccess(null);
                                }}
                                className={`py-3 px-2 sm:px-3.5 rounded-xl border text-center font-medium transition-all cursor-pointer relative overflow-hidden select-none ${
                                    isSelected
                                        ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-500/50'
                                        : 'bg-glass-inner border-white/5 text-gray-300 hover:border-white/20 hover:bg-white/[0.03]'
                                }`}
                            >
                                <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
                                    <span className="font-semibold text-gray-300 truncate">{tier.label}</span>
                                    {isCurrentActive && (
                                        <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1 py-0.2 rounded font-bold shrink-0">
                                            Active
                                        </span>
                                    )}
                                </div>
                                <div className="text-sm sm:text-base font-extrabold text-white tracking-tight flex items-center justify-center gap-1">
                                    <TonDiamond className="w-3.5 h-3.5 inline text-cyan-400 shrink-0" />
                                    <span>{tier.poolAmount}</span>
                                </div>
                                <div className="text-[10px] text-gray-400 mt-0.5 font-mono">
                                    Fee: {tier.fee}
                                </div>
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {/* Dynamic Upfront Cost Breakdown */}
            <motion.div
                layout
                className="bg-[#080d1a]/90 backdrop-blur-md border border-cyan-500/20 rounded-xl p-4 sm:p-4.5 mb-6 shadow-inner space-y-2.5"
            >
                <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-gray-400 font-medium flex items-center gap-1.5">
                        <TonIcon className="w-3.5 h-3.5" />
                        <span>Pool Denomination:</span>
                    </span>
                    <span className="text-white font-bold">{currentTier.poolAmount}</span>
                </div>
                <div className="flex items-center justify-between text-xs sm:text-sm">
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
                    <span className="text-gray-200 font-bold">Total to Pay (Msg.Value):</span>
                    <span className="text-cyan-400 font-extrabold text-base sm:text-lg tracking-wide">{currentTier.total}</span>
                </div>
                <div className="pt-0.5 flex items-center gap-1.5 text-[11px] text-emerald-400">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span>Upfront coverage: You will receive exactly {currentTier.poolAmount} upon withdrawal with 0 deductions.</span>
                </div>
            </motion.div>

            {/* Step 2: Generate Secret Note */}
            {!note ? (
                <div className="bg-glass-inner rounded-xl p-6 border border-white/5 text-center mb-4">
                    <p className="text-xs sm:text-sm text-gray-300 mb-4 max-w-md mx-auto">
                        Generate a cryptographically secure random secret and nullifier directly in your browser. Nothing is sent to any server.
                    </p>
                    <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleGenerateNote}
                        className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-black font-extrabold text-sm flex items-center justify-center gap-2.5 mx-auto shadow-xl shadow-cyan-500/25 transition-all cursor-pointer"
                    >
                        <KeyRound className="w-4 h-4 text-black" />
                        <span>Generate Secret Note</span>
                        <Sparkles className="w-3.5 h-3.5 text-black/70" />
                    </motion.button>
                </div>
            ) : (
                <div className="mb-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                            <KeyRound className="w-3.5 h-3.5" />
                            <span>2. Your Secret Deposit Note</span>
                        </label>
                        <button
                            type="button"
                            onClick={() => setShowFullNote(!showFullNote)}
                            className="text-[11px] text-gray-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                        >
                            {showFullNote ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            <span>{showFullNote ? 'Mask' : 'Reveal'}</span>
                        </button>
                    </div>

                    {/* Note Box */}
                    <div className="relative bg-[#070b14] rounded-xl p-4 border border-cyan-500/40 font-mono text-xs text-cyan-200 break-all select-all shadow-inner">
                        {showFullNote ? note.encoded : `${note.encoded.slice(0, 32)}••••••••••••••••${note.encoded.slice(-16)}`}
                    </div>

                    {/* Actions: Copy & Download */}
                    <div className="flex flex-wrap items-center gap-2.5">
                        <button
                            type="button"
                            onClick={handleCopyNote}
                            className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                                hasCopied
                                    ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/25'
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
                            className="py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/10 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
                            title="Download backup text file"
                        >
                            <Download className="w-4 h-4 text-cyan-400" />
                            <span>Download .txt</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setIsConfirmDrawerOpen(true)}
                            className="py-3 px-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                            title="Open backup sheet"
                        >
                            <FileText className="w-4 h-4" />
                            <span className="hidden sm:inline">Details</span>
                        </button>
                    </div>

                    {/* Security Warning */}
                    <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs leading-relaxed">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                            <span className="font-bold">CRITICAL: Save this note securely! </span>
                            You will need this exact string to withdraw your funds anonymously. If lost, your deposit cannot be recovered.
                        </div>
                    </div>

                    {/* Backup Confirmation Checkbox */}
                    <label className="flex items-center gap-3 p-2 cursor-pointer select-none text-xs text-gray-300 hover:text-white transition-colors">
                        <input
                            type="checkbox"
                            checked={isBackedUp}
                            onChange={(e) => setIsBackedUp(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-600 bg-gray-900 text-cyan-500 focus:ring-cyan-400 cursor-pointer"
                        />
                        <span className="font-medium">I have securely backed up my Secret Note</span>
                    </label>

                    {/* Step 3: Deposit Button */}
                    <div className="pt-2">
                        <motion.button
                            type="button"
                            whileHover={isBackedUp && !isDepositing ? { scale: 1.01 } : {}}
                            whileTap={isBackedUp && !isDepositing ? { scale: 0.99 } : {}}
                            disabled={!isBackedUp || isDepositing}
                            onClick={handleDeposit}
                            className={`w-full py-4 rounded-xl font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all ${
                                !isBackedUp || isDepositing
                                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-white/5'
                                    : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black shadow-xl shadow-emerald-500/25 cursor-pointer'
                            }`}
                        >
                            {isDepositing ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Confirm in Wallet...</span>
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
                        </motion.button>
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
                        Your commitment is being added to the Merkle tree. Once confirmed on TON, your note will be ready for anonymous withdrawal.
                    </p>
                </div>
            )}

            {/* Vaul BottomSheet for Mobile & Fluid Confirmation */}
            {note && (
                <BottomSheet
                    open={isConfirmDrawerOpen}
                    onOpenChange={setIsConfirmDrawerOpen}
                    title={
                        <div className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-cyan-400" />
                            <span>Deposit Note Backup</span>
                        </div>
                    }
                    description="Confirm your secret credentials before broadcasting to TON Blockchain."
                >
                    <div className="space-y-4 pt-1">
                        <div className="bg-[#070b14] rounded-xl p-3.5 border border-white/10 font-mono text-xs text-cyan-300 break-all select-all">
                            {note.encoded}
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                                <span className="text-gray-400 block mb-0.5">Pool Denomination:</span>
                                <span className="text-white font-bold">{currentTier.poolAmount}</span>
                            </div>
                            <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                                <span className="text-gray-400 block mb-0.5">Total Msg.Value:</span>
                                <span className="text-cyan-400 font-bold">{currentTier.total}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                            <button
                                type="button"
                                onClick={handleCopyNote}
                                className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs flex items-center justify-center gap-2"
                            >
                                <Copy className="w-4 h-4" />
                                <span>{hasCopied ? 'Copied!' : 'Copy'}</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleDownloadNote}
                                className="flex-1 py-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 font-semibold text-xs flex items-center justify-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                <span>Save .txt</span>
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                setIsBackedUp(true);
                                setIsConfirmDrawerOpen(false);
                            }}
                            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 text-black font-bold text-xs sm:text-sm mt-2"
                        >
                            I Have Backed Up - Proceed to Deposit
                        </button>
                    </div>
                </BottomSheet>
            )}
        </motion.div>
    );
}
