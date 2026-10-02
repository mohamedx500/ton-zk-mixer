import { Address } from '@ton/core';
import { createDepositNote, MerkleTree } from '../client/crypto';
import { generateWithdrawProof } from '../client/prover';

async function test() {
    console.log('Testing full proof generation flow...');
    const note = createDepositNote();
    const tree = new MerkleTree(8);
    const leafIndex = tree.insert(note.commitment);
    const merkleProof = tree.getProof(leafIndex);

    const recipient = Address.parse('0QA88bC4s-Eaup3MRnwiv_rc9OcE5cCy1-ClJTYlUGN6hWZ7');
    const assetId = 0n; // Native TON

    console.log('Generating Groth16 BLS12-381 proof...');
    const start = Date.now();
    const zkProof = await generateWithdrawProof(note, merkleProof, recipient, assetId);
    const duration = Date.now() - start;
    console.log(`✅ Proof successfully generated in ${duration} ms!`);

    console.log('piA cell bits:', zkProof.piA.beginParse().remainingBits);
    console.log('piB cell bits:', zkProof.piB.beginParse().remainingBits);
    console.log('piC cell bits:', zkProof.piC.beginParse().remainingBits);
    console.log('Root:', zkProof.root.toString());
    console.log('NullifierHash:', zkProof.nullifierHash.toString());
    console.log('Recipient scalar:', zkProof.recipientScalar.toString());
    console.log('AssetId:', zkProof.assetId.toString());

    process.exit(0);
}

test().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});
