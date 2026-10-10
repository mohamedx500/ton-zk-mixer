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
import { BackgroundNetwork } from '../components/BackgroundNetwork';
import { Shield, Lock, Sparkles, Crown } from 'lucide-react';
import { isAuthorizedAdmin } from '../lib/admin';
import { TonIcon } from '../components/TonIcons';

export default function Home() {
    const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw' | 'admin'>('deposit');
    const [refreshKey, setRefreshKey] = useState(0);

    const connectedAddress = useTonAddress();
    const isAdmin = isAuthorizedAdmin(connectedAddress);

    const triggerRefresh = () => {
        setRefreshKey((prev) => prev + 1);
    };

    return (
        <div className="min-h-screen flex flex-col bg-[#07090e] text-gray-100 selection:bg-cyan-500 selection:text-black relative overflow-x-hidden">
            {/* Ambient Web3 Network Background Animation */}
            <BackgroundNetwork />

            {/* Top Navigation */}
            <Navbar activeTab={activeTab} onSelectTab={setActiveTab} />

            {/* Main Content Area */}
            <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8 relative z-10">
                {/* Hero / Header */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="text-center space-y-3"
                >
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 text-xs font-semibold mb-1 shadow-sm backdrop-blur-md">
                        <TonIcon className="w-3.5 h-3.5" />
                        <span>Next-Gen Zero-Knowledge Privacy on The Open Network</span>
                    </div>

                    <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-b from-white via-gray-100 to-gray-400 bg-clip-text text-transparent">
                        {activeTab === 'admin' ? 'Protocol Administration' : 'Break the On-Chain Link'}
                    </h1>

                    <p className="max-w-xl mx-auto text-xs sm:text-sm md:text-base text-gray-400 leading-relaxed">
                        {activeTab === 'admin'
                            ? 'Exclusive monetization telemetry, on-chain protocol TVL, fee tracking, and transaction verification for the protocol administrator.'
                            : 'Deposit native TON into mathematically shielded privacy pools (1 TON - 1000 TON), generate a cryptographic proof in your browser, and withdraw to any fresh wallet with zero trace.'}
                    </p>
                </motion.div>

                {/* Tab Switcher */}
                <div className="flex justify-center">
                    <div className="bg-[#0b101d]/90 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 flex items-center gap-1.5 shadow-2xl">
                        <button
                            type="button"
                            onClick={() => setActiveTab('deposit')}
                            className={`flex items-center gap-2 px-5 sm:px-7 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all cursor-pointer relative ${
                                activeTab === 'deposit'
                                    ? 'bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 text-black shadow-lg shadow-cyan-500/30'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <Shield className="w-4 h-4" />
                            <span>Deposit TON</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('withdraw')}
                            className={`flex items-center gap-2 px-5 sm:px-7 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all cursor-pointer relative ${
                                activeTab === 'withdraw'
                                    ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 text-black shadow-lg shadow-emerald-500/30'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <Lock className="w-4 h-4" />
                            <span>Anonymous Withdraw</span>
                        </button>

                        {/* Exclusive Admin Panel Tab in Switcher if Admin */}
                        {isAdmin && (
                            <button
                                type="button"
                                onClick={() => setActiveTab('admin')}
                                className={`flex items-center gap-2 px-5 sm:px-7 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all cursor-pointer relative ${
                                    activeTab === 'admin'
                                        ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-lg shadow-amber-500/30'
                                        : 'text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/10'
                                }`}
                            >
                                <Crown className="w-4 h-4 text-amber-400" />
                                <span>Admin Panel</span>
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
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                <DepositCard onDepositSuccess={triggerRefresh} />
                            </motion.div>
                        )}

                        {activeTab === 'withdraw' && (
                            <motion.div
                                key="withdraw-tab"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                <WithdrawCard onWithdrawSuccess={triggerRefresh} />
                            </motion.div>
                        )}

                        {activeTab === 'admin' && (
                            <motion.div
                                key="admin-tab"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
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

            {/* Footer */}
            <footer className="border-t border-white/5 py-8 px-4 text-center text-xs text-gray-500 space-y-2 relative z-10 backdrop-blur-md bg-[#07090e]/40">
                <div className="flex items-center justify-center gap-4 text-gray-400">
                    <a
                        href="https://tact-lang.org"
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-cyan-400 transition-colors"
                    >
                        Built with Tact
                    </a>
                    <span>•</span>
                    <a
                        href="https://ton.org"
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-cyan-400 transition-colors flex items-center gap-1"
                    >
                        <TonIcon className="w-3.5 h-3.5 inline" />
                        <span>TON Blockchain</span>
                    </a>
                    <span>•</span>
                    <a
                        href="https://iden3.io/circom"
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-cyan-400 transition-colors"
                    >
                        Circom BLS12-381
                    </a>
                </div>
                <p>
                    Universal Zero-Knowledge Mixer Protocol Pro Max. Non-custodial, open-source, and verifiable on TON Blockchain.
                </p>
            </footer>
        </div>
    );
}
