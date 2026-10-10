import { NextResponse } from 'next/server';
import { mnemonicToPrivateKey } from '@ton/crypto';
import { WalletContractV4, TonClient } from '@ton/ton';
import { fromNano } from '@ton/core';
import {
    TON_NETWORK,
    MIXER_ADDRESS_STRING,
    TONCENTER_RPC,
    TONCENTER_API_KEY,
    IS_MAINNET,
} from '@/lib/contracts';


export async function GET() {
    try {
        const externalUrl = process.env.RELAYER_SERVICE_URL;
        if (externalUrl && externalUrl !== 'http://localhost:4000') {
            try {
                const targetUrl = new URL('/status', externalUrl);
                const extRes = await fetch(targetUrl, { signal: AbortSignal.timeout(4000) });
                if (extRes.ok) {
                    const data = await extRes.json();
                    if (data.network === TON_NETWORK && data.mixerAddress === MIXER_ADDRESS_STRING) {
                        return NextResponse.json(data);
                    }
                }
            } catch (_) {}
        }

        const client = new TonClient({
            endpoint: TONCENTER_RPC,
            apiKey: TONCENTER_API_KEY || undefined,
        });

        const mnemonicStr = process.env.RELAYER_MNEMONIC || '';
        const mnemonic = mnemonicStr.trim().split(/\s+/);
        const keyPair = await mnemonicToPrivateKey(mnemonic);
        const relayerContract = WalletContractV4.create({
            workchain: 0,
            publicKey: keyPair.publicKey,
        });

        const balance = await client.getBalance(relayerContract.address).catch(() => 0n);

        return NextResponse.json({
            online: true,
            network: TON_NETWORK,
            mixerAddress: MIXER_ADDRESS_STRING,
            relayer: relayerContract.address.toString({
                testOnly: !IS_MAINNET,
                bounceable: false,
            }),
            gasBalance: fromNano(balance) + ' TON',
            hasSufficientGas: balance >= 180_000_000n,
        });
    } catch (err: any) {
        return NextResponse.json(
            { online: false, error: err?.message || 'Relayer check failed' },
            { status: 500 }
        );
    }
}
