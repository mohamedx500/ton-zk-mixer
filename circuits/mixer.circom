pragma circom 2.1.0;

include "mimc.circom";
include "merkle_tree.circom";

/**
 * Universal Zero-Knowledge Mixer Circuit (BLS12-381)
 *
 * Proves in Zero Knowledge:
 * 1. The prover knows `secret` and `nullifier` such that `leaf = MiMC(nullifier, secret)`.
 * 2. `leaf` is a member of the Merkle tree with public `root`.
 * 3. `nullifierHash = MiMC(nullifier, 0)`.
 * 4. Binds `recipient` and `assetId` to prevent proof theft or front-running.
 */
template Mixer(levels) {
    // Public Inputs (known to smart contract verifier)
    signal input root;
    signal input nullifierHash;
    signal input recipient;
    signal input assetId;

    // Private Inputs (known only to the depositor/withdrawer)
    signal input nullifier;
    signal input secret;
    signal input pathElements[levels];
    signal input pathIndices[levels];

    // 1. Verify Commitment: commitment = MiMC(nullifier, secret)
    component commitmentHasher = Hash2();
    commitmentHasher.left <== nullifier;
    commitmentHasher.right <== secret;

    // 2. Verify Nullifier Hash: nullifierHash = MiMC(nullifier, 0)
    component nullifierHasher = Hash1();
    nullifierHasher.in <== nullifier;
    nullifierHasher.hash === nullifierHash;

    // 3. Verify Merkle Tree Membership
    component tree = MerkleTreeInclusionProof(levels);
    tree.leaf <== commitmentHasher.hash;
    for (var i = 0; i < levels; i++) {
        tree.pathElements[i] <== pathElements[i];
        tree.pathIndices[i] <== pathIndices[i];
    }
    tree.root === root;

    // 4. Bind recipient and assetId to prevent tampering and front-running
    signal recipientSquare;
    recipientSquare <== recipient * recipient;

    signal assetSquare;
    assetSquare <== assetId * assetId;
}

// Instantiate mixer circuit with Merkle Tree depth 8 (256 deposits)
component main {public [root, nullifierHash, recipient, assetId]} = Mixer(8);
