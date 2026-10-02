'use client';

import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Lock, EyeOff, ShieldCheck, Zap } from 'lucide-react';

export function PrivacyExplainer() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="bg-glass rounded-2xl border border-white/5 overflow-hidden transition-all">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-4.5 sm:p-5 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors cursor-pointer"
            >
                <div className="flex items-center gap-2.5">
                    <HelpCircle className="w-5 h-5 text-cyan-400" />
                    <div>
                        <h4 className="text-sm font-bold text-white">How Zero-Knowledge Privacy Works on TON</h4>
                        <p className="text-xs text-gray-400">Cryptographic privacy guarantees powered by Groth16 zk-SNARKs</p>
                    </div>
                </div>
                {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
            </button>

            {isOpen && (
                <div className="p-5 pt-0 border-t border-white/5 grid sm:grid-cols-2 gap-4 text-xs text-gray-300 leading-relaxed">
                    <div className="bg-glass-inner p-4 rounded-xl border border-white/5 space-y-1.5">
                        <div className="flex items-center gap-2 font-bold text-cyan-300">
                            <Lock className="w-4 h-4 text-cyan-400" />
                            <span>1. The Cryptographic Note</span>
                        </div>
                        <p className="text-gray-400">
                            When depositing, your browser generates a random <code className="text-cyan-200">secret</code> and <code className="text-cyan-200">nullifier</code>, computing commitment <code className="text-cyan-200">C = MiMC(nullifier, secret)</code>. The commitment is added to the contract&apos;s on-chain Merkle tree.
                        </p>
                    </div>

                    <div className="bg-glass-inner p-4 rounded-xl border border-white/5 space-y-1.5">
                        <div className="flex items-center gap-2 font-bold text-emerald-300">
                            <EyeOff className="w-4 h-4 text-emerald-400" />
                            <span>2. Zero-Knowledge Proof</span>
                        </div>
                        <p className="text-gray-400">
                            When withdrawing, a Groth16 BLS12-381 proof is computed locally in your browser. It proves you know a secret note in the Merkle tree <span className="font-semibold text-white">without revealing which note it is or who deposited it</span>.
                        </p>
                    </div>

                    <div className="bg-glass-inner p-4 rounded-xl border border-white/5 space-y-1.5">
                        <div className="flex items-center gap-2 font-bold text-teal-300">
                            <ShieldCheck className="w-4 h-4 text-teal-400" />
                            <span>3. Double-Spend Protection</span>
                        </div>
                        <p className="text-gray-400">
                            The withdrawal submits a public <code className="text-teal-200">NullifierHash = MiMC(nullifier, 0)</code>. The smart contract permanently registers this hash, preventing anyone from redeeming the same note twice.
                        </p>
                    </div>

                    <div className="bg-glass-inner p-4 rounded-xl border border-white/5 space-y-1.5">
                        <div className="flex items-center gap-2 font-bold text-violet-300">
                            <Zap className="w-4 h-4 text-violet-400" />
                            <span>4. Front-Running Immunity</span>
                        </div>
                        <p className="text-gray-400">
                            Your clean recipient address is cryptographically bound as a public input in the circuit. Relayers or miners cannot alter the payout recipient without making the proof invalid.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
