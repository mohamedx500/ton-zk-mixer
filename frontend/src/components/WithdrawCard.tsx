'use client';

import React, { useState } from 'react';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { Address, toNano } from '@ton/core';
import { motion, AnimatePresence } from 'framer-motion';
import {
    KeyRound,
    CheckCircle2,
    Loader2,
    ShieldAlert,
    Cpu,
    ArrowRight,
    ExternalLink,
    Wallet,
    Sparkles,
    Zap,
    RefreshCw,
    Shield,
    Check,
    Lock,
    Sliders,
    Info,
} from 'lucide-react';
import { parseDepositNote, DepositNote, MerkleProof } from '../lib/crypto';
import {
    checkNullifierSpent,
    syncTreeFromBlockchain,
    buildWithdrawTransaction,
} from '../lib/ton';
import { generateClientWithdrawProof, ZkWithdrawProof } from '../lib/prover';
import { TESTNET_EXPLORER_URL, RELAYER_ENDPOINT, UPFRONT_POOL_TIERS, WITHDRAW_GAS_FEE } from '../lib/contracts';
import { TonIcon, TonDiamond, ZkCircuitIcon } from './TonIcons';
import { BottomSheet } from './BottomSheet';

function getFormattedPayoutAmount(amountStr?: string): string {
    if (!amountStr) return '1.0 TON';
    const clean = amountStr.replace(' TON', '').trim();
    if (UPFRONT_POOL_TIERS[clean]) {
        return UPFRONT_POOL_TIERS[clean].poolAmount;
    }
    return amountStr.includes('TON') ? amountStr : `${amountStr} TON`;
}

interface WithdrawCardProps {
    onWithdrawSuccess?: () => void;
}

