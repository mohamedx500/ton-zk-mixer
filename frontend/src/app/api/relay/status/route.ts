import { NextResponse } from 'next/server';

/**
 * Next.js API Route: /api/relay/status
 * 
 * Proxies telemetry and status requests from the frontend to the internal
 * Relayer service using Vercel Service Binding: process.env.RELAYER_SERVICE_URL.
 */
export async function GET() {
    try {
        const relayerBaseUrl = process.env.RELAYER_SERVICE_URL || 'http://localhost:4000';
        const targetUrl = new URL('/status', relayerBaseUrl);

        const response = await fetch(targetUrl);
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (err: any) {
        return NextResponse.json(
            { online: false, error: err?.message || 'Relayer service is offline' },
            { status: 502 }
        );
    }
}
