pragma circom 2.1.0;

/**
 * Deterministic algebraic constant generator for MiMC over the prime field.
 * In Circom, all variable arithmetic is natively evaluated modulo the prime field.
 */
function getMimcRoundConstant(i) {
    var A = 6364136223846793005;
    var B = 1442695040888963407;
    var c = 0;
    for (var j = 0; j < i; j++) {
        c = c * A + B;
    }
    return c;
}

/**
 * Single round of MiMC-5:
 * t = in + k + c
 * out = t^5 = ((t^2)^2) * t
 */
template MiMCRound(c) {
    signal input in;
    signal input k;
    signal output out;

    signal t;
    t <== in + k + c;

    signal t2;
    t2 <== t * t;

    signal t4;
    t4 <== t2 * t2;

    out <== t4 * t;
}

/**
 * 64-round MiMC permutation over BLS12-381
 */
template MiMC(rounds) {
    signal input x;
    signal input k;
    signal output out;

    signal state[rounds + 1];
    state[0] <== x;

    component r[rounds];
    for (var i = 0; i < rounds; i++) {
        r[i] = MiMCRound(getMimcRoundConstant(i));
        r[i].in <== state[i];
        r[i].k <== k;
        state[i + 1] <== r[i].out;
    }

    out <== state[rounds] + k;
}

/**
 * 2-to-1 Compressor Hash: H(left, right) = MiMC(left, right)
 */
template Hash2() {
    signal input left;
    signal input right;
    signal output hash;

    component mimc = MiMC(64);
    mimc.x <== left;
    mimc.k <== right;
    hash <== mimc.out;
}

/**
 * 1-input Hash: H(in) = MiMC(in, 0)
 */
template Hash1() {
    signal input in;
    signal output hash;

    component mimc = MiMC(64);
    mimc.x <== in;
    mimc.k <== 0;
    hash <== mimc.out;
}
