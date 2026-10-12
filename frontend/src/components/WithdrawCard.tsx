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
import { TonIcon, TonDiamond, GramIcon, ZkCircuitIcon, MerkleTreeIcon, NullifierIcon, RelayerFuelIcon } from './TonIcons';
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
        <div className="bg-minimal-card p-6 sm:p-8 rounded-2xl border border-brand-border text-brand-white relative shadow-2xl transition-all duration-300">
            {/* Header with Crypto Utility Badges */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8 border-b border-brand-border pb-5">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2.5 uppercase tracking-wide">
                        <div className="p-1.5 rounded-lg bg-brand-gray border border-brand-border">
                            <Lock className="w-5 h-5 text-brand-white" />
                        </div>
                        <span>System Withdrawal</span>
                    </h2>
                    <p className="text-xs text-brand-silver mt-1 font-mono">
                        Redeem cryptographic note to any unlinked destination without trace
                    </p>
                </div>
                
                {/* Crypto Utility Badges */}
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-brand-border bg-brand-gray/80 text-brand-white text-[10px] font-mono tracking-wider shadow-sm">
                        <ZkCircuitIcon className="w-3.5 h-3.5" />
                        <span className="font-bold">GROTH16 ZK</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-brand-border bg-brand-gray/80 text-brand-silver text-[10px] font-mono tracking-wider shadow-sm">
                        <RelayerFuelIcon className="w-3.5 h-3.5" />
                        <span>GASLESS RELAY</span>
                    </div>
                </div>
            </div>

            {/* Gasless Relayer Mode Banner with Edged Corners & Smooth Toggle */}
            <div className="bg-brand-gray/90 rounded-xl border border-brand-border p-4 mb-7 font-mono text-[11px] sm:text-xs shadow-inner">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all duration-200 ${
                                useRelayer
                                    ? 'bg-brand-white text-black border-brand-white shadow-md'
                                    : 'bg-brand-offblack text-brand-silver border-brand-border'
                            }`}
                        >
                            <RelayerFuelIcon className="w-4 h-4" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-brand-white uppercase">Relayer Network Mode</span>
                                {useRelayer && (
                                    <span className="text-[9px] bg-brand-white text-black px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shadow-sm">
                                        ACTIVE
                                    </span>
                                )}
                            </div>
                            <p className="text-[10px] text-brand-silver mt-0.5 uppercase">
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
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border border-brand-border transition-colors duration-250 ease-out focus:outline-none p-0.5 ${
                            useRelayer ? 'bg-brand-silver' : 'bg-brand-black'
                        }`}
                        title="Toggle Relayer"
                    >
                        <span
                            className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-brand-white shadow-md transition-transform duration-250 ease-out ${
                                useRelayer ? 'translate-x-5' : 'translate-x-0'
                            }`}
                        />
                    </button>
                </div>
            </div>

            {/* Step 1: Input Secret Note with Edged Corners */}
            <div className="mb-7">
                <div className="flex items-center justify-between mb-3">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-brand-silver flex items-center gap-2">
                        <NullifierIcon className="w-3.5 h-3.5" />
                        <span>[1] DEPOSIT CREDENTIALS</span>
                    </label>
                    {parsedNote && (
                        <span className="text-[10px] text-brand-white font-mono uppercase tracking-wider border border-brand-border px-2.5 py-1 rounded-full bg-brand-gray/80 flex items-center gap-1">
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
                        className="w-full bg-brand-black border border-brand-border focus:border-brand-silver rounded-xl p-4 text-[11px] sm:text-xs text-brand-white font-mono uppercase focus:outline-none transition-all duration-200 placeholder:text-brand-silver/40 shadow-inner"
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
                    <div className="mt-3 flex items-center justify-between gap-2 p-3 rounded-xl bg-brand-gray/80 border border-brand-border font-mono text-[10px] uppercase">
                        <span className={`font-bold flex items-center gap-1.5 ${treeStatus.startsWith('VERIFIED') ? 'text-brand-white' : 'text-brand-silver'}`}>
                            <MerkleTreeIcon className="w-3.5 h-3.5" />
                            <span>{treeStatus}</span>
                        </span>
                        {noteString.trim() && (
                            <button
                                type="button"
                                onClick={() => handleVerifyNote(noteString)}
                                className="px-3 py-1.5 rounded-lg border border-brand-border hover:border-brand-silver hover:bg-brand-black text-brand-silver hover:text-brand-white transition-all duration-200 flex items-center gap-1.5 cursor-pointer"
                                title="Re-scan on-chain Merkle tree"
                            >
                                <RefreshCw className="w-3 h-3" />
                                <span>RE-SCAN</span>
                            </button>
                        )}
                    </div>
                )}
                {isSpent && (
                    <div className="flex items-center gap-2 mt-3 text-[10px] font-mono uppercase text-red-400 font-bold border border-red-500/30 p-3 rounded-xl bg-brand-gray">
                        <ShieldAlert className="w-4 h-4" />
                        <span>ERR: NULLIFIER ALREADY SPENT ON-CHAIN</span>
                    </div>
                )}
            </div>

            {/* Step 2: Input Clean Recipient Address with Edged Corners */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-brand-silver flex items-center gap-2">
                        <Wallet className="w-3.5 h-3.5" />
                        <span>[2] CLEAN DESTINATION ADDRESS</span>
                    </label>
                    {wallet && !useRelayer && (
                        <button
                            type="button"
                            onClick={handleUseConnectedWallet}
                            className="text-[10px] text-brand-silver hover:text-brand-white font-mono uppercase flex items-center gap-1 border border-brand-border px-2.5 py-1 rounded-lg hover:bg-brand-gray transition-colors cursor-pointer"
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
                    className="w-full bg-brand-black border border-brand-border focus:border-brand-silver rounded-xl p-4 text-[11px] sm:text-xs text-brand-white font-mono uppercase focus:outline-none transition-all duration-200 placeholder:text-brand-silver/40 shadow-inner"
                />
                <p className="text-[10px] text-brand-silver mt-2 font-mono uppercase">
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
                                ? 'bg-brand-offblack text-brand-silver border border-brand-border cursor-not-allowed opacity-70'
                                : 'bg-brand-white text-brand-black hover:bg-brand-silver border border-brand-white'
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
                        className="bg-brand-gray/90 rounded-xl border border-brand-border p-5 space-y-4 shadow-lg"
                    >
                        <div className="flex items-center justify-between text-[10px] sm:text-xs font-mono uppercase border-b border-brand-border pb-3">
                            <span className="font-bold text-brand-white flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                <span>ZK-PROOF READY</span>
                            </span>
                            <span className="text-brand-silver">SYNTHESIS: {zkProof.proofTimeMs}MS</span>
                        </div>

                        <div className="p-3.5 bg-brand-black rounded-lg border border-brand-border text-[9px] font-mono uppercase text-brand-silver space-y-1.5 break-all shadow-inner">
                            <div><span className="text-brand-white">MERKLE ROOT:</span> {zkProof.root.toString().slice(0, 32)}...</div>
                            <div><span className="text-brand-white">NULLIFIER:</span> {zkProof.nullifierHash.toString().slice(0, 32)}...</div>
                            <div><span className="text-brand-white">PAYOUT DEST:</span> {zkProof.recipient.toString({ testOnly: true, bounceable: false }).slice(0, 24)}...</div>
                        </div>

                        <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={handleWithdraw}
                            className={`w-full py-4 rounded-xl border font-mono font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all duration-200 cursor-pointer shadow-lg active:scale-[0.98] ${
                                useRelayer
                                    ? 'bg-brand-white text-black border-brand-white hover:bg-brand-silver'
                                    : 'bg-brand-offblack text-brand-white border-brand-border hover:border-brand-silver'
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
                    <div className="p-4 rounded-xl bg-brand-gray border border-brand-border text-[10px] text-brand-white font-mono uppercase flex items-center gap-3">
                        <Loader2 className="w-4 h-4 animate-spin shrink-0 text-brand-silver" />
                        <span>{provingProgress}</span>
                    </div>
                )}
            </div>

            {/* Error Message Display with Edged Corners */}
            {errorMessage && (
                <div className="mt-4 p-4 rounded-xl bg-brand-gray border border-red-500/30 text-[10px] sm:text-xs font-mono uppercase text-brand-white">
                    {errorMessage}
                </div>
            )}

            {/* Success Banner with Edged Corners */}
            {txSuccess && (
                <div className="mt-4 p-5 rounded-xl bg-brand-gray border border-brand-border space-y-3 font-mono text-[10px] sm:text-xs uppercase">
                    <div className="flex items-center gap-2 font-bold text-brand-white border-b border-brand-border pb-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>PAYOUT DISPATCHED SUCCESSFULLY</span>
                    </div>
                    <p className="text-brand-silver leading-relaxed">
                        {useRelayer
                            ? '> RELAYER NETWORK HAS BROADCASTED THE TRANSACTION. TARGET WILL RECEIVE FULL PAYOUT.'
                            : '> TRANSACTION DISPATCHED LOCALLY.'}
                    </p>
                    <div className="text-brand-white break-all bg-brand-black p-3 rounded-lg border border-brand-border shadow-inner">
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
                        <div className="flex items-center gap-2 font-mono uppercase text-brand-white text-sm tracking-wider">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>VERIFIED ZK PAYOUT</span>
                        </div>
                    }
                    description="ZK PROOF SYNTHESIZED. READY TO EXECUTE."
                >
                    <div className="space-y-4 pt-2 font-mono text-[10px] sm:text-xs uppercase">
                        <div className="p-4 rounded-xl bg-brand-gray border border-brand-border space-y-3">
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
                            className="w-full py-4 rounded-xl bg-brand-white hover:bg-brand-silver text-brand-black font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer"
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
