'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity,
    Shield,
    Globe,
    Radio,
    Zap,
    ExternalLink,
    Filter,
    RefreshCw,
    Maximize2,
    Layers,
} from 'lucide-react';
import { TonIcon, TonDiamond, GramDiamondMark, ZkCircuitIcon, MerkleTreeIcon, RelayerFuelIcon } from './TonIcons';

interface NodeLocation {
    id: string;
    city: string;
    country: string;
    x: number; // percentage in SVG (0 to 1000)
    y: number; // percentage in SVG (0 to 500)
    type: 'relayer' | 'validator' | 'privacy_hub';
    isBroadcasting?: boolean;
}

interface ActiveHop {
    id: string;
    from: string;
    to: string;
    amount: string;
    fromCoords: [number, number];
    toCoords: [number, number];
    progress: number;
    timestamp: string;
    txHash: string;
    zkStatus: 'PROVING' | 'MERKLE_INSERT' | 'RELAYED';
}

const GLOBAL_NODES: NodeLocation[] = [
    { id: 'fra', city: 'Frankfurt', country: 'DE', x: 505, y: 165, type: 'privacy_hub' },
    { id: 'ams', city: 'Amsterdam', country: 'NL', x: 495, y: 155, type: 'relayer' },
    { id: 'lon', city: 'London', country: 'GB', x: 475, y: 158, type: 'relayer' },
    { id: 'par', city: 'Paris', country: 'FR', x: 485, y: 175, type: 'validator' },
    { id: 'hel', city: 'Helsinki', country: 'FI', x: 545, y: 125, type: 'validator' },
    { id: 'ash', city: 'Ashburn', country: 'US', x: 255, y: 195, type: 'privacy_hub' },
    { id: 'chi', city: 'Chicago', country: 'US', x: 225, y: 185, type: 'relayer' },
    { id: 'sfo', city: 'San Francisco', country: 'US', x: 155, y: 195, type: 'validator' },
    { id: 'sin', city: 'Singapore', country: 'SG', x: 775, y: 315, type: 'relayer' },
    { id: 'tok', city: 'Tokyo', country: 'JP', x: 865, y: 205, type: 'privacy_hub' },
    { id: 'hkg', city: 'Hong Kong', country: 'HK', x: 795, y: 255, type: 'validator' },
    { id: 'syd', city: 'Sydney', country: 'AU', x: 885, y: 415, type: 'validator' },
    { id: 'sao', city: 'São Paulo', country: 'BR', x: 335, y: 385, type: 'relayer' },
];

