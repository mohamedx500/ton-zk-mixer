'use client';

import React, { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { DepositCard } from '../components/DepositCard';
import { WithdrawCard } from '../components/WithdrawCard';
import { StatsCard } from '../components/StatsCard';
import { PrivacyExplainer } from '../components/PrivacyExplainer';
import { Shield, Lock, Layers, Sparkles } from 'lucide-react';

export default function Home() {
    const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');
    const [refreshKey, setRefreshKey] = useState(0);

    const triggerRefresh = () => {
        setRefreshKey((prev) => prev + 1);
    };

    return (
        <div className="min-h-screen flex flex-col bg-[#07090e] bg-glow-radial text-gray-100 selection:bg-cyan-500 selection:text-black">
            {/* Top Navigation */}
            <Navbar />

            {/* Main Content Area */}
            <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
                {/* Hero / Header */}
                <div className="text-center space-y-3">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold mb-1 shadow-sm">
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Next-Gen Zero-Knowledge Privacy on The Open Network</span>
                    </div>
                    <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-b from-white via-gray-100 to-gray-400 bg-clip-text text-transparent">
                        Break the On-Chain Link
                    </h1>
                    <p className="max-w-xl mx-auto text-sm sm:text-base text-gray-400 leading-relaxed">
                        Deposit native TON or Jettons, generate a cryptographic proof in your browser, and withdraw to any clean wallet with mathematical privacy.
                    </p>
                </div>

                {/* Tab Switcher */}
                <div className="flex justify-center">
                    <div className="bg-glass-inner p-1.5 rounded-2xl border border-white/10 flex items-center gap-1.5 shadow-xl">
                        <button
                            type="button"
                            onClick={() => setActiveTab('deposit')}
                            className={`flex items-center gap-2 px-6 sm:px-8 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                                activeTab === 'deposit'
                                    ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-black shadow-lg shadow-cyan-500/25'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <Shield className="w-4 h-4" />
                            <span>Deposit TON</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('withdraw')}
                            className={`flex items-center gap-2 px-6 sm:px-8 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                                activeTab === 'withdraw'
                                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-black shadow-lg shadow-emerald-500/25'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <Lock className="w-4 h-4" />
                            <span>Anonymous Withdraw</span>
                        </button>
                    </div>
                </div>

                {/* Interactive Card Section */}
                <div className="transition-all duration-300">
                    {activeTab === 'deposit' ? (
                        <DepositCard onDepositSuccess={triggerRefresh} />
                    ) : (
                        <WithdrawCard onWithdrawSuccess={triggerRefresh} />
                    )}
                </div>

                {/* Real-time Pool Stats Card */}
                <div key={refreshKey}>
                    <StatsCard />
                </div>

                {/* Educational Privacy Explainer */}
                <PrivacyExplainer />
            </main>

            {/* Footer */}
            <footer className="border-t border-white/5 py-8 px-4 text-center text-xs text-gray-500 space-y-2">
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
                        className="hover:text-cyan-400 transition-colors"
                    >
                        TON Blockchain
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
                    Universal Zero-Knowledge Mixer Protocol. Non-custodial, open-source, and verifiable on TON Testnet.
                </p>
            </footer>
        </div>
    );
}
