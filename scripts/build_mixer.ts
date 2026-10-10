import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { stdLibFiles } from '@tact-lang/compiler';
import { compileFunc } from '@ton-community/func-js';

export async function buildMixerWithMigration() {
    console.log('💼 1. Running Tact compiler...');
    execSync('npx tact --config tact.config.json', { stdio: 'inherit' });

    console.log('🔧 2. Applying storage migration compatibility patch...');
    const fcPath = path.join(__dirname, '..', 'build', 'mixer', 'mixer_TonZkMixer.fc');
    let fc = fs.readFileSync(fcPath, 'utf-8');

    const targetPattern = "    var v'accumulatedFees = sc_2~load_varuint16();\n    var v'autoFeeRouting = sc_2~load_int(1);";
    const replacementCode = "    var v'accumulatedFees = 0;\n    var v'autoFeeRouting = 0;\n    if (sc_2.slice_bits() > 0) {\n        v'accumulatedFees = sc_2~load_varuint16();\n        v'autoFeeRouting = sc_2~load_int(1);\n    }";

    if (fc.includes(targetPattern)) {
        fc = fc.replace(targetPattern, replacementCode);
        fs.writeFileSync(fcPath, fc, 'utf-8');
        console.log('✅ Injected dynamic storage migration check into mixer_TonZkMixer.fc');
    } else {
        console.log('ℹ️ Pattern already patched or modified.');
    }

    console.log('📦 3. Compiling FunC bytecode with stdlib...');
    const stdlib = Buffer.from((stdLibFiles as any)['std/stdlib.fc'], 'base64').toString('utf-8');
    const res = await compileFunc({
        targets: ['stdlib.fc', 'mixer_TonZkMixer.fc'],
        sources: {
            'stdlib.fc': stdlib,
            'mixer_TonZkMixer.fc': fc,
        },
    });

    if (res.status !== 'ok') {
        throw new Error(`FunC compilation error: ${res.message}`);
    }

    const bocBuffer = Buffer.from(res.codeBoc, 'base64');
    const codeBocPath = path.join(__dirname, '..', 'build', 'mixer', 'mixer_TonZkMixer.code.boc');
    fs.writeFileSync(codeBocPath, bocBuffer);
    console.log(`🎉 Successfully generated backwards-compatible bytecode: ${codeBocPath} (${bocBuffer.length} bytes)`);
}

if (require.main === module) {
    buildMixerWithMigration().catch((err) => {
        console.error('Build failed:', err);
        process.exit(1);
    });
}
