'use client';

import React, { useState } from 'react';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { Address } from '@ton/core';
import confetti from 'canvas-confetti';
import {
    ArrowRight,
    CheckCircle2,
    Cpu,
    ExternalLink,
    Loader2,
    Lock,
    ShieldAlert,
    Sparkles,
    Wallet,
    Zap,
} from 'lucide-react';
import { parseDepositNote, DepositNote, MerkleProof } from '../lib/crypto';
import {
    checkNullifierSpent,
    syncTreeFromBlockchain,
    buildWithdrawTransaction,
} from '../lib/ton';
import { generateClientWithdrawProof, ZkWithdrawProof } from '../lib/prover';
import { TESTNET_EXPLORER_URL, RELAYER_ENDPOINT } from '../lib/contracts';

interface WithdrawCardProps {
    onWithdrawSuccess?: () => void;
}

export function WithdrawCard({ onWithdrawSuccess }: WithdrawCardProps) {
    const [tonConnectUI] = useTonConnectUI();
    const wallet = useTonWallet();

    const [noteString, setNoteString] = useState('');
    const [recipientAddress, setRecipientAddress] = useState('');
    const [parsedNote, setParsedNote] = useState<DepositNote | null>(null);
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
        } catch (err: any) {
            console.error('Prover error:', err);
            setErrorMessage(err.message || 'Failed to generate zero-knowledge proof');
        } finally {
            setIsProving(false);
        }
    };

    // Step 3: Submit Anonymous Withdrawal transaction (Relayer or TonConnect)
    const handleWithdraw = async () => {
        if (!zkProof) return;
        setErrorMessage(null);

        try {
            setIsSubmitting(true);

            if (useRelayer) {
                // GASLESS WITHDRAWAL VIA BACKEND RELAYER
                const relayPayload = {
                    rawProof: zkProof.rawProof,
                    publicSignals: zkProof.publicSignals,
                    piABase64: zkProof.piA.toBoc().toString('base64'),
                    piBBase64: zkProof.piB.toBoc().toString('base64'),
                    piCBase64: zkProof.piC.toBoc().toString('base64'),
                    root: zkProof.root.toString(),
                    nullifierHash: zkProof.nullifierHash.toString(),
                    recipient: zkProof.recipient.toString({ testOnly: true, bounceable: false }),
                    assetId: zkProof.assetId.toString(),
                };

                const res = await fetch(RELAYER_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(relayPayload),
                });

                const data = await res.json();
                if (!res.ok || !data.success) {
                    throw new Error(data.error || 'Relayer failed to process withdrawal transaction');
                }

                setTxSuccess(`Gasless withdrawal dispatched via Relayer (${data.relayer.slice(0, 10)}...)!`);
            } else {
                // DIRECT TONCONNECT WALLET WITHDRAWAL
                if (!wallet) {
                    tonConnectUI.openModal();
                    setIsSubmitting(false);
                    return;
                }

                const txRequest = buildWithdrawTransaction(zkProof);
                const result = await tonConnectUI.sendTransaction(txRequest);
                setTxSuccess(result.boc || 'Withdrawal dispatched via wallet');
            }

            // Trigger celebration confetti!
            confetti({
                particleCount: 120,
                spread: 80,
                origin: { y: 0.6 },
                colors: ['#06b6d4', '#10b981', '#f59e0b', '#8b5cf6'],
            });

            onWithdrawSuccess?.();
        } catch (err: any) {
            console.error('Withdraw error:', err);
            setErrorMessage(err.message || 'Withdrawal transaction cancelled or failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-glass-card rounded-2xl p-6 sm:p-8 border border-white/10 relative overflow-hidden transition-all">
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
                        Prove ownership with zero-knowledge without revealing your original deposit identity.
                    </p>
                </div>
            </div>

            {/* Relayer Gasless Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-glass-inner border border-white/5 mb-5 transition-all">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                        <Zap className={`w-4 h-4 ${useRelayer ? 'text-amber-400' : 'text-gray-500'}`} />
                    </div>
                    <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span>Use Relayer (Gasless Withdrawal)</span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                Zero Balance Friendly
                            </span>
                        </div>
                        <div className="text-[11px] text-gray-400">
                            {useRelayer
                                ? 'Gas is 100% covered by the Relayer network. No TON balance needed in wallet.'
                                : 'Gas paid via your connected TonConnect wallet.'}
                        </div>
                    </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={useRelayer}
                        onChange={(e) => setUseRelayer(e.target.checked)}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-amber-500 peer-checked:to-orange-500"></div>
                </label>
            </div>

            {/* Step 1: Input Secret Note */}
            <div className="mb-5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    1. Paste Secret Note
                </label>
                <div className="relative">
                    <textarea
                        rows={2}
                        value={noteString}
                        onChange={(e) => {
                            setNoteString(e.target.value);
                            handleVerifyNote(e.target.value);
                        }}
                        placeholder="tonzk-1.0-TON-0000...-0000..."
                        className="w-full bg-[#070b14] border border-white/10 focus:border-cyan-400 rounded-xl p-3.5 text-xs text-cyan-200 font-mono focus:outline-none transition-all placeholder:text-gray-600"
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
                    <div className={`mt-2 text-xs font-medium ${treeStatus.startsWith('✅') ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {treeStatus}
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
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                        2. Recipient Wallet Address (Clean / Unlinked)
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
                    placeholder="0Q... or EQ... (Fresh empty recipient address)"
                    className="w-full bg-[#070b14] border border-white/10 focus:border-cyan-400 rounded-xl p-3.5 text-xs sm:text-sm text-white font-mono focus:outline-none transition-all placeholder:text-gray-600"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                    {useRelayer
                        ? '✨ Relayer enables withdrawing to a brand-new empty wallet with 0 TON balance.'
                        : 'Tip: For maximum privacy, withdraw to a fresh address that has never interacted with your deposit wallet.'}
                </p>
            </div>

            {/* Step 3: Generate ZK-SNARK Proof */}
            <div className="space-y-4">
                {!zkProof ? (
                    <button
                        type="button"
                        disabled={!merkleProof || isSpent === true || !recipientAddress.trim() || isProving}
                        onClick={handleGenerateProof}
                        className={`w-full py-4 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all ${
                            !merkleProof || isSpent === true || !recipientAddress.trim() || isProving
                                ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-white/5'
                                : 'bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-black shadow-lg shadow-cyan-500/20 cursor-pointer'
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
                    </button>
                ) : (
                    <div className="bg-glass-inner rounded-xl p-5 border border-emerald-500/30 space-y-3">
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4" />
                                <span>Groth16 Proof Ready</span>
                            </span>
                            <span className="text-gray-400">Generated in {zkProof.proofTimeMs}ms</span>
                        </div>

                        <div className="p-3 bg-[#060912] rounded-lg border border-white/5 text-[11px] font-mono text-gray-400 space-y-1">
                            <div><span className="text-gray-500">Root:</span> {zkProof.root.toString().slice(0, 20)}...</div>
                            <div><span className="text-gray-500">Nullifier:</span> {zkProof.nullifierHash.toString().slice(0, 20)}...</div>
                            <div><span className="text-gray-500">Recipient Bound:</span> {zkProof.recipient.toString({ testOnly: true, bounceable: false }).slice(0, 16)}...</div>
                        </div>

                        <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={handleWithdraw}
                            className={`w-full py-4 rounded-xl text-black font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg transition-all cursor-pointer ${
                                useRelayer
                                    ? 'bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 hover:from-amber-300 hover:to-orange-400 shadow-amber-500/20'
                                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 shadow-emerald-500/20'
                            }`}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>{useRelayer ? 'Relayer broadcasting transaction...' : 'Broadcasting to TON Testnet...'}</span>
                                </>
                            ) : useRelayer ? (
                                <>
                                    <Zap className="w-5 h-5 text-black" />
                                    <span>Submit Gasless Withdrawal via Relayer</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            ) : (
                                <>
                                    <span>Submit Anonymous Withdrawal (1.0 TON)</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </div>
                )}

                {/* Live Prover Progress Message */}
                {isProving && provingProgress && (
                    <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                        <span>{provingProgress}</span>
                    </div>
                )}
            </div>

            {/* Error Message */}
            {errorMessage && (
                <div className="mt-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                    {errorMessage}
                </div>
            )}

            {/* Success Celebration */}
            {txSuccess && (
                <div className="mt-4 p-5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-xs space-y-2.5">
                    <div className="flex items-center gap-2 font-bold text-emerald-300 text-sm">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <span>Anonymous Withdrawal Verified & Sent!</span>
                    </div>
                    <p className="text-gray-300 text-xs leading-relaxed">
                        {useRelayer
                            ? 'The Relayer verified your zk-SNARK proof and covered gas fees on your behalf. 1.0 TON has been dispatched to your clean recipient wallet.'
                            : 'The TON TVM Groth16 pairing instructions successfully verified your zero-knowledge proof. 1.0 TON has been dispatched to your clean recipient wallet.'}
                    </p>
                    <div className="pt-1">
                        <a
                            href={TESTNET_EXPLORER_URL(recipientAddress)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-300 hover:text-cyan-200 underline"
                        >
                            <span>View Recipient Wallet on TonScan</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}
