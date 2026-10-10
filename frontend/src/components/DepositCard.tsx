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
    Eye,
    EyeOff,
    FileText,
} from 'lucide-react';
import { createDepositNote, DepositNote } from '../lib/crypto';
import { buildDepositTransaction } from '../lib/ton';
import { UPFRONT_POOL_TIERS, POOL_TIER_IDS, PoolTierId } from '../lib/contracts';
import { TonIcon, ZkCircuitIcon } from './TonIcons';
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
        <div className="bg-minimal-card p-6 border border-brand-border text-brand-white relative">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 border-b border-brand-border pb-4">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2 uppercase tracking-wide">
                        <Shield className="w-5 h-5 text-brand-silver" />
                        <span>System Deposit</span>
                    </h2>
                    <p className="text-xs text-brand-silver mt-1 font-mono">
                        Initialize anonymous pool contribution
                    </p>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 border border-brand-border bg-brand-offblack text-brand-silver text-[10px] font-mono uppercase">
                    <TonIcon className="w-3.5 h-3.5 grayscale" />
                    <span>TON Native</span>
                </div>
            </div>

            {/* Step 1: Select Denomination */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-brand-silver flex items-center gap-2">
                        <ZkCircuitIcon className="w-3.5 h-3.5 grayscale opacity-70" />
                        <span>[1] SELECT DENOMINATION</span>
                    </label>
                </div>

                <div className="grid grid-cols-3 gap-2">
                    {POOL_TIER_IDS.map((poolId) => {
                        const tier = UPFRONT_POOL_TIERS[poolId];
                        const isSelected = selectedPool === poolId;
                        
                        return (
                            <button
                                key={poolId}
                                type="button"
                                onClick={() => {
                                    setSelectedPool(poolId);
                                    setNote(null);
                                    setDepositTxSuccess(null);
                                }}
                                className={`py-4 px-2 border text-center transition-none uppercase ${
                                    isSelected
                                        ? 'bg-brand-white text-brand-black border-brand-white'
                                        : 'bg-brand-offblack text-brand-silver border-brand-border hover:border-brand-silver'
                                }`}
                            >
                                <div className="text-sm sm:text-base font-bold font-mono tracking-tighter">
                                    {tier.poolAmount}
                                </div>
                                <div className={`text-[9px] font-mono mt-1 ${isSelected ? 'text-brand-gray' : 'text-brand-silver'}`}>
                                    FEE: {tier.fee}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Dynamic Upfront Cost Breakdown */}
            <div className="bg-brand-gray border border-brand-border p-4 mb-8 font-mono text-[11px] sm:text-xs">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-brand-silver uppercase">Pool Size:</span>
                    <span className="text-brand-white">{currentTier.poolAmount}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-brand-silver uppercase">Protocol Fee:</span>
                    <span className="text-brand-white">{currentTier.fee}</span>
                </div>
                <div className="h-px bg-brand-border my-3" />
                <div className="flex items-center justify-between">
                    <span className="text-brand-white font-bold uppercase">Total Msg.Value:</span>
                    <span className="text-brand-white font-bold">{currentTier.total}</span>
                </div>
            </div>

            {/* Step 2: Generate Secret Note */}
            {!note ? (
                <div className="bg-brand-gray border border-brand-border p-6 text-center mb-2">
                    <p className="text-[11px] sm:text-xs text-brand-silver mb-6 font-mono uppercase">
                        Generate cryptographic nullifier. Local execution only.
                    </p>
                    <button
                        type="button"
                        onClick={handleGenerateNote}
                        className="w-full sm:w-auto px-8 py-3 bg-brand-white hover:bg-brand-silver text-brand-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 mx-auto font-mono transition-colors"
                    >
                        <KeyRound className="w-4 h-4" />
                        <span>INITIALIZE SECRETS</span>
                    </button>
                </div>
            ) : (
                <div className="mb-2 space-y-5">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] font-mono uppercase tracking-widest text-brand-silver flex items-center gap-2">
                            <KeyRound className="w-3.5 h-3.5" />
                            <span>[2] SECRETS GENERATED</span>
                        </label>
                        <button
                            type="button"
                            onClick={() => setShowFullNote(!showFullNote)}
                            className="text-[10px] text-brand-silver hover:text-brand-white flex items-center gap-1 font-mono uppercase"
                        >
                            {showFullNote ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            <span>{showFullNote ? 'HIDE' : 'SHOW'}</span>
                        </button>
                    </div>

                    {/* Note Box */}
                    <div className="bg-brand-black border border-brand-border p-4 font-mono text-[10px] sm:text-xs text-brand-white break-all select-all">
                        {showFullNote ? note.encoded : `${note.encoded.slice(0, 32)}••••••••••••••••${note.encoded.slice(-16)}`}
                    </div>

                    {/* Actions: Copy & Download */}
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={handleCopyNote}
                            className={`flex-1 py-3 px-4 border text-[10px] sm:text-xs font-mono uppercase flex items-center justify-center gap-2 transition-colors ${
                                hasCopied
                                    ? 'bg-brand-white text-black border-brand-white'
                                    : 'bg-brand-offblack text-brand-white border-brand-border hover:border-brand-silver'
                            }`}
                        >
                            {hasCopied ? (
                                <>
                                    <Check className="w-3.5 h-3.5" />
                                    <span>COPIED</span>
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
                            className="py-3 px-4 bg-brand-offblack border border-brand-border hover:border-brand-silver text-brand-white text-[10px] sm:text-xs font-mono uppercase flex items-center justify-center gap-2 transition-colors"
                        >
                            <Download className="w-3.5 h-3.5" />
                            <span>SAVE .TXT</span>
                        </button>
                    </div>

                    {/* Backup Confirmation Checkbox */}
                    <label className="flex items-center gap-3 p-3 bg-brand-gray border border-brand-border cursor-pointer select-none text-[10px] sm:text-xs font-mono uppercase text-brand-silver hover:text-brand-white transition-colors">
                        <input
                            type="checkbox"
                            checked={isBackedUp}
                            onChange={(e) => setIsBackedUp(e.target.checked)}
                            className="w-4 h-4 rounded-none border-brand-border bg-brand-black text-brand-white focus:ring-0 cursor-pointer"
                        />
                        <span>CONFIRM BACKUP SAVED</span>
                    </label>

                    {/* Step 3: Deposit Button */}
                    <div className="pt-2">
                        <button
                            type="button"
                            disabled={!isBackedUp || isDepositing}
                            onClick={handleDeposit}
                            className={`w-full py-4 font-mono font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${
                                !isBackedUp || isDepositing
                                    ? 'bg-brand-offblack text-brand-silver border border-brand-border cursor-not-allowed'
                                    : 'bg-brand-white text-brand-black hover:bg-brand-silver border border-brand-white'
                            }`}
                        >
                            {isDepositing ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>PROCESSING...</span>
                                </>
                            ) : !wallet ? (
                                <>
                                    <span>CONNECT WALLET [{currentTier.total}]</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            ) : (
                                <>
                                    <span>EXECUTE [{currentTier.total}]</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Error Message Display */}
            {errorMessage && (
                <div className="mt-4 p-4 bg-brand-gray border border-brand-border text-brand-white text-[10px] sm:text-xs font-mono uppercase">
                    ERR: {errorMessage}
                </div>
            )}

            {/* Success Banner */}
            {depositTxSuccess && (
                <div className="mt-4 p-4 bg-brand-gray border border-brand-border text-brand-white text-[10px] sm:text-xs font-mono uppercase space-y-2">
                    <div className="flex items-center gap-2 font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>TRANSACTION DISPATCHED</span>
                    </div>
                    <p className="text-brand-silver">
                        MERKLE TREE INSERTION IN PROGRESS. AWAITING ON-CHAIN CONFIRMATION.
                    </p>
                </div>
            )}
        </div>
    );
}

