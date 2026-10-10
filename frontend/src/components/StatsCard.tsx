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
import { TonDiamond } from './TonIcons';

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
        <div className="bg-minimal-card p-6 border border-brand-border text-brand-white space-y-6">
            <div className="flex items-center justify-between border-b border-brand-border pb-4">
                <div className="flex items-center gap-2 text-brand-silver">
                    <Activity className="w-5 h-5" />
                    <h3 className="font-bold text-sm uppercase tracking-widest text-brand-white">Protocol Metrics</h3>
                </div>
                <button
                    type="button"
                    onClick={loadState}
                    disabled={isLoading}
                    className="p-1.5 border border-brand-border bg-brand-offblack hover:bg-brand-silver hover:text-black text-brand-silver transition-colors cursor-pointer"
                    title="Refresh on-chain stats"
                >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-brand-white' : ''}`} />
                </button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-brand-gray p-4 border border-brand-border">
                    <div className="text-[10px] font-mono text-brand-silver flex items-center gap-2 mb-2 uppercase">
                        <Users className="w-3.5 h-3.5 grayscale opacity-70" />
                        <span>Anonymity Set</span>
                    </div>
                    <div className="text-xl font-bold font-mono text-brand-white">
                        {state ? state.anonymitySetSize : '—'}
                    </div>
                    <div className="text-[9px] font-mono text-brand-silver uppercase mt-1">Unspent notes</div>
                </div>

                <div className="bg-brand-gray p-4 border border-brand-border">
                    <div className="text-[10px] font-mono text-brand-silver flex items-center gap-2 mb-2 uppercase">
                        <Layers className="w-3.5 h-3.5 grayscale opacity-70" />
                        <span>Total Deposits</span>
                    </div>
                    <div className="text-xl font-bold font-mono text-brand-white">
                        {state ? state.totalDeposits : '—'}
                    </div>
                    <div className="text-[9px] font-mono text-brand-silver uppercase mt-1">All-time pool Tx</div>
                </div>

                <div className="bg-brand-gray p-4 border border-brand-border">
                    <div className="text-[10px] font-mono text-brand-silver flex items-center gap-2 mb-2 uppercase">
                        <Shield className="w-3.5 h-3.5 grayscale opacity-70" />
                        <span>Withdrawals</span>
                    </div>
                    <div className="text-xl font-bold font-mono text-brand-white">
                        {state ? state.totalWithdrawals : '—'}
                    </div>
                    <div className="text-[9px] font-mono text-brand-silver uppercase mt-1">Verified ZK payouts</div>
                </div>

                <div className="bg-brand-gray p-4 border border-brand-border">
                    <div className="text-[10px] font-mono text-brand-silver flex items-center gap-2 mb-2 uppercase">
                        <Activity className="w-3.5 h-3.5 grayscale opacity-70" />
                        <span>Pool TVL</span>
                    </div>
                    <div className="text-xl font-bold font-mono text-brand-white flex items-center gap-1">
                        <TonDiamond className="w-4 h-4 grayscale opacity-80" />
                        <span>{state ? `${Number(state.balance).toFixed(2)}` : '—'}</span>
                        <span className="text-xs font-mono text-brand-silver">TON</span>
                    </div>
                    <div className="text-[9px] font-mono text-brand-silver uppercase mt-1">Contract Balance</div>
                </div>
            </div>

            {/* Smart contract details footer */}
            {state && (
                <div className="pt-4 border-t border-brand-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[10px] text-brand-silver font-mono uppercase">
                    <div className="flex items-center gap-2 truncate p-2 bg-brand-black border border-brand-border">
                        <span className="opacity-50">CONTRACT:</span>
                        <span className="text-brand-white truncate">{state.address}</span>
                        <button
                            type="button"
                            onClick={copyAddress}
                            className="p-1 hover:text-brand-white transition-colors cursor-pointer border border-brand-border bg-brand-gray"
                            title="Copy contract address"
                        >
                            {copiedAddr ? <Check className="w-3.5 h-3.5 text-brand-white" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                    </div>

                    <a
                        href={TESTNET_EXPLORER_URL(state.address)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2 border border-brand-border bg-brand-gray hover:bg-brand-silver hover:text-black transition-colors"
                    >
                        <span>TONSCAN EXPLORER</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                </div>
            )}
        </div>
    );
}
