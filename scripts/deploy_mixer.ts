import { WalletContractV4, toNano, fromNano } from '@ton/ton';
import { Address } from '@ton/core';
import * as fs from 'fs';
import * as path from 'path';

import { TonZkMixer } from '../build/mixer/mixer_TonZkMixer';
import { getOrCreateTestWallet } from './wallet_manager';
import { createThrottledTonClient } from '../client/ton_client';

const DEPLOYMENT_FILE = path.join(__dirname, '..', '.deployment.json');

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function deployMixer(): Promise<Address> {
    console.log('========================================================');
    console.log('🚀 DEPLOYING TON ZK-MIXER TO TON TESTNET');
    console.log('========================================================\n');

    const { wallet, keyPair, contract } = await getOrCreateTestWallet();
    console.log(`Deployer Address: ${wallet.address}`);

    const client = createThrottledTonClient();
    const balance = await client.getBalance(Address.parse(wallet.address));
    console.log(`Current Balance:  ${fromNano(balance)} TON\n`);

    const minRequired = toNano('0.5');
    if (balance < minRequired) {
        throw new Error(
            `INSUFFICIENT_FUNDS: Wallet ${wallet.address} has ${fromNano(balance)} TON, minimum required is 0.5 TON.`
        );
    }

    const walletContract = client.open(contract);
    const tonDenomination = toNano('1.0');

    console.log('📦 Preparing TonZkMixer contract initialization...');
    const mixerInit = await TonZkMixer.fromInit(contract.address, tonDenomination);
    const mixer = client.open(mixerInit);

    const testnetAddrStr = mixer.address.toString({ testOnly: true, bounceable: false });
    console.log(`Contract Address: ${testnetAddrStr}`);

    const isDeployed = await client.isContractDeployed(mixer.address);
    if (isDeployed) {
        console.log('✅ TonZkMixer is already deployed on TON Testnet!');
        return mixer.address;
    }

    console.log('📤 Sending deploy transaction...');
    const seqno = await walletContract.getSeqno();

    const sender = walletContract.sender(keyPair.secretKey);
    await mixer.send(
        sender,
        { value: toNano('0.25') },
        null
    );

    console.log('⏳ Waiting for deployment confirmation on Testnet...');
    let currentSeqno = seqno;
    for (let i = 0; i < 30; i++) {
        await sleep(3500);
        try {
            currentSeqno = await walletContract.getSeqno();
            if (currentSeqno > seqno) {
                break;
            }
        } catch (_) {}
        process.stdout.write('.');
    }
    console.log('\n');

    const confirmed = await client.isContractDeployed(mixer.address);
    if (!confirmed) {
        throw new Error('❌ Deployment transaction timed out or was not confirmed on Testnet.');
    }

    console.log('🎉 TonZkMixer DEPLOYED SUCCESSFULLY ON TON TESTNET!');
    console.log(`Contract Address (Testnet): ${testnetAddrStr}`);
    console.log(`Contract Address (Raw):     ${mixer.address.toRawString()}`);

    fs.writeFileSync(
        DEPLOYMENT_FILE,
        JSON.stringify(
            {
                mixerAddress: testnetAddrStr,
                rawAddress: mixer.address.toRawString(),
                tonDenomination: tonDenomination.toString(),
                deployedAt: new Date().toISOString(),
            },
            null,
            2
        )
    );

    return mixer.address;
}

if (require.main === module) {
    deployMixer().catch((err) => {
        console.error(err.message);
        process.exit(1);
    });
}
