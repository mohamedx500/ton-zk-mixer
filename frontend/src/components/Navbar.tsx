'use client';

import React from 'react';
import { TonConnectButton, useTonAddress } from '@tonconnect/ui-react';
import { ShieldCheck, ExternalLink, Activity, Crown } from 'lucide-react';
import { MIXER_ADDRESS_STRING, EXPLORER_URL, IS_MAINNET } from '../lib/contracts';
import { isAuthorizedAdmin } from '../lib/admin';
import { TonIcon } from './TonIcons';

interface NavbarProps {
    activeTab?: 'deposit' | 'withdraw' | 'admin';
    onSelectTab?: (tab: 'deposit' | 'withdraw' | 'admin') => void;
}

export function Navbar({ activeTab, onSelectTab }: NavbarProps) {
    const connectedAddress = useTonAddress();
    const isAdmin = isAuthorizedAdmin(connectedAddress);

    return (
        <header className="sticky top-0 z-40 w-full bg-[#07090e]/80 backdrop-blur-xl border-b border-white/10 px-4 lg:px-8 py-3.5 transition-all">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                {/* Logo & Brand */}
                <div
                    className="flex items-center space-x-3 cursor-pointer select-none group"
                    onClick={() => onSelectTab?.('deposit')}
                >
                    <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-500 to-teal-400 p-[1.5px] shadow-lg shadow-cyan-500/25 group-hover:shadow-cyan-500/40 transition-shadow">
                        <div className="w-full h-full bg-[#070b14] rounded-2xl flex items-center justify-center">
                            <TonIcon className="w-6 h-6" />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center space-x-2">
                            <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                                TON ZK-MIXER
                            </span>
                            <span className="px-2 py-0.5 text-[9px] sm:text-[10px] font-extrabold tracking-wider uppercase rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                                PRO MAX
                            </span>
                        </div>
                        <p className="text-[11px] text-gray-400 hidden sm:block">
                            Non-Custodial Groth16 Privacy Protocol
                        </p>
                    </div>
                </div>

                {/* Center / Navigation items if Admin */}
                {isAdmin && (
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => onSelectTab?.('admin')}
                            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer border ${
                                activeTab === 'admin'
                                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black border-amber-400 shadow-lg shadow-amber-500/30 ring-2 ring-amber-400/20'
                                    : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20 hover:text-white'
                            }`}
                        >
                            <Crown className="w-3.5 h-3.5 text-amber-400" />
                            <span>Admin Panel</span>
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                            </span>
                        </button>
                    </div>
                )}

                {/* Right controls: Network badge, Contract link, TonConnect */}
                <div className="flex items-center space-x-2.5 sm:space-x-3.5">
                    <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-xs text-gray-300">
                        <span
                            className={`w-2 h-2 rounded-full animate-pulse ${
                                IS_MAINNET ? 'bg-cyan-400 shadow-sm shadow-cyan-400' : 'bg-emerald-400 shadow-sm shadow-emerald-400'
                            }`}
                        />
                        <span className="font-semibold text-gray-200">
                            {IS_MAINNET ? 'TON Mainnet' : 'TON Testnet'}
                        </span>
                    </div>

                    {MIXER_ADDRESS_STRING && (
                        <a
                            href={EXPLORER_URL(MIXER_ADDRESS_STRING)}
                            target="_blank"
                            rel="noreferrer"
                            className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-gray-300 border border-white/10 transition-colors"
                            title="View contract on TonScan"
                        >
                            <Activity className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Contract</span>
                            <ExternalLink className="w-3 h-3 text-gray-400" />
                        </a>
                    )}

                    {/* Official TonConnect Wallet Button */}
                    <div className="tonconnect-wrapper">
                        <TonConnectButton />
                    </div>
                </div>
            </div>
        </header>
    );
}
