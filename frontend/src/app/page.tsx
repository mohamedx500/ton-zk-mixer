'use client';

import React, { useState } from 'react';
import { useTonAddress } from '@tonconnect/ui-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from '../components/Navbar';
import { DepositCard } from '../components/DepositCard';
import { WithdrawCard } from '../components/WithdrawCard';
import { AdminDashboard } from '../components/AdminDashboard';
import { StatsCard } from '../components/StatsCard';
import { PrivacyExplainer } from '../components/PrivacyExplainer';
import { Shield, Lock, Crown } from 'lucide-react';
import { isAuthorizedAdmin } from '../lib/admin';
import { TonIcon, GramIcon } from '../components/TonIcons';

export default function Home() {
    const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw' | 'admin'>('deposit');
    const [refreshKey, setRefreshKey] = useState(0);

    const connectedAddress = useTonAddress();
    const isAdmin = isAuthorizedAdmin(connectedAddress);

    const triggerRefresh = () => {
        setRefreshKey((prev) => prev + 1);
    };

    return (
        <div className="min-h-screen flex flex-col bg-brand-black text-brand-white selection:bg-brand-silver selection:text-black relative overflow-x-hidden font-sans">
            {/* Top Navigation */}
            <Navbar activeTab={activeTab} onSelectTab={setActiveTab} />

            {/* Main Content Area */}
            <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8 relative z-10">
                {/* Hero / Header with Edged Corners & Crypto Utility */}
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="text-center space-y-3"
                >
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-brand-gray border border-brand-border text-brand-white text-[10px] font-mono tracking-widest uppercase mb-1 rounded-full shadow-sm">
                        <TonIcon className="w-3.5 h-3.5" />
                        <span>Zero-Knowledge Privacy Protocol</span>
                        <span className="text-brand-border">|</span>
                        <GramIcon className="w-3.5 h-3.5" />
                        <span className="text-brand-silver">TON Ecosystem</span>
                    </div>

                    <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-brand-white uppercase">
                        {activeTab === 'admin' ? 'SYSTEM ADMINISTRATION' : 'BREAK THE ON-CHAIN TRACE'}
                    </h1>

                    <p className="max-w-xl mx-auto text-xs sm:text-sm text-brand-silver leading-relaxed font-mono">
                        {activeTab === 'admin'
                            ? '> INITIALIZING TELEMETRY... AUTHORIZED ACCESS ONLY.'
                            : '> MATHEMATICALLY UNTRACEABLE. DEPOSIT TON TO SEVER ALL PREVIOUS ON-CHAIN HISTORY.'}
                    </p>
                </motion.div>

                {/* Tab Switcher with Edged Corners & Smooth Transitions */}
                <div className="flex justify-center">
                    <div className="bg-brand-offblack p-1.5 border border-brand-border flex items-center gap-1.5 rounded-2xl shadow-lg">
                        <button
                            type="button"
                            onClick={() => setActiveTab('deposit')}
                            className={`flex items-center gap-2 px-6 py-2.5 font-mono text-xs transition-all duration-200 uppercase tracking-wider rounded-xl cursor-pointer active:scale-95 ${
                                activeTab === 'deposit'
                                    ? 'bg-brand-white text-black font-bold shadow-md'
                                    : 'text-brand-silver hover:text-white hover:bg-brand-gray/60 bg-transparent'
                            }`}
                        >
                            <Shield className="w-3.5 h-3.5" />
                            <span>Deposit</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('withdraw')}
                            className={`flex items-center gap-2 px-6 py-2.5 font-mono text-xs transition-all duration-200 uppercase tracking-wider rounded-xl cursor-pointer active:scale-95 ${
                                activeTab === 'withdraw'
                                    ? 'bg-brand-white text-black font-bold shadow-md'
                                    : 'text-brand-silver hover:text-white hover:bg-brand-gray/60 bg-transparent'
                            }`}
                        >
                            <Lock className="w-3.5 h-3.5" />
                            <span>Withdraw</span>
                        </button>

                        {/* Admin Panel Tab in Switcher if Admin */}
                        {isAdmin && (
                            <button
                                type="button"
                                onClick={() => setActiveTab('admin')}
                                className={`flex items-center gap-2 px-6 py-2.5 font-mono text-xs transition-all duration-200 uppercase tracking-wider rounded-xl cursor-pointer active:scale-95 ${
                                    activeTab === 'admin'
                                        ? 'bg-brand-white text-black font-bold shadow-md'
                                        : 'text-brand-silver hover:text-white hover:bg-brand-gray/60 bg-transparent'
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
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                transition={{ duration: 0.22, ease: 'easeOut' }}
                            >
                                <DepositCard onDepositSuccess={triggerRefresh} />
                            </motion.div>
                        )}

                        {activeTab === 'withdraw' && (
                            <motion.div
                                key="withdraw-tab"
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                transition={{ duration: 0.22, ease: 'easeOut' }}
                            >
                                <WithdrawCard onWithdrawSuccess={triggerRefresh} />
                            </motion.div>
                        )}

                        {activeTab === 'admin' && (
                            <motion.div
                                key="admin-tab"
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                transition={{ duration: 0.22, ease: 'easeOut' }}
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

            {/* Footer with Crypto Utility Links */}
            <footer className="border-t border-brand-border py-8 px-4 text-center font-mono text-[10px] text-brand-silver uppercase tracking-widest bg-brand-black">
                <div className="flex flex-wrap items-center justify-center gap-4 mb-3">
                    <a href="https://tact-lang.org" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">TACT</a>
                    <span>/</span>
                    <a href="https://ton.org" target="_blank" rel="noreferrer" className="hover:text-white transition-colors flex items-center gap-1.5">
                        <TonIcon className="w-3.5 h-3.5 inline" />
                        <span>TON</span>
                    </a>
                    <span>/</span>
                    <span className="flex items-center gap-1.5 text-brand-silver/90">
                        <GramIcon className="w-3.5 h-3.5 inline" />
                        <span>GRAM</span>
                    </span>
                    <span>/</span>
                    <a href="https://iden3.io/circom" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">CIRCOM</a>
                </div>
                <p>
                    &gt; SYSTEM LOG: NON-CUSTODIAL ZK-MIXER ACTIVE.
                </p>
            </footer>
        </div>
    );
}
