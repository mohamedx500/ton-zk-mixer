'use client';

import React from 'react';
import { TonConnectButton, useTonAddress } from '@tonconnect/ui-react';
import { ShieldCheck, ExternalLink, Activity, Crown, Terminal } from 'lucide-react';
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
        <header className="sticky top-0 z-40 w-full bg-brand-black border-b border-brand-border px-4 lg:px-8 py-3 transition-colors">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                {/* Logo & Brand */}
                <div
                    className="flex items-center space-x-3 cursor-pointer select-none group"
                    onClick={() => onSelectTab?.('deposit')}
                >
                    <div className="flex items-center justify-center w-8 h-8 border border-brand-border bg-brand-gray group-hover:border-brand-silver transition-colors">
                        <Terminal className="w-4 h-4 text-brand-white" />
                    </div>
                    <div>
                        <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-sm sm:text-base tracking-widest text-brand-white uppercase">
                                TON ZK-PROTOCOL
                            </span>
                            <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold tracking-widest uppercase border border-brand-border text-brand-silver bg-brand-offblack">
                                ENTERPRISE
                            </span>
                        </div>
                        <p className="text-[9px] font-mono tracking-widest text-brand-silver hidden sm:block uppercase mt-0.5">
                            ZERO-KNOWLEDGE PRIVACY INFRASTRUCTURE
                        </p>
                    </div>
                </div>

                {/* Center / Navigation items if Admin */}
                {isAdmin && (
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => onSelectTab?.('admin')}
                            className={`flex items-center gap-2 px-3 py-1.5 font-mono font-bold text-[10px] tracking-widest uppercase transition-colors cursor-pointer border ${
                                activeTab === 'admin'
                                    ? 'bg-brand-white text-black border-brand-white'
                                    : 'bg-brand-gray text-brand-silver border-brand-border hover:border-brand-silver hover:text-brand-white'
                            }`}
                        >
                            <Crown className={`w-3.5 h-3.5 ${activeTab === 'admin' ? 'text-black' : 'text-brand-silver'}`} />
                            <span>SYS_ADMIN</span>
                            {activeTab !== 'admin' && (
                                <span className="relative flex h-1.5 w-1.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full bg-brand-silver opacity-75" />
                                    <span className="relative inline-flex h-1.5 w-1.5 bg-brand-white" />
                                </span>
                            )}
                        </button>
                    </div>
                )}

                {/* Right controls: Network badge, Contract link, TonConnect */}
                <div className="flex items-center space-x-3">
                    <div className="hidden md:flex items-center space-x-2 px-2 py-1.5 border border-brand-border bg-brand-offblack text-[9px] font-mono font-bold tracking-widest uppercase text-brand-silver">
                        <span
                            className={`w-1.5 h-1.5 ${
                                IS_MAINNET ? 'bg-brand-white' : 'bg-brand-silver'
                            }`}
                        />
                        <span>
                            {IS_MAINNET ? 'MAINNET' : 'TESTNET'}
                        </span>
                    </div>

                    {MIXER_ADDRESS_STRING && (
                        <a
                            href={EXPLORER_URL(MIXER_ADDRESS_STRING)}
                            target="_blank"
                            rel="noreferrer"
                            className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 border border-brand-border bg-brand-gray hover:border-brand-silver text-[9px] font-mono font-bold tracking-widest uppercase text-brand-silver hover:text-brand-white transition-colors"
                            title="View contract on TonScan"
                        >
                            <Activity className="w-3 h-3" />
                            <span>EXPLORER</span>
                            <ExternalLink className="w-3 h-3" />
                        </a>
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
