'use client';

import React from 'react';
import { TonConnectButton, useTonAddress } from '@tonconnect/ui-react';
import { ShieldCheck, ExternalLink, Activity, Crown } from 'lucide-react';
import { MIXER_ADDRESS_STRING, EXPLORER_URL, IS_MAINNET } from '../lib/contracts';
import { isAuthorizedAdmin } from '../lib/admin';

interface NavbarProps {
    activeTab?: 'deposit' | 'withdraw' | 'admin';
    onSelectTab?: (tab: 'deposit' | 'withdraw' | 'admin') => void;
}

export function Navbar({ activeTab, onSelectTab }: NavbarProps) {
    const connectedAddress = useTonAddress();
    const isAdmin = isAuthorizedAdmin(connectedAddress);

    return (
        <header className="sticky top-0 z-50 w-full bg-glass border-b border-white/10 px-4 lg:px-8 py-3.5 transition-all">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                {/* Logo & Brand */}
                <div
                    className="flex items-center space-x-3 cursor-pointer"
                    onClick={() => onSelectTab?.('deposit')}
                >
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

                {/* Center / Navigation items if Admin */}
                {isAdmin && (
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => onSelectTab?.('admin')}
                            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer border ${
                                activeTab === 'admin'
                                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black border-amber-400 shadow-lg shadow-amber-500/25 ring-2 ring-amber-400/20'
                                    : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20 hover:text-white'
                            }`}
                        >
                            <Crown className="w-3.5 h-3.5 text-amber-400" />
                            <span>Admin Panel</span>
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                            </span>
                        </button>
                    </div>
                )}

                {/* Right controls: Network badge, Contract link, TonConnect */}
                <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-glass-inner text-xs text-gray-300">
                        <span
                            className={`w-2 h-2 rounded-full animate-pulse ${
                                IS_MAINNET ? 'bg-cyan-400' : 'bg-emerald-400'
                            }`}
                        ></span>
                        <span className="font-medium text-gray-300">
                            {IS_MAINNET ? 'TON Mainnet' : 'TON Testnet'}
                        </span>
                    </div>

                    {MIXER_ADDRESS_STRING && (
                        <a
                            href={EXPLORER_URL(MIXER_ADDRESS_STRING)}
                            target="_blank"
                            rel="noreferrer"
                            className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-300 border border-white/10 transition-colors"
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
