import { Address } from '@ton/core';
import { createThrottledTonClient } from '../client/ton_client';
import { MerkleTree } from '../client/crypto';

async function main() {
    try {
        const client = createThrottledTonClient();
        const mixerAddr = Address.parse('0QAz-Jy7XX5pMi925pFFHGzTgKRqirwK7CgtZMT5mGAhknET');
        const txs = await client.getTransactions(mixerAddr, { limit: 20 });
        const commitments: bigint[] = [];
        const chronological = [...txs].reverse();

        for (const tx of chronological) {
            if (tx.inMessage && tx.inMessage.info.type === 'internal') {
                const body = tx.inMessage.body.beginParse();
                if (body.remainingBits >= 32 + 256) {
                    const op = body.loadUint(32);
                    if (op === 0x1001) {
                        const c = body.loadUintBig(256);
                        commitments.push(c);
                        console.log(`Leaf #${commitments.length - 1} commitment:`, c.toString());
                    }
                }
            }
        }
        console.log('Total commitments found from chain:', commitments.length);

        const tree = new MerkleTree(8);
        for (const c of commitments) {
            tree.insert(c);
        }
        console.log('Rebuilt Merkle Root from chain events:', tree.getRoot().toString());
    } catch (e) {
        console.error('Error:', e);
    }
}
main();
