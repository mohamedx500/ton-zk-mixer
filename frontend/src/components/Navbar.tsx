'use client';

import React from 'react';
import { TonConnectButton, useTonAddress } from '@tonconnect/ui-react';
import { ExternalLink, Crown, MapPin, Globe } from 'lucide-react';
import { MIXER_ADDRESS_STRING, EXPLORER_URL, IS_MAINNET } from '../lib/contracts';
import { isAuthorizedAdmin } from '../lib/admin';
import { TonLogoFull, TonIcon, GramDiamondMark, GramCircularBadge } from './TonIcons';

interface NavbarProps {
    activeTab?: 'deposit' | 'withdraw' | 'admin' | 'map';
    onSelectTab?: (tab: 'deposit' | 'withdraw' | 'admin' | 'map') => void;
}

export function Navbar({ activeTab, onSelectTab }: NavbarProps) {
    const connectedAddress = useTonAddress();
    const isAdmin = isAuthorizedAdmin(connectedAddress);

    return (
        <header className="sticky top-0 z-40 w-full bg-[#080B10]/85 backdrop-blur-md border-b border-white/10 px-4 lg:px-8 py-3.5 transition-colors">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                {/* Official TON Logo from ton-assets */}
                <div
                    className="flex items-center space-x-3 cursor-pointer select-none group"
                    onClick={() => onSelectTab?.('deposit')}
                >
                    <div className="flex items-center gap-2.5">
                        <TonLogoFull className="h-6 sm:h-7 w-auto text-white group-hover:text-[#30A1F5] transition-colors" />
                        <span className="hidden sm:inline-block px-2.5 py-0.5 text-[9px] font-mono font-bold tracking-widest uppercase rounded-full border border-[#30A1F5]/40 text-[#30A1F5] bg-[#30A1F5]/10 shadow-sm">
                            ZK-PRIVACY
                        </span>
                    </div>
                </div>

                {/* Primary Navigation - ton.org style */}
                <nav className="hidden md:flex items-center space-x-1 font-mono text-xs text-[#94A3B8]">
                    <button
                        type="button"
                        onClick={() => onSelectTab?.('deposit')}
                        className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                            activeTab === 'deposit' ? 'text-white bg-white/10 font-bold' : 'hover:text-white hover:bg-white/5'
                        }`}
                    >
                        Deposit
                    </button>
                    <button
                        type="button"
                        onClick={() => onSelectTab?.('withdraw')}
                        className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                            activeTab === 'withdraw' ? 'text-white bg-white/10 font-bold' : 'hover:text-white hover:bg-white/5'
                        }`}
                    >
                        Withdraw
                    </button>
                    <button
                        type="button"
                        onClick={() => onSelectTab?.('map')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                            activeTab === 'map' ? 'text-[#30A1F5] bg-[#30A1F5]/15 font-bold' : 'hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <Globe className="w-3.5 h-3.5 text-[#30A1F5]" />
                        <span>Live Map</span>
                    </button>
                    <a
                        href="https://ton.org"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg hover:text-white hover:bg-white/5 transition-colors"
                    >
                        <span>TON.org</span>
                        <ExternalLink className="w-3 h-3 opacity-60" />
                    </a>
                </nav>

                {/* Right controls: Admin tab, Network badge, TonConnect */}
                <div className="flex items-center space-x-3">
                    {/* Admin Mode Shortcut if Admin */}
                    {isAdmin && (
                        <button
                            type="button"
                            onClick={() => onSelectTab?.('admin')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono font-bold text-[10px] tracking-wider uppercase transition-all duration-200 cursor-pointer border shadow-sm ${
                                activeTab === 'admin'
                                    ? 'bg-white text-black border-white'
                                    : 'bg-[#141C26] text-[#94A3B8] border-white/10 hover:border-white/30 hover:text-white'
                            }`}
                        >
                            <Crown className={`w-3.5 h-3.5 ${activeTab === 'admin' ? 'text-black' : 'text-[#94A3B8]'}`} />
                            <span className="hidden sm:inline">SYS_ADMIN</span>
                            {activeTab !== 'admin' && (
                                <span className="relative flex h-1.5 w-1.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full bg-emerald-400 opacity-75" />
                                    <span className="relative inline-flex h-1.5 w-1.5 bg-emerald-500 rounded-full" />
                                </span>
                            )}
                        </button>
                    )}

                    {/* Network Badge */}
                    <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-full border border-white/10 bg-[#121822] text-[9px] font-mono font-bold tracking-wider uppercase text-[#94A3B8] shadow-sm">
                        <span
                            className={`w-1.5 h-1.5 rounded-full ${
                                IS_MAINNET ? 'bg-emerald-400 animate-pulse' : 'bg-[#30A1F5] animate-pulse'
                            }`}
                        />
                        <span>{IS_MAINNET ? 'MAINNET' : 'TESTNET'}</span>
                    </div>

                    {/* Gram Asset Badge */}
                    <div className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-white/10 bg-[#121822] text-[9px] font-mono text-[#94A3B8]">
                        <GramDiamondMark className="w-3.5 h-3.5" />
                        <span>GRAM</span>
                    </div>

                    {/* Official TonConnect Wallet Button */}
                    <div className="tonconnect-wrapper-minimalist">
                        <TonConnectButton />
                    </div>
                </div>
            </div>
        </header>
    );
}
