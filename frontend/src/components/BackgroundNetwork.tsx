'use client';

import React, { useEffect, useRef } from 'react';

export function BackgroundNetwork() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) return;

        let animationFrameId: number;
        let width = (canvas.width = window.innerWidth);
        let height = (canvas.height = window.innerHeight);

        const handleResize = () => {
            if (!canvas) return;
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', handleResize);

        // Nodes configuration
        const nodeCount = Math.min(Math.floor((width * height) / 22000), 55);
        const nodes: Array<{
            x: number;
            y: number;
            vx: number;
            vy: number;
            radius: number;
            baseAlpha: number;
            color: string;
        }> = [];

        const colors = [
            'rgba(6, 182, 212, ',   // cyan
            'rgba(16, 185, 129, ',  // emerald
            'rgba(56, 189, 248, ',  // sky
            'rgba(99, 102, 241, ',  // indigo
        ];

        for (let i = 0; i < nodeCount; i++) {
            nodes.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.45,
                vy: (Math.random() - 0.5) * 0.45,
                radius: Math.random() * 1.8 + 0.8,
                baseAlpha: Math.random() * 0.4 + 0.25,
                color: colors[Math.floor(Math.random() * colors.length)],
            });
        }

        const maxDist = 140;

        const render = () => {
            ctx.clearRect(0, 0, width, height);

            // Connect nearby nodes
            for (let i = 0; i < nodes.length; i++) {
                const nodeA = nodes[i];

                for (let j = i + 1; j < nodes.length; j++) {
                    const nodeB = nodes[j];
                    const dx = nodeA.x - nodeB.x;
                    const dy = nodeA.y - nodeB.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < maxDist) {
                        const alpha = (1 - dist / maxDist) * 0.12;
                        ctx.strokeStyle = `rgba(6, 182, 212, ${alpha})`;
                        ctx.lineWidth = 0.8;
                        ctx.beginPath();
                        ctx.moveTo(nodeA.x, nodeA.y);
                        ctx.lineTo(nodeB.x, nodeB.y);
                        ctx.stroke();
                    }
                }
            }

            // Draw nodes
            for (let i = 0; i < nodes.length; i++) {
                const node = nodes[i];
                node.x += node.vx;
                node.y += node.vy;

                // Bounce boundaries
                if (node.x < 0 || node.x > width) node.vx *= -1;
                if (node.y < 0 || node.y > height) node.vy *= -1;

                ctx.fillStyle = `${node.color}${node.baseAlpha})`;
                ctx.beginPath();
                ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
                ctx.fill();

                // Faint glow halo
                ctx.fillStyle = `${node.color}${node.baseAlpha * 0.25})`;
                ctx.beginPath();
                ctx.arc(node.x, node.y, node.radius * 3.5, 0, Math.PI * 2);
                ctx.fill();
            }

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            {/* Subtle radial ambient gradients */}
            <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] rounded-full bg-cyan-600/10 blur-[130px] -z-10" />
            <div className="absolute top-[35%] right-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-600/08 blur-[140px] -z-10" />
            <div className="absolute bottom-[-15%] left-[-5%] w-[550px] h-[550px] rounded-full bg-teal-600/08 blur-[120px] -z-10" />

            {/* Cryptographic mesh canvas */}
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-60" />

            {/* Subtle grid pattern overlay */}
            <div
                className="absolute inset-0 opacity-[0.035]"
                style={{
                    backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
                    backgroundSize: '48px 48px',
                }}
            />
        </div>
    );
}
