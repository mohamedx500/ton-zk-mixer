'use client';

import React, { useState } from 'react';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    KeyRound,
    Copy,
    Check,
    Download,
    Shield,
    ArrowRight,
    Loader2,
    CheckCircle2,
    Eye,
    EyeOff,
} from 'lucide-react';
import { createDepositNote, DepositNote } from '../lib/crypto';
import { buildDepositTransaction } from '../lib/ton';
import { UPFRONT_POOL_TIERS, POOL_TIER_IDS, PoolTierId } from '../lib/contracts';
import { TonIcon, GramDiamondMark, GramCircularBadge } from './TonIcons';

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
        <div className="bg-[#10161F] p-6 sm:p-8 rounded-2xl border border-[#222E3E] text-white relative shadow-2xl transition-all duration-300">
            {/* Header with ton.org Aesthetic & Clean Badges */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8 border-b border-[#222E3E] pb-5">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2.5 uppercase tracking-wide">
                        <div className="p-2 rounded-xl bg-[#1C2735] border border-[#2B3B4E]">
                            <Shield className="w-5 h-5 text-[#30A1F5]" />
                        </div>
                        <span>Protocol Deposit</span>
                    </h2>
                    <p className="text-xs text-[#94A3B8] mt-1 font-mono">
                        Initialize anonymous pool contribution via ZK commitment
                    </p>
                </div>
                
                {/* Official Assets Badges - Perfectly Sized & Aligned */}
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-[#16202D] text-white text-[10px] font-mono tracking-wider shadow-sm">
                        <TonIcon className="w-4 h-4 shrink-0" />
                        <span className="font-bold">TON NATIVE</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-[#16202D] text-[#94A3B8] text-[10px] font-mono tracking-wider shadow-sm">
                        <GramCircularBadge className="w-4 h-4 shrink-0" />
                        <span>GRAM BADGE</span>
                    </div>
                </div>
            </div>

            {/* Step 1: Select Denomination with Edged Corners & Smooth Hover */}
            <div className="mb-7">
                <div className="flex items-center justify-between mb-3">
                    <label className="text-[11px] font-mono uppercase tracking-widest text-[#94A3B8] flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5 text-[#30A1F5]" />
                        <span>[1] SELECT ANONYMITY POOL</span>
                    </label>
                    <span className="text-[10px] font-mono text-[#64748B]">
                        9 UPFRONT TIERS
                    </span>
                </div>

                <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                    {POOL_TIER_IDS.map((poolId) => {
                        const tier = UPFRONT_POOL_TIERS[poolId];
                        const isSelected = selectedPool === poolId;
                        const isWhaleTier = Number(tier.poolAmount) >= 100;
                        
                        return (
                            <button
                                key={poolId}
                                type="button"
                                onClick={() => {
                                    setSelectedPool(poolId);
                                    setNote(null);
                                    setDepositTxSuccess(null);
                                }}
                                className={`group py-3.5 px-2.5 rounded-xl border text-center transition-all duration-200 transform active:scale-[0.98] cursor-pointer ${
                                    isSelected
                                        ? 'bg-[#30A1F5] text-black border-[#30A1F5] shadow-lg shadow-[#30A1F5]/20 font-bold'
                                        : 'bg-[#141C26] text-[#94A3B8] border-[#222E3E] hover:border-[#30A1F5]/50 hover:bg-[#1A2432] hover:text-white'
                                }`}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    {isWhaleTier ? (
                                        <GramDiamondMark className="w-4 h-4 shrink-0" />
                                    ) : (
                                        <TonIcon className="w-4 h-4 shrink-0" />
                                    )}
                                    <span className="text-sm sm:text-base font-bold font-mono tracking-tight">
                                        {tier.poolAmount}
                                    </span>
                                </div>
                                <div className={`text-[9px] font-mono mt-1 ${isSelected ? 'text-black/80 font-bold' : 'text-[#64748B]'}`}>
                                    + {tier.fee} FEE
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Dynamic Upfront Cost Breakdown Card with Edged Corners */}
            <div className="bg-[#141C26] rounded-xl border border-[#222E3E] p-4 mb-7 font-mono text-[11px] sm:text-xs shadow-inner">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-[#94A3B8] uppercase">
                        <TonIcon className="w-4 h-4 shrink-0" />
                        <span>Pool Denomination:</span>
                    </div>
                    <span className="text-white font-bold">{currentTier.poolAmount}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-[#94A3B8] uppercase">
                        <Shield className="w-4 h-4 shrink-0 text-[#30A1F5]" />
                        <span>Protocol Gas &amp; Merkle Fee:</span>
                    </div>
                    <span className="text-white">{currentTier.fee}</span>
                </div>
                <div className="h-px bg-[#222E3E] my-2.5" />
                <div className="flex items-center justify-between">
                    <span className="text-white font-bold uppercase tracking-wider">Total Transaction Value:</span>
                    <span className="text-white font-extrabold text-sm sm:text-base flex items-center gap-1.5">
                        <TonIcon className="w-4 h-4 shrink-0 inline" />
                        <span className="text-[#30A1F5]">{currentTier.total}</span>
                    </span>
                </div>
            </div>

            {/* Step 2: Generate Secret Note with Smooth Transitions */}
            <AnimatePresence mode="wait">
                {!note ? (
                    <motion.div
                        key="init-secret-step"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.2 }}
                        className="bg-[#141C26]/70 rounded-xl border border-[#222E3E] p-6 text-center mb-2"
                    >
                        <div className="w-10 h-10 rounded-xl bg-[#0B0E14] border border-[#222E3E] flex items-center justify-center mx-auto mb-3 shadow-inner">
                            <KeyRound className="w-5 h-5 text-[#30A1F5]" />
                        </div>
                        <p className="text-[11px] sm:text-xs text-[#94A3B8] mb-5 font-mono uppercase">
                            Generate cryptographic nullifier and commitment note. Local in-browser execution.
                        </p>
                        <button
                            type="button"
                            onClick={handleGenerateNote}
                            className="w-full sm:w-auto px-7 py-3 rounded-xl bg-white hover:bg-slate-200 text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 mx-auto font-mono transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-md cursor-pointer"
                        >
                            <KeyRound className="w-4 h-4" />
                            <span>INITIALIZE SECRETS</span>
                        </button>
                    </motion.div>
                ) : (
                    <motion.div
                        key="note-generated-step"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.2 }}
                        className="mb-2 space-y-4"
                    >
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-mono uppercase tracking-widest text-[#94A3B8] flex items-center gap-2">
                                <KeyRound className="w-3.5 h-3.5 text-[#30A1F5]" />
                                <span>[2] CRYPTOGRAPHIC NOTE READY</span>
                            </label>
                            <button
                                type="button"
                                onClick={() => setShowFullNote(!showFullNote)}
                                className="text-[10px] text-[#94A3B8] hover:text-white flex items-center gap-1 font-mono uppercase transition-colors cursor-pointer px-2 py-0.5 rounded-md hover:bg-[#141C26]"
                            >
                                {showFullNote ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                <span>{showFullNote ? 'HIDE' : 'SHOW'}</span>
                            </button>
                        </div>

                        {/* Note Box with Edged Corners */}
                        <div className="bg-[#0B0E14] rounded-xl border border-[#222E3E] p-4 font-mono text-[10px] sm:text-xs text-white break-all select-all shadow-inner">
                            {showFullNote ? note.encoded : `${note.encoded.slice(0, 32)}••••••••••••••••${note.encoded.slice(-16)}`}
                        </div>

                        {/* Actions: Copy & Download with Edged Corners */}
                        <div className="flex flex-wrap items-center gap-2.5">
                            <button
                                type="button"
                                onClick={handleCopyNote}
                                className={`flex-1 py-3 px-4 rounded-xl border text-[10px] sm:text-xs font-mono uppercase flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer active:scale-[0.98] ${
                                    hasCopied
                                        ? 'bg-[#30A1F5] text-black border-[#30A1F5] font-bold shadow-md'
                                        : 'bg-[#141C26] text-white border-[#222E3E] hover:border-white/30 hover:bg-[#1A2432]'
                                }`}
                            >
                                {hasCopied ? (
                                    <>
                                        <Check className="w-3.5 h-3.5" />
                                        <span>COPIED TO CLIPBOARD</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-3.5 h-3.5" />
                                        <span>COPY TXT</span>
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={handleDownloadNote}
                                className="py-3 px-4 rounded-xl bg-[#141C26] border border-[#222E3E] hover:border-white/30 hover:bg-[#1A2432] text-white text-[10px] sm:text-xs font-mono uppercase flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer active:scale-[0.98]"
                            >
                                <Download className="w-3.5 h-3.5" />
                                <span>SAVE .TXT</span>
                            </button>
                        </div>

                        {/* Backup Confirmation Checkbox with Edged Corners */}
                        <label className="flex items-center gap-3 p-3.5 rounded-xl bg-[#141C26] border border-[#222E3E] cursor-pointer select-none text-[10px] sm:text-xs font-mono uppercase text-[#94A3B8] hover:text-white transition-colors">
                            <input
                                type="checkbox"
                                checked={isBackedUp}
                                onChange={(e) => setIsBackedUp(e.target.checked)}
                                className="w-4 h-4 rounded-md border-[#222E3E] bg-[#0B0E14] text-[#30A1F5] focus:ring-0 cursor-pointer accent-[#30A1F5]"
                            />
                            <span>I HAVE BACKED UP MY SECRET NOTE SAFELY</span>
                        </label>

                        {/* Step 3: Deposit Button with Edged Corners */}
                        <div className="pt-2">
                            <button
                                type="button"
                                disabled={!isBackedUp || isDepositing}
                                onClick={handleDeposit}
                                className={`w-full py-4 rounded-xl font-mono font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all duration-200 cursor-pointer shadow-lg active:scale-[0.98] ${
                                    !isBackedUp || isDepositing
                                        ? 'bg-[#141C26] text-[#64748B] border border-[#222E3E] cursor-not-allowed opacity-60'
                                        : 'bg-[#30A1F5] text-black hover:bg-[#208BDC] border border-[#30A1F5] shadow-[#30A1F5]/25'
                                }`}
                            >
                                {isDepositing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>BROADCASTING DEPOSIT...</span>
                                    </>
                                ) : !wallet ? (
                                    <>
                                        <TonIcon className="w-4 h-4 shrink-0" />
                                        <span>CONNECT WALLET [{currentTier.total}]</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                ) : (
                                    <>
                                        <TonIcon className="w-4 h-4 shrink-0" />
                                        <span>DEPOSIT [{currentTier.total}]</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Error Message Display with Edged Corners */}
            {errorMessage && (
                <div className="mt-4 p-4 rounded-xl bg-[#141C26] border border-red-500/30 text-white text-[10px] sm:text-xs font-mono uppercase">
                    ERR: {errorMessage}
                </div>
            )}

            {/* Success Banner with Edged Corners */}
            {depositTxSuccess && (
                <div className="mt-4 p-4 rounded-xl bg-[#141C26] border border-emerald-500/30 text-white text-[10px] sm:text-xs font-mono uppercase space-y-2">
                    <div className="flex items-center gap-2 font-bold text-white">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>TRANSACTION DISPATCHED</span>
                    </div>
                    <p className="text-[#94A3B8]">
                        MERKLE TREE INSERTION IN PROGRESS. AWAITING ON-CHAIN CONFIRMATION.
                    </p>
                </div>
            )}
        </div>
    );
}
