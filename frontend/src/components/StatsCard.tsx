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
import { TonIcon, TonDiamond, GramDiamondMark, MerkleTreeIcon, ZkCircuitIcon } from './TonIcons';

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
        <div className="bg-[#10161F] p-6 sm:p-7 rounded-2xl border border-[#222E3E] text-white space-y-6 shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between border-b border-[#222E3E] pb-4">
                <div className="flex items-center gap-2.5 text-[#94A3B8]">
                    <div className="p-2 rounded-xl bg-[#1C2735] border border-[#2B3B4E]">
                        <Activity className="w-4 h-4 text-[#30A1F5]" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm uppercase tracking-wider text-white">Protocol Live Telemetry</h3>
                        <p className="text-[10px] font-mono text-[#94A3B8]">On-Chain State &amp; Cryptographic Set</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={loadState}
                    disabled={isLoading}
                    className="p-2 rounded-lg border border-[#222E3E] bg-[#141C26] hover:bg-[#1C2735] hover:border-[#30A1F5]/40 text-[#94A3B8] hover:text-white transition-all duration-200 cursor-pointer active:scale-95"
                    title="Refresh on-chain stats"
                >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#30A1F5]' : ''}`} />
                </button>
            </div>

            {/* Metrics Grid with Edged Corners & Crypto Icons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-[#141C26] p-4 rounded-xl border border-[#222E3E] hover:border-[#30A1F5]/40 transition-all duration-200">
                    <div className="text-[10px] font-mono text-[#94A3B8] flex items-center gap-1.5 mb-2 uppercase">
                        <GramDiamondMark className="w-3.5 h-3.5" />
                        <span>Anonymity Set</span>
                    </div>
                    <div className="text-xl sm:text-2xl font-bold font-mono text-white">
                        {state ? state.anonymitySetSize : '—'}
                    </div>
                    <div className="text-[9px] font-mono text-[#64748B] uppercase mt-1">Unspent notes</div>
                </div>

                <div className="bg-[#141C26] p-4 rounded-xl border border-[#222E3E] hover:border-[#30A1F5]/40 transition-all duration-200">
                    <div className="text-[10px] font-mono text-[#94A3B8] flex items-center gap-1.5 mb-2 uppercase">
                        <MerkleTreeIcon className="w-3.5 h-3.5 text-[#30A1F5]" />
                        <span>Total Deposits</span>
                    </div>
                    <div className="text-xl sm:text-2xl font-bold font-mono text-white">
                        {state ? state.totalDeposits : '—'}
                    </div>
                    <div className="text-[9px] font-mono text-[#64748B] uppercase mt-1">Merkle tree leaves</div>
                </div>

                <div className="bg-[#141C26] p-4 rounded-xl border border-[#222E3E] hover:border-[#30A1F5]/40 transition-all duration-200">
                    <div className="text-[10px] font-mono text-[#94A3B8] flex items-center gap-1.5 mb-2 uppercase">
                        <ZkCircuitIcon className="w-3.5 h-3.5 text-[#30A1F5]" />
                        <span>Withdrawals</span>
                    </div>
                    <div className="text-xl sm:text-2xl font-bold font-mono text-white">
                        {state ? state.totalWithdrawals : '—'}
                    </div>
                    <div className="text-[9px] font-mono text-[#64748B] uppercase mt-1">ZK nullifier spends</div>
                </div>

                <div className="bg-[#141C26] p-4 rounded-xl border border-[#222E3E] hover:border-[#30A1F5]/40 transition-all duration-200">
                    <div className="text-[10px] font-mono text-[#94A3B8] flex items-center gap-1.5 mb-2 uppercase">
                        <TonIcon className="w-3.5 h-3.5" />
                        <span>Pool TVL</span>
                    </div>
                    <div className="text-xl sm:text-2xl font-bold font-mono text-white flex items-center gap-1">
                        <span>{state ? `${Number(state.balance).toFixed(2)}` : '—'}</span>
                        <span className="text-xs font-mono text-[#94A3B8] font-normal">TON</span>
                    </div>
                    <div className="text-[9px] font-mono text-[#64748B] uppercase mt-1">Contract Balance</div>
                </div>
            </div>

            {/* Smart contract details footer with Edged Corners */}
            {state && (
                <div className="pt-4 border-t border-[#222E3E] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[10px] text-[#94A3B8] font-mono uppercase">
                    <div className="flex items-center gap-2 truncate p-2.5 rounded-xl bg-[#0B0E14] border border-[#222E3E] shadow-inner">
                        <span className="text-[#64748B]">MIXER CONTRACT:</span>
                        <span className="text-white truncate font-semibold">{state.address}</span>
                        <button
                            type="button"
                            onClick={copyAddress}
                            className="p-1.5 rounded-lg hover:text-white transition-colors cursor-pointer border border-[#222E3E] bg-[#141C26]"
                            title="Copy contract address"
                        >
                            {copiedAddr ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                    </div>

                    <a
                        href={TESTNET_EXPLORER_URL(state.address)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-[#222E3E] bg-[#141C26] hover:bg-[#1C2735] hover:border-[#30A1F5]/40 hover:text-white transition-all duration-200 font-semibold"
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
