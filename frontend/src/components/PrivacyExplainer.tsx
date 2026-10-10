'use client';

import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Lock, EyeOff, ShieldCheck, Zap } from 'lucide-react';

export function PrivacyExplainer() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="bg-minimal-card border border-brand-border transition-colors">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-brand-gray transition-colors cursor-pointer"
            >
                <div className="flex items-center gap-3">
                    <HelpCircle className="w-5 h-5 text-brand-silver grayscale opacity-80" />
                    <div>
                        <h4 className="text-xs font-bold text-brand-white uppercase tracking-widest font-mono">System Protocol Architecture</h4>
                        <p className="text-[10px] text-brand-silver font-mono uppercase mt-0.5">Cryptographic guarantees via Groth16 zk-SNARKs</p>
                    </div>
                </div>
                {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-brand-silver" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-brand-silver" />
                )}
            </button>

            {isOpen && (
                <div className="p-5 pt-0 border-t border-brand-border grid sm:grid-cols-2 gap-4 text-[10px] font-mono text-brand-silver uppercase">
                    <div className="bg-brand-gray p-4 border border-brand-border space-y-2">
                        <div className="flex items-center gap-2 font-bold text-brand-white pb-2 border-b border-brand-border">
                            <Lock className="w-4 h-4 text-brand-silver" />
                            <span>[1] Cryptographic Note</span>
                        </div>
                        <p className="text-brand-silver leading-relaxed pt-1">
                            Browser generates random <span className="text-brand-white font-bold">secret</span> and <span className="text-brand-white font-bold">nullifier</span>, computing commitment <span className="text-brand-white font-bold bg-brand-black p-0.5 border border-brand-border">C = MiMC(nullifier, secret)</span>. Added to contract Merkle Tree.
                        </p>
                    </div>

                    <div className="bg-brand-gray p-4 border border-brand-border space-y-2">
                        <div className="flex items-center gap-2 font-bold text-brand-white pb-2 border-b border-brand-border">
                            <EyeOff className="w-4 h-4 text-brand-silver" />
                            <span>[2] Zero-Knowledge Proof</span>
                        </div>
                        <p className="text-brand-silver leading-relaxed pt-1">
                            Groth16 BLS12-381 proof computed locally. Proves note ownership in Merkle tree <span className="text-brand-white font-bold underline underline-offset-2">without revealing identity or deposit source</span>.
                        </p>
                    </div>

                    <div className="bg-brand-gray p-4 border border-brand-border space-y-2">
                        <div className="flex items-center gap-2 font-bold text-brand-white pb-2 border-b border-brand-border">
                            <ShieldCheck className="w-4 h-4 text-brand-silver" />
                            <span>[3] Double-Spend Prevention</span>
                        </div>
                        <p className="text-brand-silver leading-relaxed pt-1">
                            Withdrawal submits public <span className="text-brand-white font-bold bg-brand-black p-0.5 border border-brand-border">NullifierHash = MiMC(nullifier, 0)</span>. Contract permanently registers hash, preventing duplicate redemptions.
                        </p>
                    </div>

                    <div className="bg-brand-gray p-4 border border-brand-border space-y-2">
                        <div className="flex items-center gap-2 font-bold text-brand-white pb-2 border-b border-brand-border">
                            <Zap className="w-4 h-4 text-brand-silver" />
                            <span>[4] Front-Running Immunity</span>
                        </div>
                        <p className="text-brand-silver leading-relaxed pt-1">
                            Clean recipient address is cryptographically bound as public input. Relayers/miners cannot alter payout destination without invalidating proof.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
