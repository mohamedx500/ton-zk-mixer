'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
    Activity,
    Globe,
    Radio,
    Zap,
    ExternalLink,
    RefreshCw,
    ShieldCheck,
    CheckCircle2,
} from 'lucide-react';
import { TonIcon, TonDiamond, GramDiamondMark, MerkleTreeIcon, RelayerFuelIcon } from './TonIcons';

interface GlobalHub {
    id: string;
    city: string;
    country: string;
    lat: number;
    lon: number;
    type: 'relayer' | 'hub' | 'validator';
}

const HUBS: GlobalHub[] = [
    { id: 'fra', city: 'Frankfurt', country: 'DE', lat: 50.11, lon: 8.68, type: 'hub' },
    { id: 'ams', city: 'Amsterdam', country: 'NL', lat: 52.37, lon: 4.89, type: 'relayer' },
    { id: 'lon', city: 'London', country: 'GB', lat: 51.51, lon: -0.12, type: 'relayer' },
    { id: 'ash', city: 'Ashburn', country: 'US', lat: 39.04, lon: -77.49, type: 'hub' },
    { id: 'sfo', city: 'San Francisco', country: 'US', lat: 37.77, lon: -122.42, type: 'validator' },
    { id: 'sin', city: 'Singapore', country: 'SG', lat: 1.35, lon: 103.82, type: 'relayer' },
    { id: 'tok', city: 'Tokyo', country: 'JP', lat: 35.68, lon: 139.69, type: 'hub' },
    { id: 'syd', city: 'Sydney', country: 'AU', lat: -33.87, lon: 151.21, type: 'validator' },
    { id: 'sao', city: 'São Paulo', country: 'BR', lat: -23.55, lon: -46.63, type: 'relayer' },
];

interface LiveTx {
    id: string;
    fromCity: string;
    toCity: string;
    amount: string;
    txHash: string;
    time: string;
    status: 'GROTH16 VERIFIED' | 'RELAYED';
}

