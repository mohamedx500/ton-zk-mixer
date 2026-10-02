import { createDepositNote, MerkleTree, mimcHash2 } from '../client/crypto';

async function test() {
    console.log('Testing deposit note creation...');
    const note = createDepositNote();
    console.log('Commitment:', note.commitment.toString());
    console.log('NullifierHash:', note.nullifierHash.toString());

    const tree = new MerkleTree(8);
    console.log('Empty tree root:', tree.getRoot().toString());

    const idx = tree.insert(note.commitment);
    console.log('Inserted at index:', idx);
    const proof = tree.getProof(idx);
    console.log('Tree root after insertion:', tree.getRoot().toString());
    console.log('Proof root:', proof.root.toString());
    console.log('Roots match:', tree.getRoot() === proof.root);

    // Verify path manually
    let cur = note.commitment;
    for (let i = 0; i < 8; i++) {
        if (proof.pathIndices[i] === 0) {
            cur = mimcHash2(cur, proof.pathElements[i]);
        } else {
            cur = mimcHash2(proof.pathElements[i], cur);
        }
    }
    console.log('Calculated path matches:', cur === tree.getRoot());
}

test();
