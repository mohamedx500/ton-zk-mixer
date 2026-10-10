import { NextRequest, NextResponse } from 'next/server';

/**
 * Dynamic TonConnect 2.0 Manifest Handler
 * 
 * Ensures manifest "url" and "iconUrl" strictly match the requesting DApp origin,
 * preventing Tonkeeper / Telegram Wallet "Manifest is not valid" security rejection.
 */
export async function GET(req: NextRequest) {
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'ton-zk-mixer.vercel.app';
    const proto = req.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
    const origin = `${proto}://${host}`;

    return NextResponse.json(
        {
            url: origin,
            name: 'TON ZK-Mixer',
            iconUrl: `${origin}/icon.png`,
            termsOfUseUrl: `${origin}`,
            privacyPolicyUrl: `${origin}`,
        },
        {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Cache-Control': 'no-store, no-cache, must-revalidate',
            },
        }
    );
}

export async function OPTIONS() {
    return new NextResponse(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': '*',
        },
    });
}
