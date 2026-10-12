'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, ChevronDown, ChevronUp, Lock, EyeOff, ShieldCheck, Zap } from 'lucide-react';
import { ZkCircuitIcon, MerkleTreeIcon, NullifierIcon, RelayerFuelIcon } from './TonIcons';

export function PrivacyExplainer() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="bg-minimal-card rounded-2xl border border-brand-border transition-all duration-300 shadow-xl overflow-hidden">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-brand-gray/60 transition-colors cursor-pointer"
            >
                <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-brand-gray border border-brand-border">
                        <ZkCircuitIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="text-xs sm:text-sm font-bold text-brand-white uppercase tracking-wider font-mono">
                            Cryptographic Protocol Architecture
                        </h4>
                        <p className="text-[10px] text-brand-silver font-mono uppercase mt-0.5">
                            Mathematical anonymity guarantees via Groth16 zk-SNARKs &amp; MiMC hashing
                        </p>
                    </div>
                </div>
                <div className="p-1.5 rounded-lg border border-brand-border bg-brand-offblack">
                    {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-brand-silver" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-brand-silver" />
                    )}
                </div>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                    >
                        <div className="p-5 pt-0 border-t border-brand-border grid sm:grid-cols-2 gap-3.5 text-[10px] font-mono text-brand-silver uppercase">
                            <div className="bg-brand-gray/80 p-4 rounded-xl border border-brand-border space-y-2">
                                <div className="flex items-center gap-2 font-bold text-brand-white pb-2 border-b border-brand-border">
                                    <NullifierIcon className="w-4 h-4" />
                                    <span>[1] Cryptographic Note</span>
                                </div>
                                <p className="text-brand-silver leading-relaxed pt-1 normal-case text-[11px]">
                                    The client generates random secrets <span className="font-mono text-brand-white font-semibold">k</span> and <span className="font-mono text-brand-white font-semibold">r</span>, computing commitment <span className="text-brand-white font-mono bg-brand-black px-1 py-0.5 rounded border border-brand-border">C = MiMC(nullifier, secret)</span>. Inserted into contract Merkle tree.
                                </p>
                            </div>

                            <div className="bg-brand-gray/80 p-4 rounded-xl border border-brand-border space-y-2">
                                <div className="flex items-center gap-2 font-bold text-brand-white pb-2 border-b border-brand-border">
                                    <ZkCircuitIcon className="w-4 h-4" />
                                    <span>[2] Zero-Knowledge Proof</span>
                                </div>
                                <p className="text-brand-silver leading-relaxed pt-1 normal-case text-[11px]">
                                    Groth16 BLS12-381 proof generated locally in browser. Proves note presence in the tree <span className="text-brand-white font-semibold underline underline-offset-2">without revealing identity, deposit time, or source</span>.
                                </p>
                            </div>

                            <div className="bg-brand-gray/80 p-4 rounded-xl border border-brand-border space-y-2">
                                <div className="flex items-center gap-2 font-bold text-brand-white pb-2 border-b border-brand-border">
                                    <MerkleTreeIcon className="w-4 h-4" />
                                    <span>[3] Double-Spend Prevention</span>
                                </div>
                                <p className="text-brand-silver leading-relaxed pt-1 normal-case text-[11px]">
                                    Withdrawal submits public <span className="text-brand-white font-mono bg-brand-black px-1 py-0.5 rounded border border-brand-border">NullifierHash = MiMC(nullifier, 0)</span>. Contract permanently marks it spent, preventing duplicate claims.
                                </p>
                            </div>

                            <div className="bg-brand-gray/80 p-4 rounded-xl border border-brand-border space-y-2">
                                <div className="flex items-center gap-2 font-bold text-brand-white pb-2 border-b border-brand-border">
                                    <RelayerFuelIcon className="w-4 h-4" />
                                    <span>[4] Gasless Relayer Network</span>
                                </div>
                                <p className="text-brand-silver leading-relaxed pt-1 normal-case text-[11px]">
                                    Clean recipient address is cryptographically bound inside the proof. Third-party relayers can broadcast the transaction to a 0-balance fresh wallet safely.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
