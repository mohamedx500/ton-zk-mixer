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
import { TonIcon, TonDiamond, GramIcon, MerkleTreeIcon, ZkCircuitIcon } from './TonIcons';

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
        <div className="bg-minimal-card p-6 sm:p-7 rounded-2xl border border-brand-border text-brand-white space-y-6 shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between border-b border-brand-border pb-4">
                <div className="flex items-center gap-2.5 text-brand-silver">
                    <div className="p-1.5 rounded-lg bg-brand-gray border border-brand-border">
                        <Activity className="w-4 h-4 text-brand-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm uppercase tracking-wider text-brand-white">Protocol Live Telemetry</h3>
                        <p className="text-[10px] font-mono text-brand-silver">On-Chain State &amp; Cryptographic Set</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={loadState}
                    disabled={isLoading}
                    className="p-2 rounded-lg border border-brand-border bg-brand-offblack hover:bg-brand-gray hover:border-brand-silver text-brand-silver hover:text-white transition-all duration-200 cursor-pointer active:scale-95"
                    title="Refresh on-chain stats"
                >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-brand-white' : ''}`} />
                </button>
            </div>

            {/* Metrics Grid with Edged Corners & Crypto Icons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-brand-gray/80 p-4 rounded-xl border border-brand-border hover:border-brand-silver/50 transition-all duration-200">
                    <div className="text-[10px] font-mono text-brand-silver flex items-center gap-1.5 mb-2 uppercase">
                        <GramIcon className="w-3.5 h-3.5" />
                        <span>Anonymity Set</span>
                    </div>
                    <div className="text-xl sm:text-2xl font-bold font-mono text-brand-white">
                        {state ? state.anonymitySetSize : '—'}
                    </div>
                    <div className="text-[9px] font-mono text-brand-silver/80 uppercase mt-1">Unspent notes</div>
                </div>

                <div className="bg-brand-gray/80 p-4 rounded-xl border border-brand-border hover:border-brand-silver/50 transition-all duration-200">
                    <div className="text-[10px] font-mono text-brand-silver flex items-center gap-1.5 mb-2 uppercase">
                        <MerkleTreeIcon className="w-3.5 h-3.5" />
                        <span>Total Deposits</span>
                    </div>
                    <div className="text-xl sm:text-2xl font-bold font-mono text-brand-white">
                        {state ? state.totalDeposits : '—'}
                    </div>
                    <div className="text-[9px] font-mono text-brand-silver/80 uppercase mt-1">Merkle tree leaves</div>
                </div>

                <div className="bg-brand-gray/80 p-4 rounded-xl border border-brand-border hover:border-brand-silver/50 transition-all duration-200">
                    <div className="text-[10px] font-mono text-brand-silver flex items-center gap-1.5 mb-2 uppercase">
                        <ZkCircuitIcon className="w-3.5 h-3.5" />
                        <span>Withdrawals</span>
                    </div>
                    <div className="text-xl sm:text-2xl font-bold font-mono text-brand-white">
                        {state ? state.totalWithdrawals : '—'}
                    </div>
                    <div className="text-[9px] font-mono text-brand-silver/80 uppercase mt-1">ZK nullifier spends</div>
                </div>

                <div className="bg-brand-gray/80 p-4 rounded-xl border border-brand-border hover:border-brand-silver/50 transition-all duration-200">
                    <div className="text-[10px] font-mono text-brand-silver flex items-center gap-1.5 mb-2 uppercase">
                        <TonIcon className="w-3.5 h-3.5" />
                        <span>Pool TVL</span>
                    </div>
                    <div className="text-xl sm:text-2xl font-bold font-mono text-brand-white flex items-center gap-1">
                        <span>{state ? `${Number(state.balance).toFixed(2)}` : '—'}</span>
                        <span className="text-xs font-mono text-brand-silver font-normal">TON</span>
                    </div>
                    <div className="text-[9px] font-mono text-brand-silver/80 uppercase mt-1">Contract Balance</div>
                </div>
            </div>

            {/* Smart contract details footer with Edged Corners */}
            {state && (
                <div className="pt-4 border-t border-brand-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[10px] text-brand-silver font-mono uppercase">
                    <div className="flex items-center gap-2 truncate p-2.5 rounded-xl bg-brand-black border border-brand-border shadow-inner">
                        <span className="opacity-50">MIXER CONTRACT:</span>
                        <span className="text-brand-white truncate font-semibold">{state.address}</span>
                        <button
                            type="button"
                            onClick={copyAddress}
                            className="p-1.5 rounded-lg hover:text-brand-white transition-colors cursor-pointer border border-brand-border bg-brand-gray"
                            title="Copy contract address"
                        >
                            {copiedAddr ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                    </div>

                    <a
                        href={TESTNET_EXPLORER_URL(state.address)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-brand-border bg-brand-gray hover:bg-brand-silver hover:text-black transition-all duration-200 font-semibold"
                    >
                        <TonDiamond className="w-3.5 h-3.5" />
                        <span>TONSCAN EXPLORER</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                </div>
            )}
        </div>
    );
}
