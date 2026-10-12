'use client';

import React, { useState } from 'react';
import { useTonAddress } from '@tonconnect/ui-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from '../components/Navbar';
import { DepositCard } from '../components/DepositCard';
import { WithdrawCard } from '../components/WithdrawCard';
import { NetworkGlobe } from '../components/NetworkGlobe';
import { AdminDashboard } from '../components/AdminDashboard';
import { StatsCard } from '../components/StatsCard';
import { PrivacyExplainer } from '../components/PrivacyExplainer';
import { Shield, Lock, Crown, Globe, ExternalLink, ArrowRight } from 'lucide-react';
import { isAuthorizedAdmin } from '../lib/admin';
import { TonIcon, TonLogoFull, GramDiamondMark, GramFullLogo, GramCircularBadge } from '../components/TonIcons';

export default function Home() {
    const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw' | 'map' | 'admin'>('deposit');
    const [refreshKey, setRefreshKey] = useState(0);

    const connectedAddress = useTonAddress();
    const isAdmin = isAuthorizedAdmin(connectedAddress);

    const triggerRefresh = () => {
        setRefreshKey((prev) => prev + 1);
    };

    return (
        <div className="min-h-screen flex flex-col bg-[#080B10] text-white selection:bg-[#30A1F5] selection:text-black relative overflow-x-hidden font-sans">
            {/* Ambient Background Radial Hero Glow (ton.org signature lighting) */}
            <div className="absolute top-0 left-0 right-0 h-[660px] pointer-events-none overflow-hidden z-0" aria-hidden="true">
                <svg
                    className="w-full h-full opacity-25"
                    preserveAspectRatio="none"
                    viewBox="0 0 1440 660"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <defs>
                        <radialGradient id="hero-glow-0" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="matrix(-16 319 -526 -26 840 0)">
                            <stop stopColor="#378EE5" />
                            <stop offset="1" stopColor="#378EE5" stopOpacity="0" />
                        </radialGradient>
                        <radialGradient id="hero-glow-1" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="matrix(-286 330 -720 -624 1428 0)">
                            <stop stopColor="#378EE5" />
                            <stop offset="1" stopColor="#378EE5" stopOpacity="0" />
                        </radialGradient>
                        <radialGradient id="hero-glow-2" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="matrix(218 0 0 314 -67 330)">
                            <stop stopColor="#378EE5" />
                            <stop offset="1" stopColor="#378EE5" stopOpacity="0" />
                        </radialGradient>
                    </defs>
                    <path d="M0 0H1440V660H0z" fill="url(#hero-glow-0)" />
                    <path d="M0 0H1440V660H0z" fill="url(#hero-glow-1)" />
                    <path d="M0 0H1440V660H0z" fill="url(#hero-glow-2)" />
                </svg>
            </div>

            {/* Top Navigation */}
            <Navbar activeTab={activeTab} onSelectTab={setActiveTab} />

            {/* Main Content Area */}
            <main className={`flex-1 ${activeTab === 'map' ? 'max-w-5xl' : 'max-w-4xl'} w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8 relative z-10 transition-all duration-300`}>
                {/* Hero / Header Section styled in ton.org aesthetic */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="text-center space-y-4"
                >
                    {/* The Open Network Official Pill Badge */}
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#121822] border border-[#222E3E] text-white text-[11px] font-mono tracking-wider shadow-sm">
                        <TonIcon className="w-3.5 h-3.5" />
                        <span className="font-bold">The Open Network</span>
                        <span className="text-white/20">•</span>
                        <GramDiamondMark className="w-3.5 h-3.5" />
                        <span className="text-[#30A1F5]">ZK Privacy Protocol</span>
                    </div>

                    <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight max-w-2xl mx-auto">
                        {activeTab === 'admin' ? (
                            'System Administration'
                        ) : activeTab === 'map' ? (
                            'Global Transactions & Relayer Network'
                        ) : (
                            <>
                                Decentralized L1 Privacy{' '}
                                <span className="bg-gradient-to-r from-[#30A1F5] to-[#7DD3FC] bg-clip-text text-transparent">
                                    developed for TON
                                </span>
                            </>
                        )}
                    </h1>

                    <p className="max-w-xl mx-auto text-xs sm:text-sm text-[#94A3B8] leading-relaxed font-sans">
                        {activeTab === 'admin'
                            ? 'Telemetry telemetry hub & treasury governance. Authorized deployer key access only.'
                            : activeTab === 'map'
                            ? 'Real-time global transaction visualization showing zero-knowledge mixing hops and relayer node telemetry.'
                            : 'Sever all past on-chain links using Groth16 zk-SNARKs and MiMC hashing. 100% non-custodial and untraceable.'}
                    </p>

                </motion.div>

                {/* Tab Switcher in ton.org Style */}
                <div className="flex justify-center">
                    <div className="bg-[#121822] p-1.5 border border-[#222E3E] flex items-center gap-1.5 rounded-2xl shadow-xl backdrop-blur-md">
                        <button
                            type="button"
                            onClick={() => setActiveTab('deposit')}
                            className={`flex items-center gap-2 px-5 py-2.5 font-mono text-xs transition-all duration-200 uppercase tracking-wider rounded-xl cursor-pointer active:scale-95 ${
                                activeTab === 'deposit'
                                    ? 'bg-[#30A1F5] text-black font-bold shadow-lg shadow-[#30A1F5]/20'
                                    : 'text-[#94A3B8] hover:text-white hover:bg-white/5 bg-transparent'
                            }`}
                        >
                            <Shield className="w-3.5 h-3.5" />
                            <span>Deposit</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('withdraw')}
                            className={`flex items-center gap-2 px-5 py-2.5 font-mono text-xs transition-all duration-200 uppercase tracking-wider rounded-xl cursor-pointer active:scale-95 ${
                                activeTab === 'withdraw'
                                    ? 'bg-[#30A1F5] text-black font-bold shadow-lg shadow-[#30A1F5]/20'
                                    : 'text-[#94A3B8] hover:text-white hover:bg-white/5 bg-transparent'
                            }`}
                        >
                            <Lock className="w-3.5 h-3.5" />
                            <span>Withdraw</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('map')}
                            className={`flex items-center gap-2 px-5 py-2.5 font-mono text-xs transition-all duration-200 uppercase tracking-wider rounded-xl cursor-pointer active:scale-95 ${
                                activeTab === 'map'
                                    ? 'bg-[#30A1F5] text-black font-bold shadow-lg shadow-[#30A1F5]/20'
                                    : 'text-[#94A3B8] hover:text-white hover:bg-white/5 bg-transparent'
                            }`}
                        >
                            <Globe className="w-3.5 h-3.5" />
                            <span>Network Map</span>
                        </button>

                        {/* Admin Panel Tab in Switcher if Admin */}
                        {isAdmin && (
                            <button
                                type="button"
                                onClick={() => setActiveTab('admin')}
                                className={`flex items-center gap-2 px-5 py-2.5 font-mono text-xs transition-all duration-200 uppercase tracking-wider rounded-xl cursor-pointer active:scale-95 ${
                                    activeTab === 'admin'
                                        ? 'bg-white text-black font-bold shadow-md'
                                        : 'text-[#94A3B8] hover:text-white hover:bg-white/5 bg-transparent'
                                }`}
                            >
                                <Crown className="w-3.5 h-3.5" />
                                <span>Admin</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Interactive Card Section with Animated Transitions */}
                <div className="relative min-h-[400px]">
                    <AnimatePresence mode="wait">
                        {activeTab === 'deposit' && (
                            <motion.div
                                key="deposit-tab"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.25, ease: 'easeOut' }}
                            >
                                <DepositCard onDepositSuccess={triggerRefresh} />
                            </motion.div>
                        )}

                        {activeTab === 'withdraw' && (
                            <motion.div
                                key="withdraw-tab"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.25, ease: 'easeOut' }}
                            >
                                <WithdrawCard onWithdrawSuccess={triggerRefresh} />
                            </motion.div>
                        )}

                        {activeTab === 'map' && (
                            <motion.div
                                key="map-tab"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.25, ease: 'easeOut' }}
                            >
                                <NetworkGlobe />
                            </motion.div>
                        )}

                        {activeTab === 'admin' && (
                            <motion.div
                                key="admin-tab"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.25, ease: 'easeOut' }}
                            >
                                <AdminDashboard />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>


                {/* Real-time Pool Stats Card (displayed on deposit & withdraw tabs) */}
                {activeTab !== 'admin' && (
                    <motion.div
                        key={refreshKey}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        <StatsCard />
                    </motion.div>
                )}

                {/* Educational Privacy Explainer */}
                {activeTab !== 'admin' && <PrivacyExplainer />}
            </main>

            {/* ton.org Inspired Footer with Official Assets from ton-assets */}
            <footer className="border-t border-[#222E3E] py-10 px-4 text-center font-mono text-[11px] text-[#94A3B8] bg-[#080B10]">
                <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-[#222E3E]/60 mb-6">
                    <div className="flex items-center gap-3">
                        <TonLogoFull className="h-6 w-auto text-white" />
                        <span className="text-[#30A1F5] font-bold">ZK-MIXER</span>
                    </div>

                    <div className="flex items-center gap-5 text-xs text-[#94A3B8]">
                        <a href="https://ton.org" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">TON.org</a>
                        <a href="https://tact-lang.org" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Tact</a>
                        <a href="https://tonstat.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">TonStat</a>
                        <a href="https://github.com/ton-blockchain" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">GitHub</a>
                        <a href="https://docs.ton.org" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Docs</a>
                    </div>

                    <div className="flex items-center gap-2">
                        <GramCircularBadge className="w-5 h-5" />
                        <span className="text-white text-[10px] font-bold">GRAM COMPATIBLE</span>
                    </div>
                </div>

                <p className="text-[10px] text-[#64748B] uppercase tracking-widest">
                    &gt; THE OPEN NETWORK • MATHEMATICALLY PROVEN NON-CUSTODIAL PRIVACY PROTOCOL ACTIVE.
                </p>
            </footer>
        </div>
    );
}