export function TransactionsMap() {
    const [selectedPoolFilter, setSelectedPoolFilter] = useState<'ALL' | '1' | '10' | '100'>('ALL');
    const [activeHops, setActiveHops] = useState<ActiveHop[]>([]);
    const [selectedNode, setSelectedNode] = useState<NodeLocation | null>(null);
    const [liveFeed, setLiveFeed] = useState<ActiveHop[]>([]);

    // Generate simulated live privacy transactions hopping across global nodes
    useEffect(() => {
        const sampleAmounts = ['1.0 TON', '5.0 TON', '10.0 TON', '25.0 TON', '50.0 TON', '100.0 TON'];
        
        const spawnHop = () => {
            const fromNode = GLOBAL_NODES[Math.floor(Math.random() * GLOBAL_NODES.length)];
            let toNode = GLOBAL_NODES[Math.floor(Math.random() * GLOBAL_NODES.length)];
            while (toNode.id === fromNode.id) {
                toNode = GLOBAL_NODES[Math.floor(Math.random() * GLOBAL_NODES.length)];
            }

            const chosenAmount = sampleAmounts[Math.floor(Math.random() * sampleAmounts.length)];
            const fakeHash = '0x' + Array.from({ length: 8 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

            const newHop: ActiveHop = {
                id: `hop-${Date.now()}-${Math.random()}`,
                from: `${fromNode.city}, ${fromNode.country}`,
                to: `${toNode.city}, ${toNode.country}`,
                amount: chosenAmount,
                fromCoords: [fromNode.x, fromNode.y],
                toCoords: [toNode.x, toNode.y],
                progress: 0,
                timestamp: new Date().toLocaleTimeString(),
                txHash: fakeHash,
                zkStatus: 'RELAYED',
            };

            setActiveHops((prev) => [...prev.slice(-4), newHop]);
            setLiveFeed((prev) => [newHop, ...prev.slice(0, 5)]);
        };

        // Initial hops
        spawnHop();
        spawnHop();

        const interval = setInterval(spawnHop, 3500);
        return () => clearInterval(interval);
    }, []);

    const filteredFeed = liveFeed.filter((item) => {
        if (selectedPoolFilter === 'ALL') return true;
        return item.amount.startsWith(selectedPoolFilter);
    });

    return (
        <div className="bg-[#10161F] rounded-2xl border border-[#222E3E] text-white overflow-hidden shadow-2xl relative transition-all duration-300">
            {/* Top Bar with ton.org Aesthetic */}
            <div className="p-4 sm:p-6 border-b border-[#222E3E] flex flex-wrap items-center justify-between gap-4 bg-[#141C26]/70 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#1C2735] border border-[#2B3B4E] flex items-center justify-center text-[#30A1F5] shadow-inner">
                        <Globe className="w-5 h-5 animate-pulse text-[#30A1F5]" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-sm sm:text-base tracking-wide uppercase font-sans">
                                Global Privacy Network Map
                            </h3>
                            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#30A1F5]/10 border border-[#30A1F5]/30 text-[#30A1F5] text-[9px] font-mono font-bold tracking-wider uppercase">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#30A1F5] animate-ping" />
                                LIVE TELEMETRY
                            </span>
                        </div>
                        <p className="text-[11px] text-[#94A3B8] font-mono mt-0.5">
                            Real-time zero-knowledge mixing relays &amp; on-chain Merkle routing
                        </p>
                    </div>
                </div>

                {/* Filter Chips */}
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 p-1 rounded-xl bg-[#0B0E14] border border-[#222E3E]">
                        {(['ALL', '1', '10', '100'] as const).map((filterVal) => (
                            <button
                                key={filterVal}
                                type="button"
                                onClick={() => setSelectedPoolFilter(filterVal)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold uppercase transition-all duration-200 cursor-pointer ${
                                    selectedPoolFilter === filterVal
                                        ? 'bg-[#30A1F5] text-black shadow-sm font-bold'
                                        : 'text-[#94A3B8] hover:text-white hover:bg-[#1C2735]'
                                }`}
                            >
                                {filterVal === 'ALL' ? 'ALL POOLS' : `${filterVal} TON`}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Interactive Global Mesh Visualization Canvas */}
            <div className="relative w-full aspect-[2/1] min-h-[340px] sm:min-h-[420px] bg-[#0B0E14] overflow-hidden select-none">
                {/* Background Grid Pattern & Ambient Radial Glow */}
                <div className="absolute inset-0 bg-[radial-gradient(#1EAEFB_1px,transparent_1px)] [background-size:24px_24px] opacity-15" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#30A1F5]/10 rounded-full blur-3xl pointer-events-none" />

                <svg
                    viewBox="0 0 1000 500"
                    className="w-full h-full object-contain relative z-10"
                >
                    <defs>
                        <linearGradient id="hopGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#30A1F5" stopOpacity="0.8" />
                            <stop offset="50%" stopColor="#00E5FF" stopOpacity="1" />
                            <stop offset="100%" stopColor="#10B981" stopOpacity="0.8" />
                        </linearGradient>

                        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="4" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                    </defs>

                    {/* Simplified Continents Silhouette Contours */}
                    <g opacity="0.12" fill="#38BDF8">
                        {/* North America */}
                        <path d="M120 110 Q180 80 260 110 Q310 140 280 230 Q230 260 170 200 Z" />
                        {/* South America */}
                        <path d="M290 290 Q340 310 330 420 Q290 450 270 360 Z" />
                        {/* Europe */}
                        <path d="M460 110 Q540 100 560 180 Q500 210 450 160 Z" />
                        {/* Africa */}
                        <path d="M480 220 Q560 230 550 360 Q480 380 460 280 Z" />
                        {/* Asia */}
                        <path d="M600 100 Q830 110 850 250 Q750 310 620 220 Z" />
                        {/* Australia */}
                        <path d="M820 340 Q910 330 900 420 Q830 430 810 370 Z" />
                    </g>

                    {/* Active Transaction Arcs */}
                    {activeHops.map((hop) => {
                        const [x1, y1] = hop.fromCoords;
                        const [x2, y2] = hop.toCoords;
                        const midX = (x1 + x2) / 2;
                        const midY = Math.min(y1, y2) - Math.abs(x1 - x2) * 0.2;

                        const pathD = `M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`;

                        return (
                            <g key={hop.id}>
                                {/* Trail path */}
                                <path
                                    d={pathD}
                                    fill="none"
                                    stroke="url(#hopGradient)"
                                    strokeWidth="1.8"
                                    strokeDasharray="6,4"
                                    className="animate-[dash_1.5s_linear_infinite]"
                                    filter="url(#glow)"
                                />

                                {/* Moving Beacon Dot along the curve */}
                                <circle
                                    r="3.5"
                                    fill="#FFFFFF"
                                    filter="url(#glow)"
                                >
                                    <animateMotion
                                        path={pathD}
                                        dur="2.5s"
                                        repeatCount="indefinite"
                                    />
                                </circle>
                            </g>
                        );
                    })}

                    {/* Global Nodes */}
                    {GLOBAL_NODES.map((node) => {
                        const isHovered = selectedNode?.id === node.id;
                        return (
                            <g
                                key={node.id}
                                transform={`translate(${node.x}, ${node.y})`}
                                className="cursor-pointer group"
                                onClick={() => setSelectedNode(node)}
                            >
                                {/* Ripple pulse */}
                                <circle
                                    r={node.type === 'privacy_hub' ? '12' : '8'}
                                    fill={node.type === 'privacy_hub' ? '#30A1F5' : '#00E5FF'}
                                    fillOpacity="0.2"
                                    className="animate-ping"
                                />

                                {/* Center Core Node */}
                                <circle
                                    r={node.type === 'privacy_hub' ? '5.5' : '4'}
                                    fill={node.type === 'privacy_hub' ? '#30A1F5' : '#FFFFFF'}
                                    stroke="#10161F"
                                    strokeWidth="1.5"
                                />

                                {/* Node Label */}
                                <text
                                    y="-10"
                                    textAnchor="middle"
                                    fill={isHovered ? '#FFFFFF' : '#94A3B8'}
                                    fontSize="10"
                                    fontFamily="monospace"
                                    className="opacity-70 group-hover:opacity-100 transition-opacity font-bold uppercase select-none"
                                >
                                    {node.city}
                                </text>
                            </g>
                        );
                    })}
                </svg>

                {/* Node Detail Floating Card */}
                {selectedNode && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute bottom-4 left-4 p-3.5 rounded-xl bg-[#141C26]/95 border border-[#30A1F5]/40 backdrop-blur-md text-white font-mono text-[10px] space-y-1.5 shadow-2xl z-20 max-w-xs"
                    >
                        <div className="flex items-center justify-between border-b border-[#222E3E] pb-1.5">
                            <span className="font-bold text-[#30A1F5] flex items-center gap-1.5">
                                <Radio className="w-3.5 h-3.5 animate-pulse" />
                                {selectedNode.city.toUpperCase()} NODE
                            </span>
                            <button
                                type="button"
                                onClick={() => setSelectedNode(null)}
                                className="text-[#94A3B8] hover:text-white"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="flex justify-between text-[#94A3B8]">
                            <span>TYPE:</span>
                            <span className="text-white font-bold">{selectedNode.type.toUpperCase()}</span>
                        </div>
                        <div className="flex justify-between text-[#94A3B8]">
                            <span>STATUS:</span>
                            <span className="text-emerald-400 font-bold">100% OPERATIONAL</span>
                        </div>
                        <div className="flex justify-between text-[#94A3B8]">
                            <span>MERKLE SYNC:</span>
                            <span className="text-white">BLOCK #4298104</span>
                        </div>
                    </motion.div>
                )}

                {/* Live Floating Telemetry Overlay (ton.org metric pills) */}
                <div className="absolute top-4 right-4 hidden sm:flex flex-col gap-2 z-20">
                    <div className="px-3 py-1.5 rounded-xl bg-[#141C26]/90 border border-[#222E3E] backdrop-blur-md text-[10px] font-mono flex items-center gap-2 shadow-lg">
                        <TonIcon className="w-3.5 h-3.5" />
                        <span className="text-[#94A3B8]">RELAYERS:</span>
                        <span className="font-bold text-white">18 ACTIVE</span>
                    </div>

                    <div className="px-3 py-1.5 rounded-xl bg-[#141C26]/90 border border-[#222E3E] backdrop-blur-md text-[10px] font-mono flex items-center gap-2 shadow-lg">
                        <ZkCircuitIcon className="w-3.5 h-3.5" />
                        <span className="text-[#94A3B8]">PROOF LATENCY:</span>
                        <span className="font-bold text-emerald-400">&lt; 420 MS</span>
                    </div>
                </div>
            </div>

            {/* Bottom Live Transaction Activity Feed */}
            <div className="p-4 sm:p-5 border-t border-[#222E3E] bg-[#141C26]/90">
                <div className="flex items-center justify-between mb-3 text-[11px] font-mono uppercase text-[#94A3B8]">
                    <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-[#30A1F5]" />
                        <span className="text-white font-bold tracking-wider">Live Anonymized Transaction Route Activity</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        ZERO KNOWLEDGE LINK PROVEN
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {filteredFeed.slice(0, 3).map((tx) => (
                        <div
                            key={tx.id}
                            className="p-3 rounded-xl bg-[#0B0E14] border border-[#222E3E] hover:border-[#30A1F5]/50 transition-all duration-200 text-[10px] font-mono space-y-1.5 shadow-sm"
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-white flex items-center gap-1.5">
                                    <TonDiamond className="w-3 h-3" />
                                    {tx.amount}
                                </span>
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
                                    GROTH16 OK
                                </span>
                            </div>
                            <div className="text-[#94A3B8] truncate flex items-center gap-1">
                                <span>ROUTE:</span>
                                <span className="text-white">{tx.from} &rarr; {tx.to}</span>
                            </div>
                            <div className="flex items-center justify-between text-[9px] text-[#64748B] pt-0.5">
                                <span>TX: {tx.txHash}</span>
                                <span>{tx.timestamp}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
