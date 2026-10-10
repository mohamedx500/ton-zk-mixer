import { NextRequest, NextResponse } from 'next/server';

/**
 * Next.js API Route: /api/relay
 * 
 * Proxies gasless withdrawal requests from the frontend client to the internal
 * Relayer service using Vercel Service Binding: process.env.RELAYER_SERVICE_URL.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const relayerBaseUrl = process.env.RELAYER_SERVICE_URL || 'http://localhost:4000';
        const targetUrl = new URL('/relay', relayerBaseUrl);

        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (err: any) {
        console.error('Relayer proxy error:', err);
        return NextResponse.json(
            {
                success: false,
                error: err?.message || 'Failed to dispatch transaction: Relayer service is unreachable',
            },
            { status: 502 }
        );
    }
}
