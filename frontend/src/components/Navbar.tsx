'use client';

import React from 'react';
import { TonConnectButton, useTonAddress } from '@tonconnect/ui-react';
import { Crown } from 'lucide-react';
import { isAuthorizedAdmin } from '../lib/admin';
import { TonLogoFull } from './TonIcons';

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

                {/* Right controls: Admin tab, TonConnect */}
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

                    {/* Official TonConnect Wallet Button */}
                    <div className="tonconnect-wrapper-minimalist">
                        <TonConnectButton />
                    </div>
                </div>
            </div>
        </header>
    );
}
