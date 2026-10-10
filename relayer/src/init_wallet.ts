import { fromNano } from '@ton/core';
import { getOrCreateRelayerWallet } from './wallet';

async function main() {
    console.log('=======================================================');
    console.log('🔑 INITIALIZING TON ZK-MIXER RELAYER WALLET');
    console.log('=======================================================');

    const { walletData, contract, client } = await getOrCreateRelayerWallet();
    const balance = await client.getBalance(contract.address);

    console.log(`Relayer Address: ${walletData.address}`);
    console.log(`Current Balance: ${fromNano(balance)} TON\n`);

    if (balance === 0n) {
        console.log(`🛑 WAITING_FOR_FAUCET: I have generated the Relayer wallet ${walletData.address}. Please fund it using a TON Testnet faucet and reply with 'DONE' when ready.`);
        process.exit(101); // Special code indicating waiting for faucet
    } else {
        console.log(`✅ Relayer wallet is funded and ready with ${fromNano(balance)} TON!`);
        process.exit(0);
    }
}

main().catch((err) => {
    console.error('Initialization error:', err);
    process.exit(1);
});
