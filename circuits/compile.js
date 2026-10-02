const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const circuitsDir = __dirname;
const rootDir = path.join(circuitsDir, '..');
const circomBin = path.join(rootDir, 'bin', 'circom.exe');
const snarkjsBin = path.join(rootDir, 'node_modules', 'snarkjs', 'build', 'cli.cjs');

const circuitPath = path.join(circuitsDir, 'mixer.circom');
const r1csPath = path.join(circuitsDir, 'mixer.r1cs');
const wasmPath = path.join(circuitsDir, 'mixer_js', 'mixer.wasm');
const ptauFinal = path.join(circuitsDir, 'bls12381_pot12_final.ptau');
const zkey0 = path.join(circuitsDir, 'mixer_0000.zkey');
const zkeyFinal = path.join(circuitsDir, 'mixer_final.zkey');
const vkeyJson = path.join(circuitsDir, 'verification_key.json');
const verifierTact = path.join(rootDir, 'contracts', 'verifier.tact');

function run(cmd, desc) {
    console.log(`\n⏳ ${desc}...`);
    console.log(`> ${cmd}`);
    execSync(cmd, { stdio: 'inherit', cwd: rootDir });
}

async function main() {
    console.log('========================================================');
    console.log('🚀 COMPILING MIXER ZK-CIRCUIT & GENERATING VERIFIER');
    console.log('========================================================');

    // 1. Compile Circom circuit to R1CS & WASM
    run(
        `"${circomBin}" "${circuitPath}" --r1cs --wasm --sym --prime bls12381 -o "${circuitsDir}"`,
        'Compiling Circom circuit with bls12381 prime'
    );

    // 2. Generate or use development BLS12-381 Powers of Tau
    if (!fs.existsSync(ptauFinal)) {
        const ptau0 = path.join(circuitsDir, 'pot12_0000.ptau');
        const ptau1 = path.join(circuitsDir, 'pot12_0001.ptau');
        run(`node "${snarkjsBin}" powersoftau new bls12-381 12 "${ptau0}"`, 'Creating BLS12-381 Powers of Tau (2^12)');
        run(
            `node "${snarkjsBin}" powersoftau contribute "${ptau0}" "${ptau1}" --name="mixer_contributor" -v -e="ton_zk_mixer_entropy_12345"`,
            'Contributing to Powers of Tau ceremony'
        );
        run(
            `node "${snarkjsBin}" powersoftau prepare phase2 "${ptau1}" "${ptauFinal}" -v`,
            'Preparing Phase 2 Powers of Tau'
        );

        if (fs.existsSync(ptau0)) fs.unlinkSync(ptau0);
        if (fs.existsSync(ptau1)) fs.unlinkSync(ptau1);
    } else {
        console.log(`✅ Using existing Powers of Tau transcript: ${ptauFinal}`);
    }

    // 3. Groth16 Circuit Setup & ZKey generation
    run(
        `node "${snarkjsBin}" groth16 setup "${r1csPath}" "${ptauFinal}" "${zkey0}"`,
        'Groth16 setup for mixer.r1cs'
    );

    run(
        `node "${snarkjsBin}" zkey contribute "${zkey0}" "${zkeyFinal}" --name="mixer_phase2_contrib" -v -e="mixer_phase2_entropy_67890"`,
        'Contributing Phase 2 to ZKey'
    );

    if (fs.existsSync(zkey0)) fs.unlinkSync(zkey0);

    // 4. Export verification key JSON
    run(
        `node "${snarkjsBin}" zkey export verificationkey "${zkeyFinal}" "${vkeyJson}"`,
        'Exporting verification_key.json'
    );

    // 5. Generate TON Tact Verifier contract using export-ton-verifier
    run(
        `npx export-ton-verifier "${zkeyFinal}" "${verifierTact}" --tact`,
        'Generating Tact Groth16 Verifier via export-ton-verifier'
    );

    console.log('\n========================================================');
    console.log('🎉 ZK PIPELINE COMPLETE!');
    console.log(`- Circuit R1CS:      ${r1csPath}`);
    console.log(`- Circuit WASM:      ${wasmPath}`);
    console.log(`- Proving Key:       ${zkeyFinal}`);
    console.log(`- Verification Key:  ${vkeyJson}`);
    console.log(`- Tact Verifier:     ${verifierTact}`);
    console.log('========================================================\n');
}

main().catch((err) => {
    console.error('❌ Pipeline failed:', err);
    process.exit(1);
});
