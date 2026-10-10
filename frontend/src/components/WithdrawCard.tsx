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
    Wallet,
    Zap,
    RefreshCw,
    Lock,
} from 'lucide-react';
import { parseDepositNote, DepositNote, MerkleProof } from '../lib/crypto';
import {
    checkNullifierSpent,
    syncTreeFromBlockchain,
    buildWithdrawTransaction,
} from '../lib/ton';
import { generateClientWithdrawProof, ZkWithdrawProof } from '../lib/prover';
import { TESTNET_EXPLORER_URL, RELAYER_ENDPOINT, UPFRONT_POOL_TIERS, WITHDRAW_GAS_FEE } from '../lib/contracts';
import { TonIcon, ZkCircuitIcon } from './TonIcons';
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
            setTreeStatus('VERIFYING NOTE AGAINST MERKLE TREE...');

            // 1. Check if nullifier is already spent
            const spent = await checkNullifierSpent(note.nullifierHash);
            setIsSpent(spent);
            if (spent) {
                setErrorMessage('ERR: NULLIFIER SPENT. THIS NOTE CANNOT BE REDEEMED AGAIN.');
                setIsCheckingTree(false);
                return;
            }

            // 2. Synchronize Merkle tree from on-chain history
            const tree = await syncTreeFromBlockchain((msg) => setTreeStatus(msg.toUpperCase()));

            // Find leaf index
            const foundIdx = tree.leaves.findIndex((c) => c === note.commitment);
            if (foundIdx === -1) {
                setTreeStatus(
                    'ERR: COMMITMENT NOT FOUND. WAIT FOR BLOCK CONFIRMATION AND RETRY.'
                );
                setIsCheckingTree(false);
                return;
            }

            const proof = tree.getProof(foundIdx);
            setLeafIndex(foundIdx);
            setMerkleProof(proof);
            setTreeStatus(`VERIFIED: LEAF INDEX #${foundIdx}`);
        } catch (err: any) {
            setErrorMessage(err.message ? `ERR: ${err.message.toUpperCase()}` : 'ERR: FAILED TO PARSE SECRET NOTE');
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
            setErrorMessage('ERR: INVALID TON ADDRESS FORMAT');
            return;
        }

        try {
            setIsProving(true);
            setProvingProgress('STARTING LOCAL ZERO-KNOWLEDGE PROOF GENERATION...');

            const proof = await generateClientWithdrawProof(
                parsedNote,
                merkleProof,
                parsedRecipient,
                BigInt(0), // Native TON assetId
                (step) => setProvingProgress(step.toUpperCase())
            );

            setZkProof(proof);
            setProvingProgress(null);
            setIsSummaryDrawerOpen(true);
        } catch (err: any) {
            console.error('Prover error:', err);
            setErrorMessage(err.message ? `ERR: ${err.message.toUpperCase()}` : 'ERR: PROOF GENERATION FAILED');
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
                    throw new Error(data.error || 'RELAYER BROADCAST FAILED');
                }

                setTxSuccess(data.txHash || 'BROADCASTED VIA GASLESS RELAYER NETWORK');
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
                setTxSuccess(result.boc || 'BROADCASTED DIRECTLY FROM CONNECTED WALLET');
            }

            setIsSummaryDrawerOpen(false);
            onWithdrawSuccess?.();
        } catch (err: any) {
            console.error('Withdraw error:', err);
            setErrorMessage(err.message ? `ERR: ${err.message.toUpperCase()}` : 'ERR: WITHDRAWAL FAILED');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-minimal-card p-6 border border-brand-border text-brand-white relative">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 border-b border-brand-border pb-4">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2 uppercase tracking-wide">
                        <Lock className="w-5 h-5 text-brand-silver" />
                        <span>System Withdrawal</span>
                    </h2>
                    <p className="text-xs text-brand-silver mt-1 font-mono">
                        Redeem cryptographic note to any unlinked destination.
                    </p>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 border border-brand-border bg-brand-offblack text-brand-silver text-[10px] font-mono uppercase">
                    <ZkCircuitIcon className="w-3.5 h-3.5 grayscale" />
                    <span>ZK-SNARK</span>
                </div>
            </div>

            {/* Gasless Relayer Mode Banner */}
            <div className="bg-brand-gray border border-brand-border p-4 mb-6 font-mono text-[11px] sm:text-xs">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div
                            className={`w-8 h-8 flex items-center justify-center border transition-colors ${
                                useRelayer ? 'bg-brand-white text-black border-brand-white' : 'bg-brand-offblack text-brand-silver border-brand-border'
                            }`}
                        >
                            <Zap className="w-4 h-4" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-brand-white uppercase">Relayer Network Mode</span>
                                {useRelayer && (
                                    <span className="text-[9px] bg-brand-white text-black px-1.5 py-0.5 font-bold uppercase tracking-widest">
                                        ACTIVE
                                    </span>
                                )}
                            </div>
                            <p className="text-[10px] text-brand-silver mt-1 uppercase">
                                {useRelayer
                                    ? '> GASLESS: RECIPIENT WALLET REQUIRES 0 TON.'
                                    : '> SELF-BROADCAST: PAY MESSAGE GAS (~0.04 TON) FROM CONNECTED WALLET.'}
                            </p>
                        </div>
                    </div>

                    {/* Toggle Switch */}
                    <button
                        type="button"
                        onClick={() => setUseRelayer(!useRelayer)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-none border border-brand-border transition-colors duration-200 ease-in-out focus:outline-none ${
                            useRelayer ? 'bg-brand-silver' : 'bg-brand-offblack'
                        }`}
                        title="Toggle Relayer"
                    >
                        <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-none bg-brand-white shadow-none transition duration-200 ease-in-out ${
                                useRelayer ? 'translate-x-4' : 'translate-x-0'
                            }`}
                        />
                    </button>
                </div>
            </div>

            {/* Step 1: Input Secret Note */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-brand-silver flex items-center gap-2">
                        <KeyRound className="w-3.5 h-3.5 grayscale opacity-70" />
                        <span>[1] DEPOSIT CREDENTIALS</span>
                    </label>
                    {parsedNote && (
                        <span className="text-[10px] text-brand-white font-mono uppercase tracking-widest border border-brand-border px-2 py-1">
                            DENOMINATION: {getFormattedPayoutAmount(parsedNote.amount)}
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
                        placeholder="INPUT SECRET STRING..."
                        className="w-full bg-brand-black border border-brand-border focus:border-brand-silver rounded-none p-4 text-[11px] sm:text-xs text-brand-white font-mono uppercase focus:outline-none transition-colors placeholder:text-brand-silver/50"
                    />
                </div>

                {/* Tree Verification Status */}
                {isCheckingTree && (
                    <div className="flex items-center gap-2 mt-3 text-[10px] font-mono uppercase text-brand-silver">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{treeStatus}</span>
                    </div>
                )}
                {!isCheckingTree && treeStatus && (
                    <div className="mt-3 flex items-center justify-between gap-2 p-3 bg-brand-gray border border-brand-border font-mono text-[10px] uppercase">
                        <span className={`font-bold ${treeStatus.startsWith('VERIFIED') ? 'text-brand-white' : 'text-brand-silver'}`}>
                            {treeStatus}
                        </span>
                        {noteString.trim() && (
                            <button
                                type="button"
                                onClick={() => handleVerifyNote(noteString)}
                                className="px-3 py-1.5 border border-brand-border hover:border-brand-silver text-brand-silver hover:text-brand-white transition-colors flex items-center gap-2"
                                title="Re-scan on-chain Merkle tree"
                            >
                                <RefreshCw className="w-3 h-3" />
                                <span>RE-SCAN</span>
                            </button>
                        )}
                    </div>
                )}
                {isSpent && (
                    <div className="flex items-center gap-2 mt-3 text-[10px] font-mono uppercase text-brand-silver font-bold border border-brand-border p-3 bg-brand-gray">
                        <ShieldAlert className="w-4 h-4" />
                        <span>ERR: NULLIFIER SPENT</span>
                    </div>
                )}
            </div>

            {/* Step 2: Input Clean Recipient Address */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-brand-silver flex items-center gap-2">
                        <Wallet className="w-3.5 h-3.5 grayscale opacity-70" />
                        <span>[2] DESTINATION ADDRESS</span>
                    </label>
                    {wallet && !useRelayer && (
                        <button
                            type="button"
                            onClick={handleUseConnectedWallet}
                            className="text-[10px] text-brand-silver hover:text-brand-white font-mono uppercase flex items-center gap-1 border border-brand-border px-2 py-1"
                        >
                            <Wallet className="w-3 h-3" />
                            <span>USE CONNECTED</span>
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
                    placeholder="0Q... OR UQ... (UNLINKED DESTINATION)"
                    className="w-full bg-brand-black border border-brand-border focus:border-brand-silver rounded-none p-4 text-[11px] sm:text-xs text-brand-white font-mono uppercase focus:outline-none transition-colors placeholder:text-brand-silver/50"
                />
                <p className="text-[10px] text-brand-silver mt-2 font-mono uppercase">
                    {useRelayer
                        ? '> RELAYER ALLOWS PAYOUT TO 0-BALANCE ADDRESS.'
                        : '> USE A FRESH ADDRESS FOR MAXIMUM OPSEC.'}
                </p>
            </div>

            {/* Step 3: Generate ZK-SNARK Proof */}
            <div className="space-y-4">
                {!zkProof ? (
                    <button
                        type="button"
                        disabled={!merkleProof || isSpent === true || !recipientAddress.trim() || isProving}
                        onClick={handleGenerateProof}
                        className={`w-full py-4 font-mono font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${
                            !merkleProof || isSpent === true || !recipientAddress.trim() || isProving
                                ? 'bg-brand-offblack text-brand-silver border border-brand-border cursor-not-allowed'
                                : 'bg-brand-white text-brand-black hover:bg-brand-silver border border-brand-white'
                        }`}
                    >
                        {isProving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>SYNTHESIZING PROOF...</span>
                            </>
                        ) : (
                            <>
                                <Cpu className="w-4 h-4" />
                                <span>GENERATE ZK-PROOF</span>
                            </>
                        )}
                    </button>
                ) : (
                    <div className="bg-brand-gray border border-brand-border p-5 space-y-4">
                        <div className="flex items-center justify-between text-[10px] sm:text-xs font-mono uppercase border-b border-brand-border pb-3">
                            <span className="font-bold text-brand-white flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>PROOF SYNTHESIZED</span>
                            </span>
                            <span className="text-brand-silver">LATENCY: {zkProof.proofTimeMs}MS</span>
                        </div>

                        <div className="p-3 bg-brand-black border border-brand-border text-[9px] font-mono uppercase text-brand-silver space-y-1.5 break-all">
                            <div><span className="text-brand-white">ROOT:</span> {zkProof.root.toString().slice(0, 32)}...</div>
                            <div><span className="text-brand-white">NULLIFIER:</span> {zkProof.nullifierHash.toString().slice(0, 32)}...</div>
                            <div><span className="text-brand-white">DEST:</span> {zkProof.recipient.toString({ testOnly: true, bounceable: false }).slice(0, 24)}...</div>
                        </div>

                        <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={handleWithdraw}
                            className={`w-full py-4 border font-mono font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${
                                useRelayer
                                    ? 'bg-brand-white text-black border-brand-white hover:bg-brand-silver'
                                    : 'bg-brand-offblack text-brand-white border-brand-border hover:border-brand-silver'
                            }`}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>{useRelayer ? 'RELAYING...' : 'BROADCASTING...'}</span>
                                </>
                            ) : useRelayer ? (
                                <>
                                    <Zap className="w-4 h-4" />
                                    <span>EXECUTE PAYOUT [{parsedNote ? getFormattedPayoutAmount(parsedNote.amount) : '1 TON'}]</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            ) : (
                                <>
                                    <span>EXECUTE PAYOUT [{parsedNote ? getFormattedPayoutAmount(parsedNote.amount) : '1 TON'}]</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </div>
                )}

                {/* Live Prover Progress Message */}
                {isProving && provingProgress && (
                    <div className="p-4 bg-brand-gray border border-brand-border text-[10px] text-brand-white font-mono uppercase flex items-center gap-3">
                        <Loader2 className="w-4 h-4 animate-spin shrink-0 text-brand-silver" />
                        <span>{provingProgress}</span>
                    </div>
                )}
            </div>

            {/* Error Message Display */}
            {errorMessage && (
                <div className="mt-4 p-4 bg-brand-gray border border-brand-border text-[10px] sm:text-xs font-mono uppercase text-brand-white">
                    {errorMessage}
                </div>
            )}

            {/* Success Banner */}
            {txSuccess && (
                <div className="mt-4 p-5 bg-brand-gray border border-brand-border space-y-3 font-mono text-[10px] sm:text-xs uppercase">
                    <div className="flex items-center gap-2 font-bold text-brand-white border-b border-brand-border pb-2">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>PAYOUT DISPATCHED</span>
                    </div>
                    <p className="text-brand-silver leading-relaxed">
                        {useRelayer
                            ? '> RELAYER NETWORK HAS BROADCASTED THE TRANSACTION. TARGET WILL RECEIVE FULL PAYOUT.'
                            : '> TRANSACTION DISPATCHED LOCALLY.'}
                    </p>
                    <div className="text-brand-white break-all bg-brand-black p-3 border border-brand-border">
                        TX: {txSuccess}
                    </div>
                </div>
            )}

            {/* Vaul BottomSheet for Mobile Summary */}
            {zkProof && (
                <BottomSheet
                    open={isSummaryDrawerOpen}
                    onOpenChange={setIsSummaryDrawerOpen}
                    title={
                        <div className="flex items-center gap-2 font-mono uppercase text-brand-white text-sm tracking-wider">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>VERIFIED</span>
                        </div>
                    }
                    description="ZK PROOF SYNTHESIZED. READY TO EXECUTE."
                >
                    <div className="space-y-4 pt-2 font-mono text-[10px] sm:text-xs uppercase">
                        <div className="p-4 bg-brand-gray border border-brand-border space-y-3">
                            <div className="flex justify-between border-b border-brand-border pb-2">
                                <span className="text-brand-silver">DENOMINATION:</span>
                                <span className="text-brand-white font-bold">{parsedNote ? getFormattedPayoutAmount(parsedNote.amount) : '1.0 TON'}</span>
                            </div>
                            <div className="flex justify-between border-b border-brand-border pb-2">
                                <span className="text-brand-silver">TARGET:</span>
                                <span className="text-brand-white">
                                    {zkProof.recipient.toString({ testOnly: true, bounceable: false }).slice(0, 14)}...
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-brand-silver">MODE:</span>
                                <span className={useRelayer ? 'text-brand-white font-bold' : 'text-brand-silver'}>
                                    {useRelayer ? 'GASLESS RELAYER' : 'LOCAL BROADCAST'}
                                </span>
                            </div>
                        </div>

                        <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={handleWithdraw}
                            className="w-full py-4 bg-brand-white hover:bg-brand-silver text-brand-black font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>EXECUTING...</span>
                                </>
                            ) : (
                                <>
                                    <span>CONFIRM PAYOUT</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </div>
                </BottomSheet>
            )}
        </div>
    );
}

