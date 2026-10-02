pragma circom 2.1.0;

include "mimc.circom";

/**
 * DualMux selects between (in[0], in[1]) or (in[1], in[0]) based on a binary selector s.
 * s === 0 -> out[0] = in[0], out[1] = in[1]
 * s === 1 -> out[0] = in[1], out[1] = in[0]
 */
template DualMux() {
    signal input in[2];
    signal input s;
    signal output out[2];

    s * (1 - s) === 0;

    out[0] <== (in[1] - in[0]) * s + in[0];
    out[1] <== (in[0] - in[1]) * s + in[1];
}

/**
 * MerkleTreeInclusionProof verifies that a given leaf exists in a Merkle tree of depth `levels`.
 */
template MerkleTreeInclusionProof(levels) {
    signal input leaf;
    signal input pathElements[levels];
    signal input pathIndices[levels];
    signal output root;

    component mux[levels];
    component hashers[levels];

    signal current[levels + 1];
    current[0] <== leaf;

    for (var i = 0; i < levels; i++) {
        mux[i] = DualMux();
        mux[i].in[0] <== current[i];
        mux[i].in[1] <== pathElements[i];
        mux[i].s <== pathIndices[i];

        hashers[i] = Hash2();
        hashers[i].left <== mux[i].out[0];
        hashers[i].right <== mux[i].out[1];

        current[i + 1] <== hashers[i].hash;
    }

    root <== current[levels];
}
