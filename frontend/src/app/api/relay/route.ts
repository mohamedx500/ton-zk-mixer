import { NextRequest, NextResponse } from 'next/server';
import { Address, beginCell, Cell, internal, fromNano } from '@ton/core';
import { mnemonicToPrivateKey } from '@ton/crypto';
import { WalletContractV4, TonClient } from '@ton/ton';
import {
    MIXER_ADDRESS_STRING,
    TONCENTER_RPC,
    TONCENTER_API_KEY,
    IS_MAINNET,
    WITHDRAW_GAS_FEE,
} from '@/lib/contracts';


/**
 * Next.js API Route: /api/relay
 * 
 * High-reliability Gasless Relayer endpoint:
 * 1. Attempts external RELAYER_SERVICE_URL proxy if configured.
 * 2. Seamlessly falls back to built-in Serverless Relayer to guarantee
 *    100% uptime on Vercel without 502 / external service dependencies.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            piABase64,
            piBBase64,
            piCBase64,
            root,
            nullifierHash,
            recipient,
            assetId,
        } = body;

        // Try external relayer if explicitly configured and reachable
        const externalUrl = process.env.RELAYER_SERVICE_URL;
        if (externalUrl && externalUrl !== 'http://localhost:4000') {
            try {
                const targetUrl = new URL('/relay', externalUrl);
                const extRes = await fetch(targetUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                    signal: AbortSignal.timeout(5000),
                });
                if (extRes.ok) {
                    const extData = await extRes.json();
                    return NextResponse.json(extData, { status: extRes.status });
                }
            } catch (_) {
                console.warn('External relayer unavailable, falling back to internal relayer...');
            }
        }

        // Validate payload parameters
        if (!piABase64 || !piBBase64 || !piCBase64 || !root || !nullifierHash || !recipient) {
            return NextResponse.json(
                { success: false, error: 'Missing required parameters for gasless withdrawal' },
                { status: 400 }
            );
        }

        const client = new TonClient({
            endpoint: TONCENTER_RPC,
            apiKey: TONCENTER_API_KEY || undefined,
        });

        const mixerAddr = Address.parse(MIXER_ADDRESS_STRING);
        const recipientAddr = Address.parse(recipient);
        const rootBig = BigInt(root);
        const nullifierBig = BigInt(nullifierHash);
        const assetIdBig = BigInt(assetId || '0');

        // On-chain verification: check nullifier
        try {
            const spentRes = await client.runMethod(mixerAddr, 'isNullifierSpent', [
                { type: 'int', value: nullifierBig },
            ]);
            if (spentRes.stack.readBoolean()) {
                return NextResponse.json(
                    { success: false, error: 'This note has already been spent on-chain!' },
                    { status: 400 }
                );
            }
        } catch (e: any) {
            console.warn('Could not query isNullifierSpent:', e?.message);
        }

        // Relayer wallet initialization
        const mnemonicStr = process.env.RELAYER_MNEMONIC || '';
        const mnemonic = mnemonicStr.trim().split(/\s+/);
        const keyPair = await mnemonicToPrivateKey(mnemonic);
        const relayerContract = WalletContractV4.create({
            workchain: 0,
            publicKey: keyPair.publicKey,
        });

        const relayerWalletContract = client.open(relayerContract);
        const relayerBalance = await client.getBalance(relayerContract.address);

        if (relayerBalance < WITHDRAW_GAS_FEE) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Relayer low gas balance (${fromNano(relayerBalance)} TON). Minimum required: ${fromNano(WITHDRAW_GAS_FEE)} TON.`,
                },
                { status: 503 }
            );
        }

        // Deserialize TVM Proof Cells
        const piA = Cell.fromBase64(piABase64);
        const piB = Cell.fromBase64(piBBase64);
        const piC = Cell.fromBase64(piCBase64);

        // Construct Tact Withdraw message cell (op::withdraw = 0x1002)
        const b0 = beginCell();
        b0.storeUint(0x1002, 32);
        b0.storeRef(piA);
        b0.storeRef(piB);

        const b1 = beginCell();
        b1.storeRef(piC);
        b1.storeUint(rootBig, 256);
        b1.storeUint(nullifierBig, 256);
        b1.storeAddress(recipientAddr);

        const b2 = beginCell();
        b2.storeUint(assetIdBig, 256);
        b1.storeRef(b2.endCell());

        b0.storeRef(b1.endCell());
        const bodyCell = b0.endCell();

        // Broadcast transaction with relayer gas fee
        const seqno = await relayerWalletContract.getSeqno();
        await relayerWalletContract.sendTransfer({
            seqno,
            secretKey: keyPair.secretKey,
            messages: [
                internal({
                    to: mixerAddr,
                    value: WITHDRAW_GAS_FEE,
                    body: bodyCell,
                    bounce: false,
                }),
            ],
        });

        const relayerAddressStr = relayerContract.address.toString({
            testOnly: !IS_MAINNET,
            bounceable: false,
        });

        return NextResponse.json({
            success: true,
            txSeqno: seqno,
            relayer: relayerAddressStr,
            recipient: recipientAddr.toString({ testOnly: !IS_MAINNET, bounceable: false }),
            message: 'Gasless withdrawal broadcasted to TON Testnet successfully!',
        });
    } catch (err: any) {
        console.error('Relayer execution error:', err);
        return NextResponse.json(
            {
                success: false,
                error: err?.message || 'Failed to dispatch gasless withdrawal transaction',
            },
            { status: 500 }
        );
    }
}
