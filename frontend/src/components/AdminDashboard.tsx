'use client';

import React, { useEffect, useState } from 'react';
import { useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';
import { toNano } from '@ton/core';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldAlert,
    ShieldCheck,
    Coins,
    TrendingUp,
    Wallet,
    ArrowDownLeft,
    ArrowUpRight,
    RefreshCw,
    ExternalLink,
    Copy,
    Check,
    Lock,
    Search,
    AlertCircle,
    Sliders,
    Zap,
    Sparkles,
} from 'lucide-react';
import {
    isAuthorizedAdmin,
    fetchAdminMetrics,
    AdminMetrics,
    ADMIN_WALLET_ADDRESS,
    buildClaimFeesPayload,
    buildSetFeeRoutingPayload,
} from '../lib/admin';
import { EXPLORER_URL, TX_EXPLORER_URL, ACTIVE_RELAYER_ADDRESS } from '../lib/contracts';
import { TonIcon, TonDiamond, ZkCircuitIcon } from './TonIcons';

export function AdminDashboard() {
    const connectedAddress = useTonAddress();
    const [tonConnectUI] = useTonConnectUI();
    const isAdmin = isAuthorizedAdmin(connectedAddress);

    const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    // Treasury claim and routing state
    const [claimAmount, setClaimAmount] = useState('');
    const [claimDestination, setClaimDestination] = useState('');
    const [isClaiming, setIsClaiming] = useState(false);
    const [claimStatus, setClaimStatus] = useState<string | null>(null);
    const [isToggling, setIsToggling] = useState(false);
    const [toggleStatus, setToggleStatus] = useState<string | null>(null);

    // Search filters for tables
    const [depositSearch, setDepositSearch] = useState('');
    const [withdrawSearch, setWithdrawSearch] = useState('');

    const loadData = async () => {
        setIsLoading(true);
        try {
            const data = await fetchAdminMetrics();
            setMetrics(data);
            setLastUpdated(new Date());
        } catch (err) {
            console.error('Failed to load admin metrics:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClaimFees = async () => {
        if (!claimAmount || Number(claimAmount) <= 0 || !claimDestination) return;
        setIsClaiming(true);
        setClaimStatus(null);
        try {
            const payload = buildClaimFeesPayload(claimAmount, claimDestination);
            await tonConnectUI.sendTransaction({
                validUntil: Math.floor(Date.now() / 1000) + 360,
                messages: [
                    {
                        address: metrics?.contractAddress || '',
                        amount: toNano('0.05').toString(),
                        payload: payload.toBoc().toString('base64'),
                    },
                ],
            });
            setClaimStatus('✅ Claim transaction broadcasted to network!');
            setTimeout(loadData, 5000);
        } catch (err: any) {
            console.error('Claim error:', err);
            setClaimStatus(`❌ Error: ${err.message || 'Transaction rejected'}`);
        } finally {
            setIsClaiming(false);
        }
    };

    const handleToggleRouting = async () => {
        if (!metrics) return;
        setIsToggling(true);
        setToggleStatus(null);
        try {
            const newRouting = !metrics.autoFeeRouting;
            const payload = buildSetFeeRoutingPayload(newRouting);
            await tonConnectUI.sendTransaction({
                validUntil: Math.floor(Date.now() / 1000) + 360,
                messages: [
                    {
                        address: metrics.contractAddress,
                        amount: toNano('0.05').toString(),
                        payload: payload.toBoc().toString('base64'),
                    },
                ],
            });
            setToggleStatus(`✅ Toggled fee routing to: ${newRouting ? 'Auto-Push' : 'Pull/Accumulate'}`);
            setTimeout(loadData, 5000);
        } catch (err: any) {
            console.error('Toggle error:', err);
            setToggleStatus(`❌ Error: ${err.message || 'Transaction rejected'}`);
        } finally {
            setIsToggling(false);
        }
    };

    const handleCopy = async (text: string, key: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedKey(key);
            setTimeout(() => setCopiedKey(null), 2000);
        } catch (_) {}
    };

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 20000);
        return () => clearInterval(interval);
    }, []);

    // Access control verification view
    if (!isAdmin) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-glass-card rounded-3xl p-8 sm:p-12 border border-red-500/20 text-center max-w-2xl mx-auto space-y-6 shadow-2xl backdrop-blur-2xl"
            >
                <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
                    <ShieldAlert className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-white tracking-tight">
                        Admin Access Restricted
                    </h2>
                    <p className="text-sm text-gray-400 leading-relaxed">
                        This protocol telemetry and fee management portal is cryptographically restricted to the designated protocol administrator.
                    </p>
                </div>

                <div className="bg-[#0b101d] p-5 rounded-2xl border border-white/10 max-w-md mx-auto text-left space-y-3 font-mono text-xs">
                    <div>
                        <div className="text-gray-500 text-[11px] uppercase tracking-wider mb-1 font-sans">
                            Connected Wallet
                        </div>
                        <div className="text-rose-400 truncate">
                            {connectedAddress || 'No wallet connected'}
                        </div>
                    </div>

                    <div className="pt-2 border-t border-white/5">
                        <div className="text-gray-500 text-[11px] uppercase tracking-wider mb-1 font-sans">
                            Required Admin Key
                        </div>
                        <div className="text-cyan-400 truncate">
                            {ADMIN_WALLET_ADDRESS}
                        </div>
                    </div>
                </div>

                <p className="text-xs text-gray-500">
                    Connect using the authorized admin address via the TonConnect button in the header.
                </p>
            </motion.div>
        );
    }

    // Filter deposits and withdrawals by search term
    const filteredDeposits = metrics?.recentDeposits.filter((d) =>
        d.commitment.toLowerCase().includes(depositSearch.toLowerCase()) ||
        d.hash.toLowerCase().includes(depositSearch.toLowerCase())
    ) || [];

    const filteredWithdrawals = metrics?.recentWithdrawals.filter((w) =>
        w.recipient.toLowerCase().includes(withdrawSearch.toLowerCase()) ||
        w.hash.toLowerCase().includes(withdrawSearch.toLowerCase())
    ) || [];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
        >
            {/* Header & Status Bar */}
            <div className="bg-glass-card rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative overflow-hidden backdrop-blur-2xl">
                <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Admin Key Authenticated</span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
                            <TonIcon className="w-7 h-7" />
                            <span>Protocol Monetization & Treasury Dashboard</span>
                        </h2>
                        <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
                            <span>Admin:</span>
                            <span className="text-cyan-300 truncate max-w-[200px] sm:max-w-none">
                                {ADMIN_WALLET_ADDRESS}
                            </span>
                            <button
                                type="button"
                                onClick={() => handleCopy(ADMIN_WALLET_ADDRESS, 'admin-wallet')}
                                className="p-1 hover:text-white transition-colors cursor-pointer"
                                title="Copy Admin Wallet"
                            >
                                {copiedKey === 'admin-wallet' ? (
                                    <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                    <Copy className="w-3 h-3" />
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={loadData}
                            disabled={isLoading}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-gray-200 transition-all cursor-pointer"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
                            <span>{isLoading ? 'Syncing...' : 'Sync Telemetry'}</span>
                        </button>
                    </div>
                </div>

                {/* Upgrade Model Badge */}
                <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-emerald-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="font-semibold">Fee Mechanism:</span>
                        <span className="text-gray-300">Upfront Tiered Coverage (1 TON - 1000 TON) + Gasless Relayer Auto-Restock</span>
                    </div>
                    {lastUpdated && (
                        <div className="text-gray-500 text-[11px] font-mono">
                            Last synced: {lastUpdated.toLocaleTimeString()}
                        </div>
                    )}
                </div>
            </div>

            {/* 5 High-Impact KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* TVL */}
                <motion.div
                    whileHover={{ y: -2 }}
                    className="bg-glass-card rounded-2xl p-5 border border-white/10 hover:border-cyan-500/30 transition-all relative overflow-hidden group shadow-lg"
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Protocol TVL
                        </span>
                        <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                            <TrendingUp className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-1.5">
                        <TonDiamond className="w-5 h-5 text-cyan-400" />
                        <span>{metrics ? metrics.tvlTon : '—'}</span>
                        <span className="text-sm font-normal text-cyan-400">TON</span>
                    </div>
                    <div className="text-[11px] text-gray-400 mt-1">
                        Locked user pool liquidity
                    </div>
                </motion.div>

                {/* Accumulated Treasury Fees */}
                <motion.div
                    whileHover={{ y: -2 }}
                    className="bg-glass-card rounded-2xl p-5 border border-cyan-500/40 bg-cyan-950/20 hover:border-cyan-400 transition-all relative overflow-hidden group shadow-lg shadow-cyan-500/15"
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-cyan-300 uppercase tracking-wider">
                            Accumulated Fees
                        </span>
                        <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300">
                            <Coins className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-cyan-300 flex items-center gap-1.5">
                        <TonDiamond className="w-5 h-5 text-cyan-300" />
                        <span>{metrics ? metrics.accumulatedFeesTon : '0.00'}</span>
                        <span className="text-sm font-normal text-cyan-400">TON</span>
                    </div>
                    <div className="text-[11px] text-cyan-400/90 font-medium mt-1">
                        Unclaimed in contract treasury
                    </div>
                </motion.div>

                {/* Total Admin Fees Earned */}
                <motion.div
                    whileHover={{ y: -2 }}
                    className="bg-glass-card rounded-2xl p-5 border border-white/10 hover:border-amber-500/30 transition-all relative overflow-hidden group shadow-lg"
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Total Fees Earned
                        </span>
                        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                            <Zap className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-amber-300 flex items-center gap-1.5">
                        <TonDiamond className="w-5 h-5 text-amber-400" />
                        <span>{metrics ? metrics.totalAdminFeesTon : '—'}</span>
                        <span className="text-sm font-normal text-amber-400">TON</span>
                    </div>
                    <div className="text-[11px] text-gray-400 mt-1">
                        Tiered upfront fee income
                    </div>
                </motion.div>

                {/* Total Privacy Transactions */}
                <motion.div
                    whileHover={{ y: -2 }}
                    className="bg-glass-card rounded-2xl p-5 border border-white/10 hover:border-emerald-500/30 transition-all relative overflow-hidden group shadow-lg"
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Privacy Volume
                        </span>
                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                            <Lock className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-1">
                        <span>{metrics ? metrics.totalDepositsCount : '—'}</span>
                        <span className="text-sm font-normal text-gray-400">Tx</span>
                    </div>
                    <div className="text-[11px] text-gray-400 mt-1">
                        {metrics ? metrics.totalWithdrawalsCount : '—'} ZK Withdrawals
                    </div>
                </motion.div>

                {/* Admin Wallet Balance */}
                <motion.div
                    whileHover={{ y: -2 }}
                    className="bg-glass-card rounded-2xl p-5 border border-white/10 hover:border-teal-500/30 transition-all relative overflow-hidden group shadow-lg"
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Admin Wallet
                        </span>
                        <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
                            <Wallet className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-1.5">
                        <TonDiamond className="w-5 h-5 text-teal-400" />
                        <span>{metrics ? metrics.adminWalletBalance : '—'}</span>
                        <span className="text-sm font-normal text-teal-400">TON</span>
                    </div>
                    <div className="text-[11px] text-gray-400 mt-1">
                        Connected admin balance
                    </div>
                </motion.div>
            </div>

            {/* Treasury Management & Dynamic Fee Routing Section */}
            <div className="bg-glass-card rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative overflow-hidden space-y-6 backdrop-blur-2xl">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/10">
                    <div className="space-y-1">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold">
                            <Sliders className="w-3.5 h-3.5" />
                            <span>Treasury & Dynamic Fee Routing Engine</span>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                            Treasury Claims & Relayer Auto-Restock
                        </h3>
                        <p className="text-xs text-gray-400 max-w-xl leading-relaxed">
                            Claim accumulated protocol fees to any destination (e.g., restock the Gasless Relayer or fund a fresh wallet), or toggle automatic fee pushing.
                        </p>
                    </div>

                    {/* Routing Mode Toggle */}
                    <div className="bg-[#0b101d] p-4 rounded-2xl border border-white/10 flex flex-col sm:flex-row sm:items-center gap-4 shrink-0 shadow-inner">
                        <div>
                            <div className="text-xs font-bold text-white flex items-center gap-2">
                                <span>Fee Routing:</span>
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                                    metrics?.autoFeeRouting
                                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                }`}>
                                    {metrics?.autoFeeRouting ? 'Auto-Push (On-Withdraw)' : 'Pull/Accumulate (Internal Treasury)'}
                                </span>
                            </div>
                            <p className="text-[11px] text-gray-400 mt-1">
                                {metrics?.autoFeeRouting
                                    ? 'Fees are pushed directly to Admin on every withdrawal.'
                                    : 'Fees accumulate quietly in the contract for stealth batch claims.'}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={handleToggleRouting}
                            disabled={isToggling}
                            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white border border-white/10 transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
                        >
                            {isToggling ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sliders className="w-3.5 h-3.5" />}
                            <span>Switch Mode</span>
                        </button>
                    </div>
                </div>

                {toggleStatus && (
                    <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs">
                        {toggleStatus}
                    </div>
                )}

                {/* Claim Fees Interactive Panel */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-4">
                        <div className="text-xs font-bold uppercase tracking-wider text-gray-400">
                            Claim Treasury Balance
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1.5 font-medium">
                                    Amount to Claim (TON)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={claimAmount}
                                    onChange={(e) => setClaimAmount(e.target.value)}
                                    placeholder="e.g. 0.5"
                                    className="w-full bg-[#070b14] border border-white/10 focus:border-cyan-400 rounded-xl p-3 text-sm text-white font-mono focus:outline-none transition-all placeholder:text-gray-600 shadow-inner"
                                />
                                <div className="flex items-center gap-2 mt-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const available = Number(metrics?.accumulatedFeesTon || 0);
                                            setClaimAmount((available * 0.5).toFixed(2));
                                        }}
                                        className="text-[10px] bg-white/5 hover:bg-white/10 px-2 py-1 rounded border border-white/5 text-gray-300"
                                    >
                                        50%
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setClaimAmount(metrics?.accumulatedFeesTon || '0')}
                                        className="text-[10px] bg-white/5 hover:bg-white/10 px-2 py-1 rounded border border-white/5 text-cyan-300"
                                    >
                                        Max ({metrics?.accumulatedFeesTon || '0'} TON)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setClaimAmount('0.5');
                                            setClaimDestination(ACTIVE_RELAYER_ADDRESS);
                                        }}
                                        className="text-[10px] bg-amber-500/10 hover:bg-amber-500/20 px-2 py-1 rounded border border-amber-500/30 text-amber-300 font-bold"
                                    >
                                        ⚡ Restock Relayer (0.5 TON)
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs text-gray-400 mb-1.5 font-medium">
                                    Destination Address
                                </label>
                                <input
                                    type="text"
                                    value={claimDestination}
                                    onChange={(e) => setClaimDestination(e.target.value)}
                                    placeholder="Destination TON wallet (Relayer or Admin)"
                                    className="w-full bg-[#070b14] border border-white/10 focus:border-cyan-400 rounded-xl p-3 text-xs text-white font-mono focus:outline-none transition-all placeholder:text-gray-600 shadow-inner"
                                />
                                <div className="flex items-center gap-2 mt-2">
                                    <button
                                        type="button"
                                        onClick={() => setClaimDestination(ACTIVE_RELAYER_ADDRESS)}
                                        className="text-[10px] text-amber-400 hover:text-amber-300 underline font-mono truncate"
                                    >
                                        Use Relayer: {ACTIVE_RELAYER_ADDRESS.slice(0, 14)}...
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleClaimFees}
                            disabled={isClaiming || !claimAmount || Number(claimAmount) <= 0 || !claimDestination}
                            className={`w-full py-3.5 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                                isClaiming || !claimAmount || Number(claimAmount) <= 0 || !claimDestination
                                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-white/5'
                                    : 'bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-black shadow-lg shadow-cyan-500/20'
                            }`}
                        >
                            {isClaiming ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Coins className="w-4 h-4" />}
                            <span>Claim {claimAmount || '0'} TON to Destination</span>
                        </button>

                        {claimStatus && (
                            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs">
                                {claimStatus}
                            </div>
                        )}
                    </div>

                    {/* Operational Security Safeguard Note */}
                    <div className="bg-[#080d1a] rounded-2xl p-5 border border-white/5 space-y-3 text-xs">
                        <div className="font-bold text-white flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            <span>Anti-Drain Mathematical Separation</span>
                        </div>
                        <p className="text-gray-400 leading-relaxed">
                            User TVL is strictly locked and cannot be drained by ClaimFees calls. The contract strictly asserts that claims cannot exceed earned fees.
                        </p>
                        <div className="pt-2 border-t border-white/5 space-y-1 font-mono text-[11px] text-gray-400">
                            <div><span className="text-gray-500">Contract:</span> {metrics?.contractAddress.slice(0, 16)}...</div>
                            <div><span className="text-gray-500">Relayer:</span> {ACTIVE_RELAYER_ADDRESS.slice(0, 16)}...</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Audit Logs: Recent Deposits & Withdrawals */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Deposits */}
                <div className="bg-glass-card rounded-3xl p-6 border border-white/10 shadow-2xl space-y-4 backdrop-blur-2xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                                <ArrowDownLeft className="w-4 h-4" />
                            </div>
                            <h3 className="font-bold text-white text-base">Recent Deposits</h3>
                        </div>
                        <span className="text-xs font-mono text-gray-400">
                            {filteredDeposits.length} entries
                        </span>
                    </div>

                    <div className="relative">
                        <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-3" />
                        <input
                            type="text"
                            value={depositSearch}
                            onChange={(e) => setDepositSearch(e.target.value)}
                            placeholder="Filter by hash or commitment..."
                            className="w-full bg-[#070b14] border border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
                        />
                    </div>

                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                        {filteredDeposits.length === 0 ? (
                            <div className="p-6 text-center text-xs text-gray-500">
                                No matching deposits found
                            </div>
                        ) : (
                            filteredDeposits.map((d, i) => (
                                <div
                                    key={i}
                                    className="p-3 rounded-xl bg-[#080d1a] border border-white/5 hover:border-white/15 transition-all text-xs font-mono flex items-center justify-between"
                                >
                                    <div>
                                        <div className="text-white font-semibold flex items-center gap-1.5">
                                            <TonDiamond className="w-3.5 h-3.5 text-cyan-400" />
                                            <span>{d.amount}</span>
                                        </div>
                                        <div className="text-[10px] text-gray-500 truncate max-w-[200px]">
                                            Commitment: {d.commitment}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] text-gray-400">{d.time}</div>
                                        <a
                                            href={TX_EXPLORER_URL(d.hash)}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1 justify-end"
                                        >
                                            <span>Tx</span>
                                            <ExternalLink className="w-2.5 h-2.5" />
                                        </a>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Recent Withdrawals */}
                <div className="bg-glass-card rounded-3xl p-6 border border-white/10 shadow-2xl space-y-4 backdrop-blur-2xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                                <ArrowUpRight className="w-4 h-4" />
                            </div>
                            <h3 className="font-bold text-white text-base">Recent ZK Withdrawals</h3>
                        </div>
                        <span className="text-xs font-mono text-gray-400">
                            {filteredWithdrawals.length} entries
                        </span>
                    </div>

                    <div className="relative">
                        <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-3" />
                        <input
                            type="text"
                            value={withdrawSearch}
                            onChange={(e) => setWithdrawSearch(e.target.value)}
                            placeholder="Filter by hash or recipient..."
                            className="w-full bg-[#070b14] border border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-400"
                        />
                    </div>

                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                        {filteredWithdrawals.length === 0 ? (
                            <div className="p-6 text-center text-xs text-gray-500">
                                No matching withdrawals found
                            </div>
                        ) : (
                            filteredWithdrawals.map((w, i) => (
                                <div
                                    key={i}
                                    className="p-3 rounded-xl bg-[#080d1a] border border-white/5 hover:border-white/15 transition-all text-xs font-mono flex items-center justify-between"
                                >
                                    <div>
                                        <div className="text-emerald-400 font-semibold flex items-center gap-1.5">
                                            <TonDiamond className="w-3.5 h-3.5 text-emerald-400" />
                                            <span>{w.amountReceived}</span>
                                        </div>
                                        <div className="text-[10px] text-gray-500 truncate max-w-[200px]">
                                            To: {w.recipient}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] text-gray-400">{w.time}</div>
                                        <a
                                            href={TX_EXPLORER_URL(w.hash)}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1 justify-end"
                                        >
                                            <span>Tx</span>
                                            <ExternalLink className="w-2.5 h-2.5" />
                                        </a>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
