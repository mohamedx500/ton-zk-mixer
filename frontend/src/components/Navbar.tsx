'use client';

import React from 'react';
import { TonConnectButton } from '@tonconnect/ui-react';
import { ShieldCheck, ExternalLink, Activity } from 'lucide-react';
import { MIXER_ADDRESS_STRING, TESTNET_EXPLORER_URL } from '../lib/contracts';

export function Navbar() {
    return (
        <header className="sticky top-0 z-50 w-full bg-glass border-b border-white/10 px-4 lg:px-8 py-3.5 transition-all">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                {/* Logo & Brand */}
                <div className="flex items-center space-x-3">
                    <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-emerald-500 to-teal-400 p-[1px] shadow-lg shadow-cyan-500/20">
                        <div className="w-full h-full bg-[#0a0f1d] rounded-xl flex items-center justify-center">
                            <ShieldCheck className="w-5 h-5 text-cyan-400" />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center space-x-2">
                            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-gray-100 to-gray-400 bg-clip-text text-transparent">
                                TON ZK-MIXER
                            </span>
                            <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                Groth16
                            </span>
                        </div>
                        <p className="text-xs text-gray-400 hidden sm:block">
                            Non-Custodial Privacy Protocol on TON
                        </p>
                    </div>
                </div>

                {/* Right controls: Network badge, Contract link, TonConnect */}
                <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-glass-inner text-xs text-gray-300">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span className="font-medium text-gray-300">TON Testnet</span>
                    </div>

                    <a
                        href={TESTNET_EXPLORER_URL(MIXER_ADDRESS_STRING)}
                        target="_blank"
                        rel="noreferrer"
                        className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-300 border border-white/10 transition-colors"
                        title="View contract on TonScan"
                    >
                        <Activity className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Contract</span>
                        <ExternalLink className="w-3 h-3 text-gray-400" />
                    </a>

                    {/* Official TonConnect Wallet Button */}
                    <div className="tonconnect-wrapper">
                        <TonConnectButton />
                    </div>
                </div>
            </div>
        </header>
    );
}
