'use client';

import React, { useEffect, useState } from 'react';
import {
    Activity,
    Layers,
    Shield,
    Users,
    RefreshCw,
    ExternalLink,
    Copy,
    Check,
} from 'lucide-react';
import { fetchMixerState, MixerProtocolState } from '../lib/ton';
import { TESTNET_EXPLORER_URL } from '../lib/contracts';

export function StatsCard() {
    const [state, setState] = useState<MixerProtocolState | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [copiedAddr, setCopiedAddr] = useState(false);

    const loadState = async () => {
        setIsLoading(true);
        try {
            const data = await fetchMixerState();
            setState(data);
        } catch (e) {
            console.error('Failed to fetch mixer stats:', e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadState();
        const interval = setInterval(loadState, 15000);
        return () => clearInterval(interval);
    }, []);

    const copyAddress = async () => {
        if (!state) return;
        await navigator.clipboard.writeText(state.address);
        setCopiedAddr(true);
        setTimeout(() => setCopiedAddr(false), 2000);
    };

    return (
        <div className="bg-glass-card rounded-2xl p-6 border border-white/10 space-y-5">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-cyan-400" />
                    <h3 className="font-bold text-base text-white">Privacy Pool Metrics</h3>
                </div>
                <button
                    type="button"
                    onClick={loadState}
                    disabled={isLoading}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all cursor-pointer"
                    title="Refresh on-chain stats"
                >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
                </button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-glass-inner p-3.5 rounded-xl border border-white/5">
                    <div className="text-xs text-gray-400 flex items-center gap-1.5 mb-1">
                        <Users className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Anonymity Set</span>
                    </div>
                    <div className="text-xl font-extrabold text-white">
                        {state ? state.anonymitySetSize : '—'}
                    </div>
                    <div className="text-[10px] text-gray-500">Unspent notes in pool</div>
                </div>

                <div className="bg-glass-inner p-3.5 rounded-xl border border-white/5">
                    <div className="text-xs text-gray-400 flex items-center gap-1.5 mb-1">
                        <Layers className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Total Deposits</span>
                    </div>
                    <div className="text-xl font-extrabold text-white">
                        {state ? state.totalDeposits : '—'}
                    </div>
                    <div className="text-[10px] text-gray-500">All-time commitments</div>
                </div>

                <div className="bg-glass-inner p-3.5 rounded-xl border border-white/5">
                    <div className="text-xs text-gray-400 flex items-center gap-1.5 mb-1">
                        <Shield className="w-3.5 h-3.5 text-teal-400" />
                        <span>Withdrawals</span>
                    </div>
                    <div className="text-xl font-extrabold text-white">
                        {state ? state.totalWithdrawals : '—'}
                    </div>
                    <div className="text-[10px] text-gray-500">Verified ZK payouts</div>
                </div>

                <div className="bg-glass-inner p-3.5 rounded-xl border border-white/5">
                    <div className="text-xs text-gray-400 flex items-center gap-1.5 mb-1">
                        <Activity className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Pool TVL</span>
                    </div>
                    <div className="text-xl font-extrabold text-white">
                        {state ? `${Number(state.balance).toFixed(2)}` : '—'} <span className="text-xs text-cyan-400 font-normal">TON</span>
                    </div>
                    <div className="text-[10px] text-gray-500">Contract balance</div>
                </div>
            </div>

            {/* Smart contract details footer */}
            {state && (
                <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-gray-400 font-mono">
                    <div className="flex items-center gap-2 truncate">
                        <span className="text-gray-500">Contract:</span>
                        <span className="text-gray-300 truncate">{state.address}</span>
                        <button
                            type="button"
                            onClick={copyAddress}
                            className="p-1 hover:text-white transition-colors cursor-pointer"
                            title="Copy contract address"
                        >
                            {copiedAddr ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                    </div>

                    <a
                        href={TESTNET_EXPLORER_URL(state.address)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                        <span>TonScan Explorer</span>
                        <ExternalLink className="w-3 h-3" />
                    </a>
                </div>
            )}
        </div>
    );
}
