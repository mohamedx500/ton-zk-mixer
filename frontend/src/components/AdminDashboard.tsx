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
    Sliders,
    Zap,
    Terminal,
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
            setClaimStatus('[SUCCESS] CLAIM TX BROADCASTED');
            setTimeout(loadData, 5000);
        } catch (err: any) {
            console.error('Claim error:', err);
            setClaimStatus(`[ERROR] ${err.message?.toUpperCase() || 'TX REJECTED'}`);
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
            setToggleStatus(`[SUCCESS] ROUTING SET: ${newRouting ? 'AUTO-PUSH' : 'PULL/ACCUMULATE'}`);
            setTimeout(loadData, 5000);
        } catch (err: any) {
            console.error('Toggle error:', err);
            setToggleStatus(`[ERROR] ${err.message?.toUpperCase() || 'TX REJECTED'}`);
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
            <div className="bg-minimal-card p-8 border border-brand-border text-brand-white text-center max-w-2xl mx-auto space-y-6">
                <div className="w-16 h-16 border border-brand-border bg-brand-gray flex items-center justify-center mx-auto text-brand-silver">
                    <ShieldAlert className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                    <h2 className="text-xl font-bold uppercase tracking-widest text-brand-white">
                        SYS_ADMIN RESTRICTED
                    </h2>
                    <p className="text-xs text-brand-silver font-mono uppercase">
                        UNAUTHORIZED ACCESS. CONNECT WITH DEPLOYER WALLET.
                    </p>
                </div>

                <div className="bg-brand-black p-5 border border-brand-border max-w-md mx-auto text-left space-y-4 font-mono text-[10px] uppercase">
                    <div>
                        <div className="text-brand-silver tracking-widest mb-1">
                            CONNECTED WALLET
                        </div>
                        <div className="text-brand-white truncate">
                            {connectedAddress || 'NULL'}
                        </div>
                    </div>

                    <div className="pt-3 border-t border-brand-border">
                        <div className="text-brand-silver tracking-widest mb-1">
                            REQUIRED ADMIN KEY
                        </div>
                        <div className="text-brand-white truncate">
                            {ADMIN_WALLET_ADDRESS}
                        </div>
                    </div>
                </div>
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
        <div className="space-y-8">
            {/* Header & Status Bar */}
            <div className="bg-minimal-card p-6 border border-brand-border text-brand-white">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-white text-black text-[10px] font-mono font-bold uppercase tracking-widest border border-brand-white">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>ADMIN_AUTH [OK]</span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-wider flex items-center gap-2">
                            <Terminal className="w-6 h-6 text-brand-silver" />
                            <span>SYS_ADMIN DASHBOARD</span>
                        </h2>
                        <div className="flex items-center gap-2 text-[10px] font-mono uppercase text-brand-silver bg-brand-black p-2 border border-brand-border">
                            <span>ADMIN KEY:</span>
                            <span className="text-brand-white truncate max-w-[200px] sm:max-w-none">
                                {ADMIN_WALLET_ADDRESS}
                            </span>
                            <button
                                type="button"
                                onClick={() => handleCopy(ADMIN_WALLET_ADDRESS, 'admin-wallet')}
                                className="p-1 hover:bg-brand-silver hover:text-black transition-colors cursor-pointer border border-brand-border"
                                title="Copy Admin Wallet"
                            >
                                {copiedKey === 'admin-wallet' ? (
                                    <Check className="w-3 h-3" />
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
                            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-gray hover:bg-brand-silver hover:text-black border border-brand-border text-[10px] font-mono font-bold uppercase tracking-widest transition-colors cursor-pointer"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                            <span>{isLoading ? 'SYNCING...' : 'SYNC TELEMETRY'}</span>
                        </button>
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t border-brand-border flex flex-wrap items-center justify-between gap-3 text-[10px] font-mono uppercase text-brand-silver">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-brand-white animate-pulse" />
                        <span className="font-bold text-brand-white">FEE MODEL:</span>
                        <span>UPFRONT TIERED + GASLESS RELAYER</span>
                    </div>
                    {lastUpdated && (
                        <div>
                            LAST SYNC: {lastUpdated.toLocaleTimeString()}
                        </div>
                    )}
                </div>
            </div>

            {/* 5 High-Impact KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* TVL */}
                <div className="bg-brand-gray p-5 border border-brand-border">
                    <div className="flex items-center justify-between mb-4 border-b border-brand-border pb-2">
                        <span className="text-[10px] font-mono font-bold text-brand-silver uppercase tracking-widest">
                            POOL TVL
                        </span>
                        <TrendingUp className="w-4 h-4 text-brand-silver grayscale" />
                    </div>
                    <div className="text-xl font-bold font-mono text-brand-white flex items-center gap-2">
                        <TonDiamond className="w-4 h-4 grayscale opacity-80" />
                        <span>{metrics ? metrics.tvlTon : '—'}</span>
                        <span className="text-xs text-brand-silver">TON</span>
                    </div>
                    <div className="text-[9px] font-mono uppercase text-brand-silver mt-2">
                        LOCKED LIQUIDITY
                    </div>
                </div>

                {/* Accumulated Treasury Fees */}
                <div className="bg-brand-black p-5 border border-brand-white">
                    <div className="flex items-center justify-between mb-4 border-b border-brand-border pb-2">
                        <span className="text-[10px] font-mono font-bold text-brand-white uppercase tracking-widest">
                            TREASURY FEES
                        </span>
                        <Coins className="w-4 h-4 text-brand-white" />
                    </div>
                    <div className="text-xl font-bold font-mono text-brand-white flex items-center gap-2">
                        <TonDiamond className="w-4 h-4" />
                        <span>{metrics ? metrics.accumulatedFeesTon : '0.00'}</span>
                        <span className="text-xs">TON</span>
                    </div>
                    <div className="text-[9px] font-mono uppercase text-brand-silver mt-2">
                        UNCLAIMED BALANCE
                    </div>
                </div>

                {/* Total Admin Fees Earned */}
                <div className="bg-brand-gray p-5 border border-brand-border">
                    <div className="flex items-center justify-between mb-4 border-b border-brand-border pb-2">
                        <span className="text-[10px] font-mono font-bold text-brand-silver uppercase tracking-widest">
                            TOTAL EARNED
                        </span>
                        <Zap className="w-4 h-4 text-brand-silver grayscale" />
                    </div>
                    <div className="text-xl font-bold font-mono text-brand-white flex items-center gap-2">
                        <TonDiamond className="w-4 h-4 grayscale opacity-80" />
                        <span>{metrics ? metrics.totalAdminFeesTon : '—'}</span>
                        <span className="text-xs text-brand-silver">TON</span>
                    </div>
                    <div className="text-[9px] font-mono uppercase text-brand-silver mt-2">
                        LIFETIME INCOME
                    </div>
                </div>

                {/* Total Privacy Transactions */}
                <div className="bg-brand-gray p-5 border border-brand-border">
                    <div className="flex items-center justify-between mb-4 border-b border-brand-border pb-2">
                        <span className="text-[10px] font-mono font-bold text-brand-silver uppercase tracking-widest">
                            TX VOLUME
                        </span>
                        <Lock className="w-4 h-4 text-brand-silver grayscale" />
                    </div>
                    <div className="text-xl font-bold font-mono text-brand-white flex items-center gap-1.5">
                        <span>{metrics ? metrics.totalDepositsCount : '—'}</span>
                        <span className="text-xs text-brand-silver">DEP</span>
                    </div>
                    <div className="text-[9px] font-mono uppercase text-brand-silver mt-2">
                        {metrics ? metrics.totalWithdrawalsCount : '—'} ZK W/D
                    </div>
                </div>

                {/* Admin Wallet Balance */}
                <div className="bg-brand-gray p-5 border border-brand-border">
                    <div className="flex items-center justify-between mb-4 border-b border-brand-border pb-2">
                        <span className="text-[10px] font-mono font-bold text-brand-silver uppercase tracking-widest">
                            ADMIN WALLET
                        </span>
                        <Wallet className="w-4 h-4 text-brand-silver grayscale" />
                    </div>
                    <div className="text-xl font-bold font-mono text-brand-white flex items-center gap-2">
                        <TonDiamond className="w-4 h-4 grayscale opacity-80" />
                        <span>{metrics ? metrics.adminWalletBalance : '—'}</span>
                        <span className="text-xs text-brand-silver">TON</span>
                    </div>
                    <div className="text-[9px] font-mono uppercase text-brand-silver mt-2">
                        CONNECTED BALANCE
                    </div>
                </div>
            </div>

            {/* Treasury Management & Dynamic Fee Routing Section */}
            <div className="bg-minimal-card p-6 sm:p-8 border border-brand-border space-y-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-brand-border">
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-gray text-brand-white text-[10px] font-mono font-bold uppercase tracking-widest border border-brand-border">
                            <Sliders className="w-3.5 h-3.5" />
                            <span>ROUTING ENGINE</span>
                        </div>
                        <h3 className="text-lg font-bold text-brand-white uppercase tracking-wider">
                            TREASURY CLAIM & RELAYER RESTOCK
                        </h3>
                    </div>

                    {/* Routing Mode Toggle */}
                    <div className="bg-brand-black p-4 border border-brand-border flex flex-col sm:flex-row sm:items-center gap-4 shrink-0">
                        <div>
                            <div className="text-[10px] font-mono font-bold text-brand-white flex items-center gap-2 uppercase">
                                <span>ROUTING:</span>
                                <span className={`px-2 py-1 border ${
                                    metrics?.autoFeeRouting
                                        ? 'bg-brand-white text-black border-brand-white'
                                        : 'bg-brand-gray text-brand-white border-brand-border'
                                }`}>
                                    {metrics?.autoFeeRouting ? 'AUTO-PUSH' : 'PULL/ACCUMULATE'}
                                </span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleToggleRouting}
                            disabled={isToggling}
                            className="px-4 py-2 bg-brand-gray hover:bg-brand-silver hover:text-black text-[10px] font-mono font-bold text-brand-white border border-brand-border transition-colors shrink-0 cursor-pointer flex items-center gap-2 uppercase tracking-widest"
                        >
                            {isToggling ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sliders className="w-3.5 h-3.5" />}
                            <span>SWITCH MODE</span>
                        </button>
                    </div>
                </div>

                {toggleStatus && (
                    <div className="p-4 bg-brand-gray border border-brand-border text-[10px] font-mono uppercase text-brand-white font-bold">
                        {toggleStatus}
                    </div>
                )}

                {/* Claim Fees Interactive Panel */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-[10px] font-mono font-bold text-brand-silver mb-2 uppercase tracking-widest">
                                    [1] CLAIM AMOUNT (TON)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={claimAmount}
                                    onChange={(e) => setClaimAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full bg-brand-black border border-brand-border focus:border-brand-silver rounded-none p-3.5 text-xs text-brand-white font-mono uppercase focus:outline-none transition-colors"
                                />
                                <div className="flex items-center gap-2 mt-3 text-[9px] font-mono uppercase tracking-widest">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const available = Number(metrics?.accumulatedFeesTon || 0);
                                            setClaimAmount((available * 0.5).toFixed(2));
                                        }}
                                        className="bg-brand-gray hover:bg-brand-silver hover:text-black px-2 py-1.5 border border-brand-border text-brand-silver transition-colors"
                                    >
                                        50%
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setClaimAmount(metrics?.accumulatedFeesTon || '0')}
                                        className="bg-brand-gray hover:bg-brand-silver hover:text-black px-2 py-1.5 border border-brand-border text-brand-silver transition-colors"
                                    >
                                        MAX ({metrics?.accumulatedFeesTon || '0'})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setClaimAmount('0.5');
                                            setClaimDestination(ACTIVE_RELAYER_ADDRESS);
                                        }}
                                        className="bg-brand-white text-black hover:bg-brand-silver px-2 py-1.5 border border-brand-white font-bold transition-colors"
                                    >
                                        [RESTOCK] RELAYER (0.5)
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-mono font-bold text-brand-silver mb-2 uppercase tracking-widest">
                                    [2] DESTINATION ADDRESS
                                </label>
                                <input
                                    type="text"
                                    value={claimDestination}
                                    onChange={(e) => setClaimDestination(e.target.value)}
                                    placeholder="TARGET TON WALLET"
                                    className="w-full bg-brand-black border border-brand-border focus:border-brand-silver rounded-none p-3.5 text-xs text-brand-white font-mono uppercase focus:outline-none transition-colors"
                                />
                                <div className="flex items-center gap-2 mt-3 text-[9px] font-mono uppercase tracking-widest">
                                    <button
                                        type="button"
                                        onClick={() => setClaimDestination(ACTIVE_RELAYER_ADDRESS)}
                                        className="text-brand-silver hover:text-brand-white underline underline-offset-2 truncate"
                                    >
                                        USE RELAYER: {ACTIVE_RELAYER_ADDRESS.slice(0, 14)}...
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleClaimFees}
                            disabled={isClaiming || !claimAmount || Number(claimAmount) <= 0 || !claimDestination}
                            className={`w-full py-4 font-mono font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-colors ${
                                isClaiming || !claimAmount || Number(claimAmount) <= 0 || !claimDestination
                                    ? 'bg-brand-offblack text-brand-silver border border-brand-border cursor-not-allowed'
                                    : 'bg-brand-white text-brand-black hover:bg-brand-silver border border-brand-white'
                            }`}
                        >
                            {isClaiming ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Coins className="w-4 h-4" />}
                            <span>EXECUTE CLAIM: {claimAmount || '0'} TON</span>
                        </button>

                        {claimStatus && (
                            <div className="p-4 bg-brand-gray border border-brand-border text-[10px] font-mono uppercase text-brand-white font-bold">
                                {claimStatus}
                            </div>
                        )}
                    </div>

                    {/* Operational Security Safeguard Note */}
                    <div className="bg-brand-black p-5 border border-brand-border space-y-3 font-mono text-[10px] uppercase">
                        <div className="font-bold text-brand-white flex items-center gap-2 border-b border-brand-border pb-2">
                            <ShieldCheck className="w-4 h-4" />
                            <span>MATH SEPARATION</span>
                        </div>
                        <p className="text-brand-silver leading-relaxed pt-1">
                            USER POOL LIQUIDITY IS STRICTLY LOCKED. CLAIM TRANSACTIONS ASSERT REQUEST &lt;= ACCUMULATED FEES.
                        </p>
                        <div className="pt-2 mt-2 border-t border-brand-border space-y-2 text-brand-silver">
                            <div><span className="text-brand-white">CONTRACT:</span> {metrics?.contractAddress.slice(0, 16)}...</div>
                            <div><span className="text-brand-white">RELAYER:</span> {ACTIVE_RELAYER_ADDRESS.slice(0, 16)}...</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Audit Logs: Recent Deposits & Withdrawals */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Deposits */}
                <div className="bg-minimal-card p-6 border border-brand-border space-y-4">
                    <div className="flex items-center justify-between border-b border-brand-border pb-3">
                        <div className="flex items-center gap-2">
                            <ArrowDownLeft className="w-4 h-4 text-brand-silver" />
                            <h3 className="font-bold text-brand-white text-sm uppercase tracking-widest font-mono">DEPOSITS LOG</h3>
                        </div>
                        <span className="text-[10px] font-mono text-brand-silver">
                            [{filteredDeposits.length}]
                        </span>
                    </div>

                    <div className="relative">
                        <Search className="w-3.5 h-3.5 text-brand-silver absolute left-3 top-3.5" />
                        <input
                            type="text"
                            value={depositSearch}
                            onChange={(e) => setDepositSearch(e.target.value)}
                            placeholder="SEARCH HASH OR COMMITMENT..."
                            className="w-full bg-brand-black border border-brand-border rounded-none pl-9 pr-3 py-3 text-[10px] sm:text-xs text-brand-white font-mono uppercase focus:outline-none focus:border-brand-silver"
                        />
                    </div>

                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                        {filteredDeposits.length === 0 ? (
                            <div className="p-6 text-center text-[10px] font-mono text-brand-silver uppercase border border-brand-border border-dashed">
                                NO MATCHES FOUND
                            </div>
                        ) : (
                            filteredDeposits.map((d, i) => (
                                <div
                                    key={i}
                                    className="p-3 bg-brand-gray border border-brand-border hover:border-brand-silver transition-colors text-[9px] sm:text-[10px] font-mono flex items-center justify-between uppercase"
                                >
                                    <div>
                                        <div className="text-brand-white font-bold flex items-center gap-1.5 mb-1">
                                            <TonDiamond className="w-3 h-3 grayscale" />
                                            <span>{d.amount}</span>
                                        </div>
                                        <div className="text-brand-silver truncate max-w-[160px] sm:max-w-[200px]">
                                            C: {d.commitment}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-brand-silver mb-1">{d.time}</div>
                                        <a
                                            href={TX_EXPLORER_URL(d.hash)}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-brand-white hover:underline underline-offset-2 flex items-center gap-1 justify-end font-bold"
                                        >
                                            <span>EXPLORER</span>
                                            <ExternalLink className="w-2.5 h-2.5" />
                                        </a>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Recent Withdrawals */}
                <div className="bg-minimal-card p-6 border border-brand-border space-y-4">
                    <div className="flex items-center justify-between border-b border-brand-border pb-3">
                        <div className="flex items-center gap-2">
                            <ArrowUpRight className="w-4 h-4 text-brand-silver" />
                            <h3 className="font-bold text-brand-white text-sm uppercase tracking-widest font-mono">ZK WITHDRAWALS LOG</h3>
                        </div>
                        <span className="text-[10px] font-mono text-brand-silver">
                            [{filteredWithdrawals.length}]
                        </span>
                    </div>

                    <div className="relative">
                        <Search className="w-3.5 h-3.5 text-brand-silver absolute left-3 top-3.5" />
                        <input
                            type="text"
                            value={withdrawSearch}
                            onChange={(e) => setWithdrawSearch(e.target.value)}
                            placeholder="SEARCH HASH OR DESTINATION..."
                            className="w-full bg-brand-black border border-brand-border rounded-none pl-9 pr-3 py-3 text-[10px] sm:text-xs text-brand-white font-mono uppercase focus:outline-none focus:border-brand-silver"
                        />
                    </div>

                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                        {filteredWithdrawals.length === 0 ? (
                            <div className="p-6 text-center text-[10px] font-mono text-brand-silver uppercase border border-brand-border border-dashed">
                                NO MATCHES FOUND
                            </div>
                        ) : (
                            filteredWithdrawals.map((w, i) => (
                                <div
                                    key={i}
                                    className="p-3 bg-brand-gray border border-brand-border hover:border-brand-silver transition-colors text-[9px] sm:text-[10px] font-mono flex items-center justify-between uppercase"
                                >
                                    <div>
                                        <div className="text-brand-white font-bold flex items-center gap-1.5 mb-1">
                                            <TonDiamond className="w-3 h-3 grayscale" />
                                            <span>{w.amountReceived}</span>
                                        </div>
                                        <div className="text-brand-silver truncate max-w-[160px] sm:max-w-[200px]">
                                            DST: {w.recipient}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-brand-silver mb-1">{w.time}</div>
                                        <a
                                            href={TX_EXPLORER_URL(w.hash)}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-brand-white hover:underline underline-offset-2 flex items-center gap-1 justify-end font-bold"
                                        >
                                            <span>EXPLORER</span>
                                            <ExternalLink className="w-2.5 h-2.5" />
                                        </a>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