export function TransactionsMap() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [rotationY, setRotationY] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartX, setDragStartX] = useState(0);
    const [hoveredHub, setHoveredHub] = useState<GlobalHub | null>(null);
    const [activeHop, setActiveHop] = useState<{ from: GlobalHub; to: GlobalHub; t: number }>({
        from: HUBS[0],
        to: HUBS[3],
        t: 0,
    });

    const [liveTxs, setLiveTxs] = useState<LiveTx[]>([
        {
            id: 'tx-1',
            fromCity: 'Ashburn, US',
            toCity: 'Frankfurt, DE',
            amount: '10.0 TON',
            txHash: '0x8f2a...c391',
            time: 'Just now',
            status: 'GROTH16 VERIFIED',
        },
        {
            id: 'tx-2',
            fromCity: 'London, GB',
            toCity: 'Singapore, SG',
            amount: '1.0 TON',
            txHash: '0x3e19...b842',
            time: '12s ago',
            status: 'GROTH16 VERIFIED',
        },
        {
            id: 'tx-3',
            fromCity: 'Tokyo, JP',
            toCity: 'Amsterdam, NL',
            amount: '100.0 TON',
            txHash: '0xaa40...1f09',
            time: '28s ago',
            status: 'GROTH16 VERIFIED',
        },
    ]);

    // Canvas 3D Interactive Globe Animation
    useEffect(() => {
        let animId: number;
        let currentRot = rotationY;
        let hopProgress = 0;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Generate globe surface dots
        const dots: { lat: number; lon: number }[] = [];
        const numLat = 24;
        const numLon = 48;
        for (let i = 0; i < numLat; i++) {
            const lat = ((i / (numLat - 1)) * 180 - 90) * (Math.PI / 180);
            const rLat = Math.cos(lat);
            const count = Math.max(8, Math.floor(numLon * rLat));
            for (let j = 0; j < count; j++) {
                const lon = ((j / count) * 360 - 180) * (Math.PI / 180);
                dots.push({ lat, lon });
            }
        }

        const render = () => {
            const width = canvas.width;
            const height = canvas.height;
            const cx = width / 2;
            const cy = height / 2;
            const R = Math.min(width, height) * 0.38;

            ctx.clearRect(0, 0, width, height);

            // Auto-rotate if not dragging
            if (!isDragging) {
                currentRot += 0.005;
            }

            const tilt = 0.28; // X-axis tilt (radians)

            const project = (lat: number, lon: number, radius = R) => {
                const rotLon = lon + currentRot;
                const x0 = radius * Math.cos(lat) * Math.sin(rotLon);
                const y0 = radius * Math.sin(lat);
                const z0 = radius * Math.cos(lat) * Math.cos(rotLon);

                // Rotate around X tilt
                const y1 = y0 * Math.cos(tilt) - z0 * Math.sin(tilt);
                const z1 = y0 * Math.sin(tilt) + z0 * Math.cos(tilt);

                return {
                    x: cx + x0,
                    y: cy - y1,
                    z: z1,
                };
            };

            // 1. Draw Globe Silhouette & Ambient Atmosphere
            const glowGrad = ctx.createRadialGradient(cx, cy, R * 0.7, cx, cy, R * 1.08);
            glowGrad.addColorStop(0, 'rgba(48, 161, 245, 0.08)');
            glowGrad.addColorStop(0.85, 'rgba(48, 161, 245, 0.18)');
            glowGrad.addColorStop(1, 'rgba(48, 161, 245, 0)');
            ctx.fillStyle = glowGrad;
            ctx.beginPath();
            ctx.arc(cx, cy, R * 1.08, 0, Math.PI * 2);
            ctx.fill();

            // Globe Base Disc
            ctx.fillStyle = '#080D14';
            ctx.beginPath();
            ctx.arc(cx, cy, R, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#1E293B';
            ctx.lineWidth = 1;
            ctx.stroke();

            // 2. Render Latitude/Longitude Matrix Dots
            dots.forEach((dot) => {
                const p = project(dot.lat, dot.lon);
                if (p.z > 0) {
                    const alpha = (p.z / R) * 0.55;
                    ctx.fillStyle = `rgba(48, 161, 245, ${alpha.toFixed(2)})`;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 1.2, 0, Math.PI * 2);
                    ctx.fill();
                }
            });

            // 3. Render Connecting Privacy Arcs
            hopProgress = (hopProgress + 0.012) % 1;
            const fromP = project((activeHop.from.lat * Math.PI) / 180, (activeHop.from.lon * Math.PI) / 180);
            const toP = project((activeHop.to.lat * Math.PI) / 180, (activeHop.to.lon * Math.PI) / 180);

            if (fromP.z > -R * 0.2 || toP.z > -R * 0.2) {
                // Midpoint raised arc
                const midLat = ((activeHop.from.lat + activeHop.to.lat) / 2) * (Math.PI / 180);
                const midLon = ((activeHop.from.lon + activeHop.to.lon) / 2) * (Math.PI / 180);
                const midP = project(midLat, midLon, R * 1.35);

                // Arc line
                ctx.beginPath();
                ctx.moveTo(fromP.x, fromP.y);
                ctx.quadraticCurveTo(midP.x, midP.y, toP.x, toP.y);
                ctx.strokeStyle = 'rgba(48, 161, 245, 0.4)';
                ctx.lineWidth = 1.5;
                ctx.setLineDash([4, 4]);
                ctx.stroke();
                ctx.setLineDash([]);

                // Traveling pulse particle
                const qx = (1 - hopProgress) * (1 - hopProgress) * fromP.x + 2 * (1 - hopProgress) * hopProgress * midP.x + hopProgress * hopProgress * toP.x;
                const qy = (1 - hopProgress) * (1 - hopProgress) * fromP.y + 2 * (1 - hopProgress) * hopProgress * midP.y + hopProgress * hopProgress * toP.y;

                ctx.fillStyle = '#FFFFFF';
                ctx.shadowColor = '#30A1F5';
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.arc(qx, qy, 3.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            }

            // 4. Render Global Privacy Hub Nodes
            HUBS.forEach((hub) => {
                const p = project((hub.lat * Math.PI) / 180, (hub.lon * Math.PI) / 180);
                if (p.z > 0) {
                    const isHubActive = hub.id === activeHop.from.id || hub.id === activeHop.to.id;

                    // Pulse ring
                    ctx.strokeStyle = isHubActive ? '#10B981' : '#30A1F5';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, isHubActive ? 7 : 5, 0, Math.PI * 2);
                    ctx.stroke();

                    // Core point
                    ctx.fillStyle = isHubActive ? '#FFFFFF' : '#30A1F5';
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, isHubActive ? 3.5 : 2.5, 0, Math.PI * 2);
                    ctx.fill();

                    // City label with clean offset
                    ctx.font = '9px monospace';
                    ctx.fillStyle = isHubActive ? '#FFFFFF' : '#94A3B8';
                    ctx.textAlign = 'center';
                    ctx.fillText(hub.city.toUpperCase(), p.x, p.y - 8);
                }
            });

            animId = requestAnimationFrame(render);
        };

        render();

        return () => {
            cancelAnimationFrame(animId);
        };
    }, [isDragging, activeHop]);

    // Periodically switch active hop for real-time visualization
    useEffect(() => {
        const interval = setInterval(() => {
            const f = HUBS[Math.floor(Math.random() * HUBS.length)];
            let t = HUBS[Math.floor(Math.random() * HUBS.length)];
            while (t.id === f.id) {
                t = HUBS[Math.floor(Math.random() * HUBS.length)];
            }
            setActiveHop({ from: f, to: t, t: 0 });

            // Push to live feed
            const amounts = ['1.0 TON', '5.0 TON', '10.0 TON', '25.0 TON', '100.0 TON'];
            const newTx: LiveTx = {
                id: `tx-${Date.now()}`,
                fromCity: `${f.city}, ${f.country}`,
                toCity: `${t.city}, ${t.country}`,
                amount: amounts[Math.floor(Math.random() * amounts.length)],
                txHash: '0x' + Array.from({ length: 8 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
                time: 'Just now',
                status: 'GROTH16 VERIFIED',
            };
            setLiveTxs((prev) => [newTx, ...prev.slice(0, 3)]);
        }, 4000);

        return () => clearInterval(interval);
    }, []);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setDragStartX(e.clientX);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        const dx = e.clientX - dragStartX;
        setRotationY((prev) => prev + dx * 0.005);
        setDragStartX(e.clientX);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    return (
        <div className="bg-[#10161F] rounded-2xl border border-[#222E3E] text-white overflow-hidden shadow-2xl relative transition-all duration-300">
            {/* Header styled in ton.org aesthetic */}
            <div className="p-5 sm:p-6 border-b border-[#222E3E] flex flex-wrap items-center justify-between gap-4 bg-[#141C26]/70 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#1C2735] border border-[#2B3B4E] flex items-center justify-center text-[#30A1F5] shadow-inner">
                        <Globe className="w-5 h-5 text-[#30A1F5] animate-pulse" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-base tracking-wide text-white font-sans">
                                Global Privacy Relay Mesh
                            </h3>
                            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#30A1F5]/10 border border-[#30A1F5]/30 text-[#30A1F5] text-[9px] font-mono font-bold tracking-wider uppercase">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#30A1F5] animate-ping" />
                                3D LIVE ORBIT
                            </span>
                        </div>
                        <p className="text-[11px] text-[#94A3B8] font-mono mt-0.5">
                            Decentralized zero-knowledge mixing hops across global validator nodes
                        </p>
                    </div>
                </div>

                {/* Telemetry Pills */}
                <div className="flex items-center gap-2 text-[10px] font-mono">
                    <div className="px-3 py-1.5 rounded-xl bg-[#0B0E14] border border-[#222E3E] flex items-center gap-2 text-[#94A3B8]">
                        <TonIcon className="w-3.5 h-3.5" />
                        <span>NODES:</span>
                        <span className="font-bold text-white">757 ACTIVE</span>
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-[#0B0E14] border border-[#222E3E] flex items-center gap-2 text-[#94A3B8]">
                        <RelayerFuelIcon className="w-3.5 h-3.5 text-emerald-400" />
                        <span>RELAYERS:</span>
                        <span className="font-bold text-emerald-400">18 ONLINE</span>
                    </div>
                </div>
            </div>

            {/* 3D Interactive Canvas Globe Container */}
            <div
                className="relative w-full aspect-[2/1] min-h-[360px] sm:min-h-[440px] bg-[#080B10] flex items-center justify-center cursor-grab active:cursor-grabbing select-none overflow-hidden"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                {/* 3D Canvas */}
                <canvas
                    ref={canvasRef}
                    width={900}
                    height={460}
                    className="w-full h-full max-w-4xl max-h-[460px] object-contain"
                />

                {/* Subtle Interactive Instruction */}
                <div className="absolute bottom-3 left-4 px-2.5 py-1 rounded-lg bg-[#141C26]/80 border border-white/5 backdrop-blur-md text-[9px] font-mono text-[#64748B] pointer-events-none">
                    CLICK &amp; DRAG TO ROTATE 3D GLOBE
                </div>

                {/* Current Active Hop Banner */}
                <div className="absolute top-4 left-4 p-3 rounded-xl bg-[#141C26]/90 border border-white/10 backdrop-blur-md text-[10px] font-mono shadow-xl pointer-events-none">
                    <div className="text-[#64748B] text-[9px] uppercase">ACTIVE ZK HOP:</div>
                    <div className="font-bold text-white flex items-center gap-2 mt-0.5">
                        <span className="text-[#30A1F5]">{activeHop.from.city}</span>
                        <span className="text-[#64748B]">&rarr;</span>
                        <span className="text-emerald-400">{activeHop.to.city}</span>
                    </div>
                </div>
            </div>

            {/* Live Verified ZK Transactions Feed */}
            <div className="p-5 border-t border-[#222E3E] bg-[#141C26]/90">
                <div className="flex items-center justify-between mb-3 text-[11px] font-mono uppercase text-[#94A3B8]">
                    <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-[#30A1F5]" />
                        <span className="text-white font-bold tracking-wider">Live Anonymized Transaction Activity</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-bold">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        DOUBLE-SPEND IMMUNITY VERIFIED
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {liveTxs.map((tx) => (
                        <div
                            key={tx.id}
                            className="p-3.5 rounded-xl bg-[#0B0E14] border border-[#222E3E] hover:border-[#30A1F5]/40 transition-all duration-200 text-[10px] font-mono space-y-2 shadow-sm"
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-white flex items-center gap-1.5 text-xs">
                                    <TonIcon className="w-3.5 h-3.5" />
                                    {tx.amount}
                                </span>
                                <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
                                    {tx.status}
                                </span>
                            </div>
                            <div className="text-[#94A3B8] truncate flex items-center gap-1">
                                <span className="text-[#64748B]">ROUTE:</span>
                                <span className="text-white">{tx.fromCity} &rarr; {tx.toCity}</span>
                            </div>
                            <div className="flex items-center justify-between text-[9px] text-[#64748B] pt-0.5 border-t border-white/5">
                                <span>TX: {tx.txHash}</span>
                                <span>{tx.time}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