export function WithdrawCard({ onWithdrawSuccess }: WithdrawCardProps) {
    const [tonConnectUI] = useTonConnectUI();
    const wallet = useTonWallet();

    const [noteString, setNoteString] = useState('');
    const [parsedNote, setParsedNote] = useState<DepositNote | null>(null);
    const [recipientAddress, setRecipientAddress] = useState('');

    // Merkle tree verification state
    const [isCheckingTree, setIsCheckingTree] = useState(false);
    const [treeStatus, setTreeStatus] = useState<string | null>(null);
    const [leafIndex, setLeafIndex] = useState<number | null>(null);
    const [merkleProof, setMerkleProof] = useState<MerkleProof | null>(null);
    const [isSpent, setIsSpent] = useState<boolean | null>(null);

    // Relayer Toggle
    const [useRelayer, setUseRelayer] = useState(true);

    // ZK Proving state
    const [isProving, setIsProving] = useState(false);
    const [provingProgress, setProvingProgress] = useState<string | null>(null);
    const [zkProof, setZkProof] = useState<ZkWithdrawProof | null>(null);

    // Submission state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [txSuccess, setTxSuccess] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isSummaryDrawerOpen, setIsSummaryDrawerOpen] = useState(false);

    // Step 1: Parse and verify Note against on-chain state
    const handleVerifyNote = async (inputStr: string) => {
        setErrorMessage(null);
        setTreeStatus(null);
        setLeafIndex(null);
        setMerkleProof(null);
        setIsSpent(null);
        setZkProof(null);
        setTxSuccess(null);

        if (!inputStr.trim()) {
            setParsedNote(null);
            return;
        }

        try {
            const note = parseDepositNote(inputStr);
            setParsedNote(note);

            setIsCheckingTree(true);
            setTreeStatus('Verifying note against on-chain Merkle tree...');

            // 1. Check if nullifier is already spent
            const spent = await checkNullifierSpent(note.nullifierHash);
            setIsSpent(spent);
            if (spent) {
                setErrorMessage('⚠️ This note has ALREADY been spent! Nullifier is used.');
                setIsCheckingTree(false);
                return;
            }

            // 2. Synchronize Merkle tree from on-chain history
            const tree = await syncTreeFromBlockchain((msg) => setTreeStatus(msg));

            // Find leaf index
            const foundIdx = tree.leaves.findIndex((c) => c === note.commitment);
            if (foundIdx === -1) {
                setTreeStatus(
                    '⚠️ Note commitment not yet found in current Merkle tree. If you just deposited, wait 5-10 seconds for block confirmation and retry.'
                );
                setIsCheckingTree(false);
                return;
            }

            const proof = tree.getProof(foundIdx);
            setLeafIndex(foundIdx);
            setMerkleProof(proof);
            setTreeStatus(`✅ Note verified! Located at Tree Leaf #${foundIdx}.`);
        } catch (err: any) {
            setErrorMessage(err.message || 'Failed to parse secret note');
            setParsedNote(null);
        } finally {
            setIsCheckingTree(false);
        }
    };

    // Use connected wallet as recipient address shortcut
    const handleUseConnectedWallet = () => {
        if (wallet?.account.address) {
            try {
                const parsed = Address.parse(wallet.account.address);
                setRecipientAddress(parsed.toString({ testOnly: true, bounceable: false }));
            } catch (_) {
                setRecipientAddress(wallet.account.address);
            }
        }
    };

    // Step 2: Generate ZK-Proof locally
    const handleGenerateProof = async () => {
        if (!parsedNote || !merkleProof || !recipientAddress.trim()) return;
        setErrorMessage(null);

        let parsedRecipient: Address;
        try {
            parsedRecipient = Address.parse(recipientAddress.trim());
        } catch (_) {
            setErrorMessage('Invalid TON recipient address format');
            return;
        }

        try {
            setIsProving(true);
            setProvingProgress('Starting in-browser zero-knowledge proof generation...');

            const proof = await generateClientWithdrawProof(
                parsedNote,
                merkleProof,
                parsedRecipient,
                BigInt(0), // Native TON assetId
                (step) => setProvingProgress(step)
            );

            setZkProof(proof);
            setProvingProgress(null);
            setIsSummaryDrawerOpen(true);
        } catch (err: any) {
            console.error('Prover error:', err);
            setErrorMessage(err.message || 'Proof generation failed');
        } finally {
            setIsProving(false);
        }
    };

    // Step 3: Broadcast Withdrawal Transaction
    const handleWithdraw = async () => {
        if (!zkProof) return;
        setErrorMessage(null);
        setTxSuccess(null);

        try {
            setIsSubmitting(true);

            if (useRelayer) {
                // Submit gasless withdrawal payload to Relayer endpoint
                const relayerRes = await fetch(RELAYER_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        piA: zkProof.piA.toString('hex'),
                        piB: zkProof.piB.toString('hex'),
                        piC: zkProof.piC.toString('hex'),
                        root: zkProof.root.toString(),
                        nullifierHash: zkProof.nullifierHash.toString(),
                        recipient: zkProof.recipient.toString({ testOnly: true, bounceable: false }),
                        assetId: 0,
                    }),
                });

                const data = await relayerRes.json();
                if (!relayerRes.ok || !data.success) {
                    throw new Error(data.error || 'Relayer failed to broadcast transaction');
                }

                setTxSuccess(data.txHash || 'Broadcasted via Gasless Relayer Network');
            } else {
                // Submit directly from connected wallet
                if (!wallet) {
                    tonConnectUI.openModal();
                    return;
                }

                const txRequest = buildWithdrawTransaction(
                    zkProof,
                    toNano(WITHDRAW_GAS_FEE)
                );

                const result = await tonConnectUI.sendTransaction(txRequest);
                setTxSuccess(result.boc || 'Broadcasted directly from connected wallet');
            }

            setIsSummaryDrawerOpen(false);
            onWithdrawSuccess?.();
        } catch (err: any) {
            console.error('Withdraw error:', err);
            setErrorMessage(err.message || 'Withdrawal failed');
        } finally {
            setIsSubmitting(false);
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
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
                        <Lock className="w-6 h-6 text-emerald-400" />
                        <span>Anonymous Withdrawal</span>
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-400 mt-1">
                        Redeem your Secret Note to any fresh TON address. Zero cryptographic link to your deposit address.
                    </p>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold">
                    <ZkCircuitIcon className="w-4 h-4" />
                    <span>Groth16 Zero-Knowledge</span>
                </div>
            </div>

            {/* Gasless Relayer Mode Banner */}
            <div className="bg-[#080d1a]/90 backdrop-blur-md border border-white/10 rounded-xl p-4 mb-6 shadow-inner">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                                useRelayer ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-gray-800 text-gray-400 border border-white/5'
                            }`}
                        >
                            <Zap className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs sm:text-sm font-bold text-white">Gasless Relayer Mode</span>
                                {useRelayer && (
                                    <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-extrabold uppercase tracking-wide">
                                        Recommended
                                    </span>
                                )}
                            </div>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                                {useRelayer
                                    ? 'The Relayer broadcasts for you. Recipient needs 0 TON to receive funds.'
                                    : 'You pay message gas (~0.04 TON) directly from your connected wallet.'}
                            </p>
                        </div>
                    </div>

                    {/* Toggle Switch */}
                    <button
                        type="button"
                        onClick={() => setUseRelayer(!useRelayer)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            useRelayer ? 'bg-amber-500' : 'bg-gray-700'
                        }`}
                        title="Toggle Gasless Relayer"
                    >
                        <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                useRelayer ? 'translate-x-5' : 'translate-x-0'
                            }`}
                        />
                    </button>
                </div>
            </div>

            {/* Step 1: Input Secret Note */}
            <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                        <span>1. Secret Deposit Note</span>
                    </label>
                    {parsedNote && (
                        <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                            <TonDiamond className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Denomination: {getFormattedPayoutAmount(parsedNote.amount)}</span>
                        </span>
                    )}
                </div>

                <div className="relative">
                    <input
                        type="text"
                        value={noteString}
                        onChange={(e) => {
                            setNoteString(e.target.value);
                            handleVerifyNote(e.target.value);
                        }}
                        placeholder="tonzk-1.0-TON-0000...-0000..."
                        className="w-full bg-[#070b14] border border-white/10 focus:border-cyan-400 rounded-xl p-3.5 text-xs text-cyan-200 font-mono focus:outline-none transition-all placeholder:text-gray-600 shadow-inner"
                    />
                </div>

                {/* Tree Verification Status */}
                {isCheckingTree && (
                    <div className="flex items-center gap-2 mt-2 text-xs text-cyan-400">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{treeStatus}</span>
                    </div>
                )}
                {!isCheckingTree && treeStatus && (
                    <div className="mt-2.5 flex items-center justify-between gap-2.5 p-3 rounded-xl border border-white/5 bg-[#080d1a]">
                        <span className={`text-xs font-medium leading-relaxed ${treeStatus.startsWith('✅') ? 'text-emerald-400' : 'text-cyan-300'}`}>
                            {treeStatus}
                        </span>
                        {noteString.trim() && (
                            <button
                                type="button"
                                onClick={() => handleVerifyNote(noteString)}
                                className="px-3 py-1.5 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/25 rounded-lg transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
                                title="Re-scan on-chain Merkle tree"
                            >
                                <RefreshCw className="w-3 h-3" />
                                <span>Re-check Tree</span>
                            </button>
                        )}
                    </div>
                )}
                {isSpent && (
                    <div className="flex items-center gap-2 mt-2 text-xs text-red-400 font-bold">
                        <ShieldAlert className="w-4 h-4" />
                        <span>Nullifier already spent on-chain! This note cannot be redeemed again.</span>
                    </div>
                )}
            </div>

            {/* Step 2: Input Clean Recipient Address */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                        <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                        <span>2. Recipient Wallet Address (Clean / Unlinked)</span>
                    </label>
                    {wallet && !useRelayer && (
                        <button
                            type="button"
                            onClick={handleUseConnectedWallet}
                            className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 cursor-pointer"
                        >
                            <Wallet className="w-3 h-3" />
                            <span>Use Connected Wallet</span>
                        </button>
                    )}
                </div>
                <input
                    type="text"
                    value={recipientAddress}
                    onChange={(e) => {
                        setRecipientAddress(e.target.value);
                        setZkProof(null);
                    }}
                    placeholder="0Q... or UQ... (Fresh empty recipient address)"
                    className="w-full bg-[#070b14] border border-white/10 focus:border-cyan-400 rounded-xl p-3.5 text-xs sm:text-sm text-white font-mono focus:outline-none transition-all placeholder:text-gray-600 shadow-inner"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                    {useRelayer
                        ? '✨ Relayer enables withdrawing directly to a brand-new wallet with 0 TON balance.'
                        : 'Tip: For maximum privacy, withdraw to a fresh address that has never interacted with your deposit wallet.'}
                </p>
            </div>

            {/* Step 3: Generate ZK-SNARK Proof */}
            <div className="space-y-4">
                {!zkProof ? (
                    <motion.button
                        type="button"
                        whileHover={!merkleProof || isSpent === true || !recipientAddress.trim() || isProving ? {} : { scale: 1.01 }}
                        whileTap={!merkleProof || isSpent === true || !recipientAddress.trim() || isProving ? {} : { scale: 0.99 }}
                        disabled={!merkleProof || isSpent === true || !recipientAddress.trim() || isProving}
                        onClick={handleGenerateProof}
                        className={`w-full py-4 rounded-xl font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all ${
                            !merkleProof || isSpent === true || !recipientAddress.trim() || isProving
                                ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-white/5'
                                : 'bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-black shadow-xl shadow-cyan-500/25 cursor-pointer'
                        }`}
                    >
                        {isProving ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Generating Proof in Browser...</span>
                            </>
                        ) : (
                            <>
                                <Cpu className="w-5 h-5" />
                                <span>Generate Groth16 ZK-Proof Locally</span>
                            </>
                        )}
                    </motion.button>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-glass-inner rounded-xl p-5 border border-emerald-500/30 space-y-3.5"
                    >
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4" />
                                <span>Groth16 Proof Ready</span>
                            </span>
                            <span className="text-gray-400 font-mono">Generated in {zkProof.proofTimeMs}ms</span>
                        </div>

                        <div className="p-3 bg-[#060912] rounded-lg border border-white/5 text-[11px] font-mono text-gray-400 space-y-1">
                            <div><span className="text-gray-500">Root:</span> {zkProof.root.toString().slice(0, 20)}...</div>
                            <div><span className="text-gray-500">Nullifier:</span> {zkProof.nullifierHash.toString().slice(0, 20)}...</div>
                            <div><span className="text-gray-500">Recipient:</span> {zkProof.recipient.toString({ testOnly: true, bounceable: false }).slice(0, 16)}...</div>
                        </div>

                        <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={handleWithdraw}
                            className={`w-full py-4 rounded-xl text-black font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-xl transition-all cursor-pointer ${
                                useRelayer
                                    ? 'bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 hover:from-amber-300 hover:to-orange-400 shadow-amber-500/25'
                                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 shadow-emerald-500/25'
                            }`}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>{useRelayer ? 'Relayer broadcasting...' : 'Broadcasting to TON...'}</span>
                                </>
                            ) : useRelayer ? (
                                <>
                                    <Zap className="w-5 h-5 text-black" />
                                    <span>Submit Gasless Withdrawal (Receive {parsedNote ? getFormattedPayoutAmount(parsedNote.amount) : '1 TON'})</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            ) : (
                                <>
                                    <span>Submit Withdrawal ({parsedNote ? getFormattedPayoutAmount(parsedNote.amount) : '1 TON'})</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </motion.div>
                )}

                {/* Live Prover Progress Message */}
                {isProving && provingProgress && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-xs text-cyan-300 flex items-center gap-2"
                    >
                        <Loader2 className="w-4 h-4 animate-spin shrink-0 text-cyan-400" />
                        <span className="font-mono">{provingProgress}</span>
                    </motion.div>
                )}
            </div>

            {/* Error Message Display */}
            {errorMessage && (
                <div className="mt-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                    {errorMessage}
                </div>
            )}

            {/* Success Banner */}
            {txSuccess && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs space-y-2"
                >
                    <div className="flex items-center gap-2 font-bold text-emerald-300">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Withdrawal broadcasted successfully!</span>
                    </div>
                    <p className="text-gray-300">
                        {useRelayer
                            ? 'The transaction has been relayed. The recipient wallet will receive the full pool payout with 0 deductions.'
                            : 'The transaction has been dispatched from your wallet to the mixer contract.'}
                    </p>
                    <div className="font-mono text-[11px] text-cyan-300 break-all select-all pt-1">
                        TX: {txSuccess}
                    </div>
                </motion.div>
            )}

            {/* Vaul BottomSheet for Mobile Summary */}
            {zkProof && (
                <BottomSheet
                    open={isSummaryDrawerOpen}
                    onOpenChange={setIsSummaryDrawerOpen}
                    title={
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-emerald-400" />
                            <span>Ready to Withdraw</span>
                        </div>
                    }
                    description="Zero-Knowledge Groth16 proof successfully synthesized locally."
                >
                    <div className="space-y-4 pt-1">
                        <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 space-y-2 text-xs">
                            <div className="flex justify-between">
                                <span className="text-gray-400">Payout Denomination:</span>
                                <span className="text-white font-bold">{parsedNote ? getFormattedPayoutAmount(parsedNote.amount) : '1.0 TON'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Target Recipient:</span>
                                <span className="text-cyan-300 font-mono text-[11px]">
                                    {zkProof.recipient.toString({ testOnly: true, bounceable: false }).slice(0, 14)}...
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Execution Mode:</span>
                                <span className={useRelayer ? 'text-amber-400 font-bold' : 'text-gray-300 font-medium'}>
                                    {useRelayer ? 'Gasless Relayer (0 TON Needed)' : 'Self-Broadcast'}
                                </span>
                            </div>
                        </div>

                        <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={handleWithdraw}
                            className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-extrabold text-sm flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Broadcasting...</span>
                                </>
                            ) : (
                                <>
                                    <span>Execute Payout Now</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </div>
                </BottomSheet>
            )}
        </motion.div>
    );
}
