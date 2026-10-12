'use client';

import React, { useState } from 'react';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { Address, toNano } from '@ton/core';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle2,
    Loader2,
    ShieldAlert,
    Cpu,
    ArrowRight,
    Wallet,
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
import { TonIcon, TonDiamond, GramDiamondMark, ZkCircuitIcon, MerkleTreeIcon, NullifierIcon, RelayerFuelIcon } from './TonIcons';
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
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('tonzk:transaction_dispatched'));
            }
            onWithdrawSuccess?.();
        } catch (err: any) {
            console.error('Withdraw error:', err);
            setErrorMessage(err.message ? `ERR: ${err.message.toUpperCase()}` : 'ERR: WITHDRAWAL FAILED');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-[#10161F] p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-[#222E3E] text-white relative shadow-2xl transition-all duration-300">
            {/* Header with ton.org Aesthetic */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8 border-b border-[#222E3E] pb-4 sm:pb-5">
                <div>
                    <h2 className="text-lg sm:text-2xl font-bold flex items-center gap-2.5 uppercase tracking-wide">
                        <div className="p-1.5 sm:p-2 rounded-xl bg-[#1C2735] border border-[#2B3B4E]">
                            <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-[#30A1F5]" />
                        </div>
                        <span>Protocol Withdrawal</span>
                    </h2>
                    <p className="text-[11px] sm:text-xs text-[#94A3B8] mt-1 font-mono">
                        Redeem cryptographic note to any unlinked destination without trace
                    </p>
                </div>
                
                {/* Crypto Utility Badges */}
                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border border-white/10 bg-[#16202D] text-white text-[10px] font-mono tracking-wider shadow-sm">
                        <ZkCircuitIcon className="w-3.5 h-3.5 text-[#30A1F5]" />
                        <span className="font-bold">GROTH16 ZK</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border border-white/10 bg-[#16202D] text-[#94A3B8] text-[10px] font-mono tracking-wider shadow-sm">
                        <RelayerFuelIcon className="w-3.5 h-3.5 text-emerald-400" />
                        <span>GASLESS RELAY</span>
                    </div>
                </div>
            </div>

            {/* Gasless Relayer Mode Banner with Edged Corners & Smooth Toggle */}
            <div className="bg-[#141C26] rounded-xl border border-[#222E3E] p-3.5 sm:p-4 mb-6 sm:mb-7 font-mono text-[11px] sm:text-xs shadow-inner">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                        <div
                            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center border transition-all duration-200 shrink-0 ${
                                useRelayer
                                    ? 'bg-[#30A1F5] text-black border-[#30A1F5] shadow-md shadow-[#30A1F5]/20 font-bold'
                                    : 'bg-[#0B0E14] text-[#94A3B8] border-[#222E3E]'
                            }`}
                        >
                            <RelayerFuelIcon className="w-4 h-4" />
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                <span className="font-bold text-white uppercase text-[11px] sm:text-xs">Relayer Network Mode</span>
                                {useRelayer && (
                                    <span className="text-[8px] sm:text-[9px] bg-[#30A1F5] text-black px-1.5 sm:px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shadow-sm">
                                        GASLESS ACTIVE
                                    </span>
                                )}
                            </div>
                            <p className="text-[9px] sm:text-[10px] text-[#94A3B8] mt-0.5 uppercase">
                                {useRelayer
                                    ? '> GASLESS: RECIPIENT WALLET REQUIRES 0 TON.'
                                    : '> SELF-BROADCAST: PAY MESSAGE GAS (~0.04 TON) FROM WALLET.'}
                            </p>
                        </div>
                    </div>

                    {/* Smooth Toggle Switch with Edged / Rounded Pill Corners */}
                    <button
                        type="button"
                        onClick={() => setUseRelayer(!useRelayer)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border border-[#222E3E] transition-colors duration-250 ease-out focus:outline-none p-0.5 ${
                            useRelayer ? 'bg-[#30A1F5]' : 'bg-[#0B0E14]'
                        }`}
                        title="Toggle Relayer"
                    >
                        <span
                            className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-md transition-transform duration-250 ease-out ${
                                useRelayer ? 'translate-x-5' : 'translate-x-0'
                            }`}
                        />
                    </button>
                </div>
            </div>

            {/* Step 1: Input Secret Note with Edged Corners */}
            <div className="mb-6 sm:mb-7">
                <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-[#94A3B8] flex items-center gap-2">
                        <NullifierIcon className="w-3.5 h-3.5 text-[#30A1F5]" />
                        <span>[1] DEPOSIT CREDENTIALS</span>
                    </label>
                    {parsedNote && (
                        <span className="text-[10px] text-white font-mono uppercase tracking-wider border border-[#222E3E] px-2.5 py-1 rounded-full bg-[#141C26] flex items-center gap-1.5 shadow-sm">
                            <TonIcon className="w-3 h-3" />
                            <span>DENOMINATION: {getFormattedPayoutAmount(parsedNote.amount)}</span>
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
                        placeholder="PASTE SECRET NOTE (TONZK-1.0-HEX...)..."
                        className="w-full bg-[#0B0E14] border border-[#222E3E] focus:border-[#30A1F5] rounded-xl p-3.5 sm:p-4 text-[11px] sm:text-xs text-white font-mono uppercase focus:outline-none transition-all duration-200 placeholder:text-[#64748B] shadow-inner pr-20"
                    />
                    {noteString ? (
                        <button
                            type="button"
                            onClick={() => {
                                setNoteString('');
                                handleVerifyNote('');
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] sm:text-[10px] text-[#94A3B8] hover:text-white font-mono px-2 py-1 rounded-lg bg-[#141C26] border border-[#222E3E] cursor-pointer"
                        >
                            CLEAR
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={async () => {
                                try {
                                    const text = await navigator.clipboard.readText();
                                    if (text) {
                                        setNoteString(text.trim());
                                        handleVerifyNote(text.trim());
                                    }
                                } catch (_) {}
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] sm:text-[10px] text-[#30A1F5] hover:text-white font-mono px-2.5 py-1 rounded-lg bg-[#141C26] border border-[#222E3E] hover:border-[#30A1F5]/40 cursor-pointer"
                        >
                            PASTE
                        </button>
                    )}
                </div>

                {/* Tree Verification Status */}
                {isCheckingTree && (
                    <div className="flex items-center gap-2 mt-3 text-[10px] font-mono uppercase text-[#94A3B8]">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#30A1F5]" />
                        <span>{treeStatus}</span>
                    </div>
                )}
                {!isCheckingTree && treeStatus && (
                    <div className="mt-3 flex items-center justify-between gap-2 p-3 rounded-xl bg-[#141C26] border border-[#222E3E] font-mono text-[10px] uppercase">
                        <span className={`font-bold flex items-center gap-1.5 ${treeStatus.startsWith('VERIFIED') ? 'text-white' : 'text-[#94A3B8]'}`}>
                            <MerkleTreeIcon className="w-3.5 h-3.5 text-[#30A1F5]" />
                            <span>{treeStatus}</span>
                        </span>
                        {noteString.trim() && (
                            <button
                                type="button"
                                onClick={() => handleVerifyNote(noteString)}
                                className="px-3 py-1.5 rounded-lg border border-[#222E3E] hover:border-white/40 hover:bg-[#1A2432] text-[#94A3B8] hover:text-white transition-all duration-200 flex items-center gap-1.5 cursor-pointer"
                                title="Re-scan on-chain Merkle tree"
                            >
                                <RefreshCw className="w-3 h-3" />
                                <span>RE-SCAN</span>
                            </button>
                        )}
                    </div>
                )}
                {isSpent && (
                    <div className="flex items-center gap-2 mt-3 text-[10px] font-mono uppercase text-red-400 font-bold border border-red-500/30 p-3 rounded-xl bg-[#141C26]">
                        <ShieldAlert className="w-4 h-4" />
                        <span>ERR: NULLIFIER ALREADY SPENT ON-CHAIN</span>
                    </div>
                )}
            </div>

            {/* Step 2: Input Clean Recipient Address with Edged Corners */}
            <div className="mb-6 sm:mb-8">
                <div className="flex items-center justify-between mb-3">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-[#94A3B8] flex items-center gap-2">
                        <Wallet className="w-3.5 h-3.5 text-[#30A1F5]" />
                        <span>[2] CLEAN DESTINATION ADDRESS</span>
                    </label>
                    {wallet && !useRelayer && (
                        <button
                            type="button"
                            onClick={handleUseConnectedWallet}
                            className="text-[10px] text-[#94A3B8] hover:text-white font-mono uppercase flex items-center gap-1 border border-[#222E3E] px-2.5 py-1 rounded-lg hover:bg-[#141C26] transition-colors cursor-pointer"
                        >
                            <Wallet className="w-3 h-3" />
                            <span>USE CONNECTED</span>
                        </button>
                    )}
                </div>
                <div className="relative">
                    <input
                        type="text"
                        value={recipientAddress}
                        onChange={(e) => {
                            setRecipientAddress(e.target.value);
                            setZkProof(null);
                        }}
                        placeholder="0Q... OR UQ... (UNLINKED DESTINATION)"
                        className="w-full bg-[#0B0E14] border border-[#222E3E] focus:border-[#30A1F5] rounded-xl p-3.5 sm:p-4 text-[11px] sm:text-xs text-white font-mono uppercase focus:outline-none transition-all duration-200 placeholder:text-[#64748B] shadow-inner pr-20"
                    />
                    {recipientAddress ? (
                        <button
                            type="button"
                            onClick={() => {
                                setRecipientAddress('');
                                setZkProof(null);
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] sm:text-[10px] text-[#94A3B8] hover:text-white font-mono px-2 py-1 rounded-lg bg-[#141C26] border border-[#222E3E] cursor-pointer"
                        >
                            CLEAR
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={async () => {
                                try {
                                    const text = await navigator.clipboard.readText();
                                    if (text) {
                                        setRecipientAddress(text.trim());
                                        setZkProof(null);
                                    }
                                } catch (_) {}
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] sm:text-[10px] text-[#30A1F5] hover:text-white font-mono px-2.5 py-1 rounded-lg bg-[#141C26] border border-[#222E3E] hover:border-[#30A1F5]/40 cursor-pointer"
                        >
                            PASTE
                        </button>
                    )}
                </div>
                <p className="text-[10px] text-[#94A3B8] mt-2 font-mono uppercase">
                    {useRelayer
                        ? '> GASLESS RELAY: DESTINATION CAN BE A FRESH 0-BALANCE ADDRESS.'
                        : '> CONNECTED SENDER: MUST HOLD ~0.04 TON FOR MESSAGE GAS.'}
                </p>
            </div>

            {/* Step 3: Generate ZK-SNARK Proof with Smooth Transitions & Edged Corners */}
            <div className="space-y-4">
                {!zkProof ? (
                    <button
                        type="button"
                        disabled={!merkleProof || isSpent === true || !recipientAddress.trim() || isProving}
                        onClick={handleGenerateProof}
                        className={`w-full py-4 rounded-xl font-mono font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all duration-200 cursor-pointer shadow-lg active:scale-[0.98] ${
                            !merkleProof || isSpent === true || !recipientAddress.trim() || isProving
                                ? 'bg-[#141C26] text-[#64748B] border border-[#222E3E] cursor-not-allowed opacity-60'
                                : 'bg-[#30A1F5] text-black hover:bg-[#208BDC] border border-[#30A1F5] shadow-[#30A1F5]/25 font-bold'
                        }`}
                    >
                        {isProving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>SYNTHESIZING GROTH16 PROOF...</span>
                            </>
                        ) : (
                            <>
                                <Cpu className="w-4 h-4" />
                                <span>GENERATE ZK-PROOF</span>
                            </>
                        )}
                    </button>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-[#141C26] rounded-xl border border-[#222E3E] p-5 space-y-4 shadow-lg"
                    >
                        <div className="flex items-center justify-between text-[10px] sm:text-xs font-mono uppercase border-b border-[#222E3E] pb-3">
                            <span className="font-bold text-white flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                <span>ZK-PROOF READY</span>
                            </span>
                            <span className="text-[#94A3B8]">SYNTHESIS: {zkProof.proofTimeMs}MS</span>
                        </div>

                        <div className="p-3.5 bg-[#0B0E14] rounded-lg border border-[#222E3E] text-[9px] font-mono uppercase text-[#94A3B8] space-y-1.5 break-all shadow-inner">
                            <div><span className="text-white">MERKLE ROOT:</span> {zkProof.root.toString().slice(0, 32)}...</div>
                            <div><span className="text-white">NULLIFIER:</span> {zkProof.nullifierHash.toString().slice(0, 32)}...</div>
                            <div><span className="text-white">PAYOUT DEST:</span> {zkProof.recipient.toString({ testOnly: true, bounceable: false }).slice(0, 24)}...</div>
                        </div>

                        <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={handleWithdraw}
                            className={`w-full py-4 rounded-xl border font-mono font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all duration-200 cursor-pointer shadow-lg active:scale-[0.98] ${
                                useRelayer
                                    ? 'bg-[#30A1F5] text-black border-[#30A1F5] hover:bg-[#208BDC]'
                                    : 'bg-white text-black border-white hover:bg-slate-200'
                            }`}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>{useRelayer ? 'RELAYING TO POOL...' : 'BROADCASTING...'}</span>
                                </>
                            ) : useRelayer ? (
                                <>
                                    <RelayerFuelIcon className="w-4 h-4" />
                                    <span>EXECUTE PAYOUT [{parsedNote ? getFormattedPayoutAmount(parsedNote.amount) : '1 TON'}]</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            ) : (
                                <>
                                    <TonIcon className="w-4 h-4" />
                                    <span>EXECUTE PAYOUT [{parsedNote ? getFormattedPayoutAmount(parsedNote.amount) : '1 TON'}]</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </motion.div>
                )}

                {/* Live Prover Progress Message with Edged Corners */}
                {isProving && provingProgress && (
                    <div className="p-4 rounded-xl bg-[#141C26] border border-[#222E3E] text-[10px] text-white font-mono uppercase flex items-center gap-3">
                        <Loader2 className="w-4 h-4 animate-spin shrink-0 text-[#30A1F5]" />
                        <span>{provingProgress}</span>
                    </div>
                )}
            </div>

            {/* Error Message Display with Edged Corners */}
            {errorMessage && (
                <div className="mt-4 p-4 rounded-xl bg-[#141C26] border border-red-500/30 text-[10px] sm:text-xs font-mono uppercase text-white">
                    {errorMessage}
                </div>
            )}

            {/* Success Banner with Edged Corners */}
            {txSuccess && (
                <div className="mt-4 p-5 rounded-xl bg-[#141C26] border border-emerald-500/30 space-y-3 font-mono text-[10px] sm:text-xs uppercase">
                    <div className="flex items-center gap-2 font-bold text-white border-b border-[#222E3E] pb-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>PAYOUT DISPATCHED SUCCESSFULLY</span>
                    </div>
                    <p className="text-[#94A3B8] leading-relaxed">
                        {useRelayer
                            ? '> RELAYER NETWORK HAS BROADCASTED THE TRANSACTION. TARGET WILL RECEIVE FULL PAYOUT.'
                            : '> TRANSACTION DISPATCHED LOCALLY.'}
                    </p>
                    <div className="text-white break-all bg-[#0B0E14] p-3 rounded-lg border border-[#222E3E] shadow-inner">
                        TX: {txSuccess}
                    </div>
                </div>
            )}

            {/* Mobile Summary BottomSheet */}
            {zkProof && (
                <BottomSheet
                    open={isSummaryDrawerOpen}
                    onOpenChange={setIsSummaryDrawerOpen}
                    title={
                        <div className="flex items-center gap-2 font-mono uppercase text-white text-sm tracking-wider">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>VERIFIED ZK PAYOUT</span>
                        </div>
                    }
                    description="ZK PROOF SYNTHESIZED. READY TO EXECUTE."
                >
                    <div className="space-y-4 pt-2 font-mono text-[10px] sm:text-xs uppercase">
                        <div className="p-4 rounded-xl bg-[#141C26] border border-[#222E3E] space-y-3">
                            <div className="flex justify-between border-b border-[#222E3E] pb-2">
                                <span className="text-[#94A3B8]">DENOMINATION:</span>
                                <span className="text-white font-bold">{parsedNote ? getFormattedPayoutAmount(parsedNote.amount) : '1.0 TON'}</span>
                            </div>
                            <div className="flex justify-between border-b border-[#222E3E] pb-2">
                                <span className="text-[#94A3B8]">TARGET:</span>
                                <span className="text-white">
                                    {zkProof.recipient.toString({ testOnly: true, bounceable: false }).slice(0, 14)}...
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[#94A3B8]">MODE:</span>
                                <span className={useRelayer ? 'text-[#30A1F5] font-bold' : 'text-[#94A3B8]'}>
                                    {useRelayer ? 'GASLESS RELAYER' : 'LOCAL BROADCAST'}
                                </span>
                            </div>
                        </div>

                        <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={handleWithdraw}
                            className="w-full py-4 rounded-xl bg-[#30A1F5] hover:bg-[#208BDC] text-black font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer"
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
