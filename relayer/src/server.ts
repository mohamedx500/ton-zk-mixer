import express, { Request, Response } from 'express';
import cors from 'cors';
import { Address, Cell, beginCell, fromNano, toNano, internal } from '@ton/core';
import { PORT, MIXER_ADDRESS, RELAY_GAS_FEE, MIN_RELAY_GAS_FEE, TON_NETWORK } from './config';
import { getOrCreateRelayerWallet, getRelayerTonClient } from './wallet';
import { verifyRelayRequest } from './verifier';

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

let totalRelayedCount = 0;

/**
 * Lightweight instant health check endpoint
 */
app.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'ok',
        network: TON_NETWORK,
        mixerAddress: MIXER_ADDRESS,
        totalRelayed: totalRelayedCount,
        timestamp: new Date().toISOString(),
    });
});

/**
 * Status endpoint
 */
app.get('/status', async (req: Request, res: Response) => {
    try {
        const { walletData, contract, client } = await getOrCreateRelayerWallet();
        const balance = await client.getBalance(contract.address);

        res.json({
            online: true,
            network: TON_NETWORK,
            mixerAddress: MIXER_ADDRESS,
            relayer: walletData.address,
            gasBalance: fromNano(balance) + ' TON',
            hasSufficientGas: balance >= RELAY_GAS_FEE,
            totalRelayedTransactions: totalRelayedCount,
        });
    } catch (err: any) {
        res.status(500).json({ online: false, error: err.message });
    }
});

/**
 * POST /relay
 * Anti-spam verified gasless withdrawal dispatcher
 */
app.post('/relay', async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();
    console.log('\n📥 [Relayer] Received new gasless withdrawal relay request...');

    try {
        const {
            rawProof,
            publicSignals,
            piABase64,
            piBBase64,
            piCBase64,
            root,
            nullifierHash,
            recipient,
            assetId,
        } = req.body;

        if (!rawProof || !publicSignals || !piABase64 || !piBBase64 || !piCBase64 || !root || !nullifierHash || !recipient) {
            res.status(400).json({
                success: false,
                error: 'Missing required parameters (rawProof, publicSignals, piABase64, piBBase64, piCBase64, root, nullifierHash, recipient)',
            });
            return;
        }

        const { walletData, keyPair, contract, client } = await getOrCreateRelayerWallet();

        // 1. Check relayer gas balance with dynamic safe fee
        const relayerBalance = await client.getBalance(contract.address);
        const dynamicFee = relayerBalance < 80_000_000n ? MIN_RELAY_GAS_FEE : RELAY_GAS_FEE;
        if (relayerBalance < dynamicFee) {
            res.status(503).json({
                success: false,
                error: `Relayer low balance (${fromNano(relayerBalance)} TON). Minimum required: ${fromNano(dynamicFee)} TON.`,
            });
            return;
        }

        // 2. Perform rigorous off-chain & on-chain anti-spam verification
        console.log('🛡️ [Relayer] Executing Anti-Spam Groth16 & State verification...');
        const verified = await verifyRelayRequest(client, {
            rawProof,
            publicSignals,
            root,
            nullifierHash,
            recipient,
            assetId: assetId || '0',
        });
        console.log('✅ [Relayer] Proof & signals verified successfully off-chain!');

        // 3. Deserialize TVM Cells
        const piA = Cell.fromBase64(piABase64);
        const piB = Cell.fromBase64(piBBase64);
        const piC = Cell.fromBase64(piCBase64);

        // 4. Construct Tact Withdraw message
        const b0 = beginCell();
        b0.storeUint(0x1002, 32); // op::withdraw
        b0.storeRef(piA);
        b0.storeRef(piB);

        const b1 = beginCell();
        b1.storeRef(piC);
        b1.storeUint(verified.root, 256);
        b1.storeUint(verified.nullifierHash, 256);
        b1.storeAddress(verified.recipientAddress);

        const b2 = beginCell();
        b2.storeUint(verified.assetId, 256);
        b1.storeRef(b2.endCell());

        b0.storeRef(b1.endCell());
        const bodyCell = b0.endCell();

        // 5. Broadcast transaction to TON with relayer's dynamic gas
        console.log(`📤 [Relayer] Dispatching transaction to Mixer (${MIXER_ADDRESS}) with dynamic fee ${fromNano(dynamicFee)} TON...`);
        const walletContract = client.open(contract);
        const seqno = await walletContract.getSeqno();

        await walletContract.sendTransfer({
            seqno,
            secretKey: keyPair.secretKey,
            messages: [
                internal({
                    to: Address.parse(MIXER_ADDRESS),
                    value: dynamicFee,
                    body: bodyCell,
                    bounce: false,
                }),
            ],
        });

        totalRelayedCount++;
        const elapsed = Date.now() - startTime;
        console.log(`🎉 [Relayer] Transaction broadcasted in ${elapsed}ms! Seqno: ${seqno}`);

        res.json({
            success: true,
            txSeqno: seqno,
            relayer: walletData.address,
            recipient: verified.recipientAddress.toString({ testOnly: true, bounceable: false }),
            elapsedMs: elapsed,
            message: 'Gasless withdrawal broadcasted to TON Testnet successfully!',
        });
    } catch (err: any) {
        console.error('❌ [Relayer Error]:', err.message);
        res.status(400).json({
            success: false,
            error: err.message || 'Relay transaction processing failed',
        });
    }
});

export function startRelayerServer() {
    return app.listen(PORT, () => {
        console.log(`=======================================================`);
        console.log(`🚀 TON ZK-MIXER GASLESS RELAYER ACTIVE ON PORT ${PORT}`);
        console.log(`=======================================================`);
        console.log(`Target Mixer Contract: ${MIXER_ADDRESS}`);
        console.log(`Endpoint:              http://localhost:${PORT}/relay`);
        console.log(`Health Check:          http://localhost:${PORT}/health\n`);
    });
}

if (require.main === module) {
    startRelayerServer();
}

export default app;
