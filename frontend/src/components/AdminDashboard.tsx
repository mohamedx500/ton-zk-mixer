'use client';

import React, { useEffect, useState } from 'react';
import { useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';
import { toNano } from '@ton/core';
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
} from 'lucide-react';
import {
    isAuthorizedAdmin,
    fetchAdminMetrics,
    AdminMetrics,
    ADMIN_WALLET_ADDRESS,
    buildClaimFeesPayload,
    buildSetFeeRoutingPayload,
} from '../lib/admin';
import { EXPLORER_URL, TX_EXPLORER_URL } from '../lib/contracts';

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
                        amount: toNano('0.03').toString(),
                        payload: payload.toBoc().toString('base64'),
                    },
                ],
            });
            setToggleStatus('✅ Routing mode toggle transaction broadcasted!');
            setTimeout(loadData, 5000);
        } catch (err: any) {
            console.error('Toggle error:', err);
            setToggleStatus(`❌ Error: ${err.message || 'Transaction rejected'}`);
        } finally {
            setIsToggling(false);
        }
    };

    useEffect(() => {
        if (isAdmin) {
            loadData();
            const interval = setInterval(loadData, 15000);
            return () => clearInterval(interval);
        }
    }, [isAdmin]);

    const handleCopy = async (text: string, key: string) => {
        await navigator.clipboard.writeText(text);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    // ------------------------------------------------------------------------
    // Unauthorized Guard: Screen if wallet does not match
    // ------------------------------------------------------------------------
    if (!isAdmin) {
        return (
            <div className="bg-glass-card rounded-3xl p-8 sm:p-12 border border-rose-500/20 shadow-2xl relative overflow-hidden text-center space-y-6">
                <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

                <div className="inline-flex p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 shadow-lg shadow-rose-500/10 mb-2">
                    <ShieldAlert className="w-12 h-12" />
                </div>

                <div className="space-y-2 max-w-lg mx-auto">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
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
            </div>
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
        <div className="space-y-8 animate-fadeIn">
            {/* Header & Status Bar */}
            <div className="bg-glass-card rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Admin Key Authenticated</span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                            Protocol Monetization & Treasury Dashboard
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
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span className="font-semibold">Fee Mechanism:</span>
                        <span className="text-gray-300">1% Split to Admin Wallet via SETCODE upgrade</span>
                    </div>
                    {lastUpdated && (
                        <div className="text-gray-500 text-[11px]">
                            Last synced: {lastUpdated.toLocaleTimeString()}
                        </div>
                    )}
                </div>
            </div>

            {/* 5 High-Impact KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* TVL */}
                <div className="bg-glass-card rounded-2xl p-5 border border-white/10 hover:border-cyan-500/30 transition-all relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Protocol TVL
                        </span>
                        <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                            <TrendingUp className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-white">
                        {metrics ? metrics.tvlTon : '—'}{' '}
                        <span className="text-sm font-normal text-cyan-400">TON</span>
                    </div>
                    <div className="text-[11px] text-gray-400 mt-1">
                        Locked user pool liquidity
                    </div>
                </div>

                {/* Accumulated Treasury Fees (NEW) */}
                <div className="bg-glass-card rounded-2xl p-5 border border-cyan-500/30 bg-cyan-950/20 hover:border-cyan-400 transition-all relative overflow-hidden group shadow-lg shadow-cyan-500/10">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-cyan-300 uppercase tracking-wider">
                            Accumulated Fees
                        </span>
                        <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300">
                            <Coins className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-cyan-300">
                        {metrics ? metrics.accumulatedFeesTon : '0.00'}{' '}
                        <span className="text-sm font-normal text-cyan-400">TON</span>
                    </div>
                    <div className="text-[11px] text-cyan-400/90 font-medium mt-1">
                        Unclaimed in contract treasury
                    </div>
                </div>

                {/* Total Admin Fees Earned */}
                <div className="bg-glass-card rounded-2xl p-5 border border-white/10 hover:border-amber-500/30 transition-all relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Total Fees Earned
                        </span>
                        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                            <Zap className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-amber-300">
                        {metrics ? metrics.totalAdminFeesTon : '—'}{' '}
                        <span className="text-sm font-normal text-amber-400">TON</span>
                    </div>
                    <div className="text-[11px] text-gray-400 mt-1">
                        1.00% protocol rate
                    </div>
                </div>

                {/* Total Privacy Transactions */}
                <div className="bg-glass-card rounded-2xl p-5 border border-white/10 hover:border-emerald-500/30 transition-all relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Privacy Volume
                        </span>
                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                            <Lock className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-white">
                        {metrics ? metrics.totalDepositsCount : '—'}{' '}
                        <span className="text-sm font-normal text-gray-400">Tx</span>
                    </div>
                    <div className="text-[11px] text-gray-400 mt-1">
                        {metrics ? metrics.totalWithdrawalsCount : '—'} ZK Withdrawals
                    </div>
                </div>

                {/* Admin Wallet Balance */}
                <div className="bg-glass-card rounded-2xl p-5 border border-white/10 hover:border-teal-500/30 transition-all relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Admin Wallet
                        </span>
                        <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
                            <Wallet className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-white">
                        {metrics ? metrics.adminWalletBalance : '—'}{' '}
                        <span className="text-sm font-normal text-teal-400">TON</span>
                    </div>
                    <div className="text-[11px] text-gray-400 mt-1">
                        Connected admin balance
                    </div>
                </div>
            </div>

            {/* Treasury Management & Dynamic Fee Routing Section */}
            <div className="bg-glass-card rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative overflow-hidden space-y-6">
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
                    <div className="bg-[#0b101d] p-4 rounded-2xl border border-white/10 flex flex-col sm:flex-row sm:items-center gap-4 shrink-0">
                        <div>
                            <div className="text-xs font-bold text-white flex items-center gap-2">
                                <span>Fee Routing:</span>
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                                    metrics?.autoFeeRouting
                                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                }`}>
                                    {metrics?.autoFeeRouting ? 'Auto-Push Mode' : 'Accumulate Mode (Pull)'}
                                </span>
                            </div>
                            <p className="text-[11px] text-gray-400 max-w-xs mt-1">
                                {metrics?.autoFeeRouting
                                    ? 'Fees are pushed directly to Admin wallet on each withdrawal.'
                                    : 'Fees are safely accumulated in the contract to protect OpSec.'}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={handleToggleRouting}
                            disabled={isToggling}
                            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer ${
                                metrics?.autoFeeRouting
                                    ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30'
                                    : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30'
                            }`}
                        >
                            {isToggling ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <Sliders className="w-3.5 h-3.5" />
                            )}
                            <span>
                                {metrics?.autoFeeRouting ? 'Switch to Accumulate' : 'Switch to Auto-Push'}
                            </span>
                        </button>
                    </div>
                </div>

                {toggleStatus && (
                    <div className={`p-3 rounded-xl text-xs ${toggleStatus.startsWith('❌') ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'}`}>
                        {toggleStatus}
                    </div>
                )}

                {/* Claim Fees Form */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
                    <div className="lg:col-span-1 bg-[#0b101d] p-5 rounded-2xl border border-white/10 space-y-3">
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                            Ready to Claim
                        </div>
                        <div className="text-3xl font-extrabold text-cyan-400 font-mono">
                            {metrics ? metrics.accumulatedFeesTon : '0.00'}{' '}
                            <span className="text-sm font-normal text-gray-400">TON</span>
                        </div>
                        <p className="text-[11px] text-gray-400 leading-relaxed">
                            Cryptographically protected by strict assertion. The Admin cannot withdraw user pool deposits, guaranteeing 100% solvency for depositors.
                        </p>
                    </div>

                    <div className="lg:col-span-2 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Amount to Claim */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs">
                                    <label className="font-semibold text-gray-300">Amount (TON)</label>
                                    <button
                                        type="button"
                                        onClick={() => setClaimAmount(metrics?.accumulatedFeesTon || '0')}
                                        className="text-cyan-400 hover:text-cyan-300 text-[11px] font-bold cursor-pointer"
                                    >
                                        MAX ({metrics?.accumulatedFeesTon || '0'} TON)
                                    </button>
                                </div>
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={claimAmount}
                                    onChange={(e) => setClaimAmount(e.target.value)}
                                    className="w-full bg-[#0b101d] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                                />
                            </div>

                            {/* Destination Address */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs">
                                    <label className="font-semibold text-gray-300">Destination Address</label>
                                    <button
                                        type="button"
                                        onClick={() => setClaimDestination('UQAqBeQ17Cx9xaTLQr_H8Oa9HpRXrZeT2vuJ_Sb0FOoBsfnQ')}
                                        className="text-amber-400 hover:text-amber-300 text-[11px] font-bold cursor-pointer"
                                    >
                                        ⚡ Restock Relayer
                                    </button>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Paste destination TON address..."
                                    value={claimDestination}
                                    onChange={(e) => setClaimDestination(e.target.value)}
                                    className="w-full bg-[#0b101d] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 font-mono focus:outline-none focus:border-cyan-500"
                                />
                            </div>
                        </div>

                        {/* Presets and Submit */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                            <div className="flex items-center gap-2 text-xs">
                                <span className="text-gray-400">Quick Dest:</span>
                                <button
                                    type="button"
                                    onClick={() => setClaimDestination('UQAqBeQ17Cx9xaTLQr_H8Oa9HpRXrZeT2vuJ_Sb0FOoBsfnQ')}
                                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-[11px] cursor-pointer"
                                >
                                    Relayer Wallet
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setClaimDestination(ADMIN_WALLET_ADDRESS)}
                                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-[11px] cursor-pointer"
                                >
                                    Admin Wallet
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={handleClaimFees}
                                disabled={isClaiming || !claimAmount || Number(claimAmount) <= 0 || !claimDestination}
                                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-xs text-white shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                                {isClaiming ? (
                                    <>
                                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                        <span>Confirming in Wallet...</span>
                                    </>
                                ) : (
                                    <>
                                        <Wallet className="w-3.5 h-3.5" />
                                        <span>Claim Fees via TonConnect</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {claimStatus && (
                            <div className={`p-3 rounded-xl text-xs ${claimStatus.startsWith('❌') ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'}`}>
                                {claimStatus}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ZK Anonymity Set Assurance Callout */}
            <div className="bg-cyan-950/30 border border-cyan-500/20 rounded-2xl p-4 flex items-start gap-3 text-xs text-cyan-200/90 leading-relaxed">
                <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                    <span className="font-bold text-cyan-300">Cryptographic Anonymity Guarantee: </span>
                    Deposit and withdrawal registries below are strictly unlinked to preserve the Zero-Knowledge anonymity set.
                    Nullifiers are tracked on-chain for double-spend protection without revealing which deposit commitment was spent.
                </div>
            </div>

            {/* Table 1: Recent Deposits */}
            <div className="bg-glass-card rounded-2xl border border-white/10 overflow-hidden shadow-xl space-y-4 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
                            <ArrowDownLeft className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="font-bold text-base text-white">Recent Deposits</h3>
                            <p className="text-xs text-gray-400">
                                Fresh commitments entered into the on-chain Merkle tree
                            </p>
                        </div>
                    </div>

                    <div className="relative">
                        <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search commitment..."
                            value={depositSearch}
                            onChange={(e) => setDepositSearch(e.target.value)}
                            className="bg-black/30 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-500 w-full sm:w-60"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-white/5 text-gray-400 uppercase text-[10px] tracking-wider">
                                <th className="pb-3 font-semibold">Time</th>
                                <th className="pb-3 font-semibold">Amount</th>
                                <th className="pb-3 font-semibold">Commitment Hash</th>
                                <th className="pb-3 font-semibold text-right">Transaction</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-mono">
                            {filteredDeposits.length > 0 ? (
                                filteredDeposits.map((dep, idx) => (
                                    <tr key={dep.hash + idx} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="py-3 text-gray-300 font-sans whitespace-nowrap">
                                            {dep.time}
                                        </td>
                                        <td className="py-3 font-bold text-cyan-400 whitespace-nowrap">
                                            {dep.amount} TON
                                        </td>
                                        <td className="py-3 text-gray-300">
                                            <div className="flex items-center gap-1.5">
                                                <span className="truncate max-w-[140px] sm:max-w-[280px]">
                                                    {dep.commitment}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleCopy(dep.commitment, `comm-${idx}`)}
                                                    className="p-1 hover:text-white text-gray-500 transition-colors cursor-pointer"
                                                    title="Copy commitment"
                                                >
                                                    {copiedKey === `comm-${idx}` ? (
                                                        <Check className="w-3 h-3 text-emerald-400" />
                                                    ) : (
                                                        <Copy className="w-3 h-3" />
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                        <td className="py-3 text-right whitespace-nowrap">
                                            <a
                                                href={TX_EXPLORER_URL(dep.hash)}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 text-[11px]"
                                            >
                                                <span>TonScan</span>
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="py-6 text-center text-gray-500 font-sans">
                                        No deposit transactions matched filter
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Table 2: Recent Withdrawals & Fees */}
            <div className="bg-glass-card rounded-2xl border border-white/10 overflow-hidden shadow-xl space-y-4 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                            <ArrowUpRight className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="font-bold text-base text-white">Recent Withdrawals & Admin Fees</h3>
                            <p className="text-xs text-gray-400">
                                Verified Groth16 payouts with 1% admin fee monetization split
                            </p>
                        </div>
                    </div>

                    <div className="relative">
                        <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search recipient..."
                            value={withdrawSearch}
                            onChange={(e) => setWithdrawSearch(e.target.value)}
                            className="bg-black/30 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-emerald-500 w-full sm:w-60"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-white/5 text-gray-400 uppercase text-[10px] tracking-wider">
                                <th className="pb-3 font-semibold">Time</th>
                                <th className="pb-3 font-semibold">Clean Recipient</th>
                                <th className="pb-3 font-semibold">Amount Received</th>
                                <th className="pb-3 font-semibold">Admin Fee Cut (1%)</th>
                                <th className="pb-3 font-semibold text-right">Transaction</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-mono">
                            {filteredWithdrawals.length > 0 ? (
                                filteredWithdrawals.map((w, idx) => (
                                    <tr key={w.hash + idx} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="py-3 text-gray-300 font-sans whitespace-nowrap">
                                            {w.time}
                                        </td>
                                        <td className="py-3 text-gray-300">
                                            <div className="flex items-center gap-1.5">
                                                <span className="truncate max-w-[120px] sm:max-w-[200px]">
                                                    {w.recipient}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleCopy(w.recipient, `recip-${idx}`)}
                                                    className="p-1 hover:text-white text-gray-500 transition-colors cursor-pointer"
                                                    title="Copy recipient"
                                                >
                                                    {copiedKey === `recip-${idx}` ? (
                                                        <Check className="w-3 h-3 text-emerald-400" />
                                                    ) : (
                                                        <Copy className="w-3 h-3" />
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                        <td className="py-3 font-bold text-emerald-400 whitespace-nowrap">
                                            {w.amountReceived} TON
                                        </td>
                                        <td className="py-3 font-bold text-amber-300 whitespace-nowrap">
                                            +{w.adminFee} TON
                                        </td>
                                        <td className="py-3 text-right whitespace-nowrap">
                                            <a
                                                href={TX_EXPLORER_URL(w.hash)}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 text-[11px]"
                                            >
                                                <span>TonScan</span>
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="py-6 text-center text-gray-500 font-sans">
                                        No withdrawal transactions matched filter
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
