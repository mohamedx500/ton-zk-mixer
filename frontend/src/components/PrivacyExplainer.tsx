'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { ZkCircuitIcon, MerkleTreeIcon, NullifierIcon, RelayerFuelIcon } from './TonIcons';

export function PrivacyExplainer() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="bg-[#10161F] rounded-2xl border border-[#222E3E] transition-all duration-300 shadow-xl overflow-hidden">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-[#141C26]/60 transition-colors cursor-pointer"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-[#1C2735] border border-[#2B3B4E]">
                        <ZkCircuitIcon className="w-5 h-5 text-[#30A1F5]" />
                    </div>
                    <div>
                        <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider font-sans">
                            Cryptographic Protocol Architecture
                        </h4>
                        <p className="text-[10px] text-[#94A3B8] font-mono mt-0.5">
                            Mathematical anonymity guarantees via Groth16 zk-SNARKs &amp; MiMC hashing
                        </p>
                    </div>
                </div>
                <div className="p-2 rounded-xl border border-[#222E3E] bg-[#0B0E14]">
                    {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-[#94A3B8]" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-[#94A3B8]" />
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
                        <div className="p-5 pt-0 border-t border-[#222E3E] grid sm:grid-cols-2 gap-3.5 text-[10px] font-mono text-[#94A3B8] uppercase">
                            <div className="bg-[#141C26] p-4 rounded-xl border border-[#222E3E] space-y-2">
                                <div className="flex items-center gap-2 font-bold text-white pb-2 border-b border-[#222E3E]">
                                    <NullifierIcon className="w-4 h-4 text-[#30A1F5]" />
                                    <span>[1] Cryptographic Note</span>
                                </div>
                                <p className="text-[#94A3B8] leading-relaxed pt-1 normal-case text-[11px]">
                                    The client generates random secrets <span className="font-mono text-white font-semibold">k</span> and <span className="font-mono text-white font-semibold">r</span>, computing commitment <span className="text-white font-mono bg-[#0B0E14] px-1.5 py-0.5 rounded-md border border-[#222E3E]">C = MiMC(nullifier, secret)</span>. Inserted into contract Merkle tree.
                                </p>
                            </div>

                            <div className="bg-[#141C26] p-4 rounded-xl border border-[#222E3E] space-y-2">
                                <div className="flex items-center gap-2 font-bold text-white pb-2 border-b border-[#222E3E]">
                                    <ZkCircuitIcon className="w-4 h-4 text-[#30A1F5]" />
                                    <span>[2] Zero-Knowledge Proof</span>
                                </div>
                                <p className="text-[#94A3B8] leading-relaxed pt-1 normal-case text-[11px]">
                                    Groth16 BLS12-381 proof generated locally in browser. Proves note presence in the tree <span className="text-white font-semibold underline underline-offset-2">without revealing identity, deposit time, or source</span>.
                                </p>
                            </div>

                            <div className="bg-[#141C26] p-4 rounded-xl border border-[#222E3E] space-y-2">
                                <div className="flex items-center gap-2 font-bold text-white pb-2 border-b border-[#222E3E]">
                                    <MerkleTreeIcon className="w-4 h-4 text-[#30A1F5]" />
                                    <span>[3] Double-Spend Prevention</span>
                                </div>
                                <p className="text-[#94A3B8] leading-relaxed pt-1 normal-case text-[11px]">
                                    Withdrawal submits public <span className="text-white font-mono bg-[#0B0E14] px-1.5 py-0.5 rounded-md border border-[#222E3E]">NullifierHash = MiMC(nullifier, 0)</span>. Contract permanently marks it spent, preventing duplicate claims.
                                </p>
                            </div>

                            <div className="bg-[#141C26] p-4 rounded-xl border border-[#222E3E] space-y-2">
                                <div className="flex items-center gap-2 font-bold text-white pb-2 border-b border-[#222E3E]">
                                    <RelayerFuelIcon className="w-4 h-4 text-emerald-400" />
                                    <span>[4] Gasless Relayer Network</span>
                                </div>
                                <p className="text-[#94A3B8] leading-relaxed pt-1 normal-case text-[11px]">
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
