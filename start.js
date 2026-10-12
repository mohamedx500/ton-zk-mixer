#!/usr/bin/env node

/**
 * TON ZK-MIXER - FULL APP ORCHESTRATOR & ENTRY POINT
 * 
 * Launches both:
 * 1. Gasless Relayer Network (Port 4000)
 * 2. Next.js Web DApp Frontend (Port 3000)
 * 
 * Provides unified logging, health monitoring, and stays active until Ctrl+C.
 */

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');

// ANSI Colors
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const CYAN = '\x1b[36m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const MAGENTA = '\x1b[35m';
const RED = '\x1b[31m';
const BLUE = '\x1b[34m';

const RELAYER_DIR = path.join(__dirname, 'relayer');
const FRONTEND_DIR = path.join(__dirname, 'frontend');
const CIRCUITS_PUBLIC = path.join(FRONTEND_DIR, 'public', 'circuits');

const dotenv = require('dotenv');
const envPath = path.join(__dirname, '.env');
dotenv.config({ path: envPath });

const network = (process.env.TON_NETWORK || 'testnet').toLowerCase();
const isMainnet = network === 'mainnet';
const mixerAddress = process.env.MIXER_CONTRACT_ADDRESS || (isMainnet ? '' : '0QAz-Jy7XX5pMi925pFFHGzTgKRqirwK7CgtZMT5mGAhknET');

// Automatically sync root .env into frontend/.env.local for Next.js
try {
    if (fs.existsSync(envPath)) {
        fs.writeFileSync(path.join(FRONTEND_DIR, '.env.local'), fs.readFileSync(envPath));
    }
} catch (_) {}

console.log(`${CYAN}${BOLD}`);
console.log('========================================================================');
console.log('       🛡️  TON ZERO-KNOWLEDGE PRIVACY PROTOCOL & MIXER  🛡️              ');
console.log('========================================================================');
console.log(`${RESET}`);
console.log(`${BOLD}Target Network:${RESET}   ${isMainnet ? `${CYAN}${BOLD}TON Mainnet (PRODUCTION)${RESET}` : `${GREEN}${BOLD}TON Testnet${RESET}`}`);
console.log(`${BOLD}Mixer Contract:${RESET}   ${mixerAddress ? `${YELLOW}${mixerAddress}${RESET}` : `${RED}NOT CONFIGURED (Run npm run deploy:mainnet)${RESET}`}`);
console.log(`${BOLD}Components:${RESET}`);
console.log(`  ⚡ ${GREEN}Gasless Relayer Service${RESET}    -> http://localhost:4000`);
console.log(`  🌐 ${CYAN}Next.js Web DApp Frontend${RESET}  -> http://localhost:3000\n`);

// 1. Verify Prerequisites
console.log(`${YELLOW}🔍 Checking prerequisites...${RESET}`);

if (isMainnet && !mixerAddress) {
    console.error(`${RED}❌ TON_NETWORK is set to 'mainnet', but MIXER_CONTRACT_ADDRESS is not set!${RESET}`);
    console.error(`Please run: npm run deploy:mainnet (or paste an existing contract address into .env)\n`);
}

const wasmFile = path.join(CIRCUITS_PUBLIC, 'mixer.wasm');
const zkeyFile = path.join(CIRCUITS_PUBLIC, 'mixer_final.zkey');

if (!fs.existsSync(wasmFile) || !fs.existsSync(zkeyFile)) {
    console.error(`${RED}❌ Missing circuit files in frontend/public/circuits!${RESET}`);
    console.error(`Please compile the circuits first: npm run circuit:build`);
    process.exit(1);
}
console.log(`  ${GREEN}✓${RESET} Circuit artifacts verified in frontend public directory.`);

const relayerWalletFile = path.join(RELAYER_DIR, '.relayer_wallet.json');
if (process.env.RELAYER_MNEMONIC) {
    console.log(`  ${GREEN}✓${RESET} Relayer wallet loaded from ${BOLD}.env (RELAYER_MNEMONIC)${RESET}`);
} else if (fs.existsSync(relayerWalletFile)) {
    try {
        const wallet = JSON.parse(fs.readFileSync(relayerWalletFile, 'utf-8'));
        console.log(`  ${GREEN}✓${RESET} Relayer wallet loaded from file: ${BOLD}${wallet.address}${RESET}`);
    } catch (_) {
        console.log(`  ${YELLOW}!${RESET} Relayer wallet will be initialized on boot.`);
    }
}

console.log(`  ${GREEN}✓${RESET} All system checks passed.\n`);

let relayerProcess = null;
let frontendProcess = null;
let monitorProcess = null;
let isShuttingDown = false;

// Kill any stale process lingering on the port
function freePort(port) {
    try {
        if (process.platform === 'win32') {
            const out = execSync(`netstat -ano | findstr :${port}`).toString();
            const lines = out.split('\n').filter((l) => l.includes('LISTENING'));
            for (const line of lines) {
                const parts = line.trim().split(/\s+/);
                const pid = parts[parts.length - 1];
                if (pid && pid !== '0' && pid !== process.pid.toString()) {
                    try {
                        execSync(`taskkill /F /PID ${pid} >nul 2>&1`);
                    } catch (_) {}
                }
            }
        } else {
            execSync(`fuser -k ${port}/tcp >/dev/null 2>&1`);
        }
    } catch (_) {}
}

// Helper to check HTTP endpoint
function checkEndpoint(url, timeoutMs = 1500) {
    return new Promise((resolve) => {
        const req = http.get(url, { timeout: timeoutMs }, (res) => {
            resolve(res.statusCode >= 200 && res.statusCode < 400);
        });
        req.on('error', () => resolve(false));
        req.on('timeout', () => {
            req.destroy();
            resolve(false);
        });
    });
}

// Prefix line stream (with noise filter for third-party browser extensions)
function prefixStream(stream, prefix, color) {
    let buffer = '';
    stream.on('data', (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep remainder
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.length > 0) {
                // Filter noisy browser extension injection collisions (e.g. Phantom / OKX / MetaMask)
                if (
                    trimmed.includes('chrome-extension://') ||
                    trimmed.includes('moz-extension://') ||
                    trimmed.includes('[browser] Uncaught TypeError: Cannot redefine property') ||
                    trimmed.includes('solana.js') ||
                    trimmed.includes('evmAsk.js') ||
                    trimmed.includes('extensionPageScript.js')
                ) {
                    continue;
                }
                console.log(`${color}${prefix}${RESET} ${line}`);
            }
        }
    });
}

// 2. Start Relayer Process
function startRelayer() {
    console.log(`${YELLOW}🚀 Starting Gasless Relayer Network on port 4000...${RESET}`);
    const isWin = process.platform === 'win32';
    const npmCmd = isWin ? 'npm.cmd' : 'npm';

    relayerProcess = spawn(npmCmd, ['run', 'dev'], {
        cwd: RELAYER_DIR,
        shell: isWin,
        env: { ...process.env, PORT: '4000' },
    });

    prefixStream(relayerProcess.stdout, '[RELAYER]', MAGENTA);
    prefixStream(relayerProcess.stderr, '[RELAYER ERR]', RED);

    relayerProcess.on('exit', (code, signal) => {
        if (!isShuttingDown) {
            console.log(`${RED}⚠️ Relayer process exited (code: ${code}, signal: ${signal})${RESET}`);
        }
    });
}

// 3. Start Frontend Process
function startFrontend() {
    console.log(`${CYAN}🚀 Starting Next.js Web Frontend on port 3000...${RESET}`);
    const isWin = process.platform === 'win32';
    const npmCmd = isWin ? 'npm.cmd' : 'npm';

    frontendProcess = spawn(npmCmd, ['run', 'dev'], {
        cwd: FRONTEND_DIR,
        shell: isWin,
        env: { ...process.env, PORT: '3000' },
    });

    prefixStream(frontendProcess.stdout, '[FRONTEND]', CYAN);
    prefixStream(frontendProcess.stderr, '[FRONTEND ERR]', RED);

    frontendProcess.on('exit', (code, signal) => {
        if (!isShuttingDown) {
            console.log(`${RED}⚠️ Frontend process exited (code: ${code}, signal: ${signal})${RESET}`);
        }
    });
}

// 4. Start Auto-Top-Up Monitor Process
function startMonitor() {
    if (!process.env.DEPLOYER_MNEMONIC || !process.env.RELAYER_MNEMONIC) {
        console.log(`  ${YELLOW}ℹ️ Auto-TopUp Sentinel skipped (DEPLOYER_MNEMONIC or RELAYER_MNEMONIC not set in .env)${RESET}`);
        return;
    }
    console.log(`${BLUE}🤖 Starting Automated Relayer Gas Top-Up Sentinel...${RESET}`);
    const isWin = process.platform === 'win32';
    const npxCmd = isWin ? 'npx.cmd' : 'npx';

    monitorProcess = spawn(npxCmd, ['ts-node', path.join(RELAYER_DIR, 'src', 'monitor.ts')], {
        cwd: __dirname,
        shell: isWin,
        env: process.env,
    });

    prefixStream(monitorProcess.stdout, '[SENTINEL]', BLUE);
    prefixStream(monitorProcess.stderr, '[SENTINEL ERR]', RED);

    monitorProcess.on('exit', (code, signal) => {
        if (!isShuttingDown) {
            console.log(`${RED}⚠️ Auto-TopUp Monitor process exited (code: ${code}, signal: ${signal})${RESET}`);
        }
    });
}

// 5. Orchestration Loop
async function run() {
    console.log(`${YELLOW}🧹 Ensuring ports 4000 and 3000 are ready...${RESET}`);
    freePort(4000);
    freePort(3000);
    await new Promise((r) => setTimeout(r, 600));

    startRelayer();

    // Poll until relayer responds or timeout
    process.stdout.write(`${YELLOW}⏳ Waiting for Relayer to become healthy...${RESET}`);
    let relayerReady = false;
    for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 1000));
        relayerReady = await checkEndpoint('http://127.0.0.1:4000/health');
        if (relayerReady) break;
        process.stdout.write('.');
    }
    console.log('');

    if (relayerReady) {
        console.log(`${GREEN}✅ Relayer is active and healthy on http://localhost:4000!${RESET}\n`);
    } else {
        console.log(`${YELLOW}⚠️ Relayer is taking longer to start, continuing frontend boot...${RESET}\n`);
    }

    startFrontend();

    // Poll until frontend responds
    process.stdout.write(`${CYAN}⏳ Waiting for Next.js to start serving...${RESET}`);
    let frontendReady = false;
    for (let i = 0; i < 40; i++) {
        await new Promise((r) => setTimeout(r, 1000));
        frontendReady = await checkEndpoint('http://127.0.0.1:3000');
        if (frontendReady) break;
        process.stdout.write('.');
    }
    console.log('');

    startMonitor();

    console.log(`\n${GREEN}${BOLD}========================================================================${RESET}`);
    console.log(`${GREEN}${BOLD}🎉 TON ZK-MIXER FULL PROTOCOL SUITE IS LIVE!${RESET}`);
    console.log(`${GREEN}${BOLD}========================================================================${RESET}`);
    console.log(`  🌐 ${BOLD}Open Web Application:${RESET}  ${CYAN}${BOLD}http://localhost:3000${RESET}`);
    console.log(`  ⚡ ${BOLD}Relayer Health:${RESET}        ${MAGENTA}${BOLD}http://localhost:4000/health${RESET}`);
    console.log(`  📊 ${BOLD}Relayer Telemetry:${RESET}     ${MAGENTA}${BOLD}http://localhost:4000/status${RESET}`);
    console.log(`  🛑 ${BOLD}To Stop Everything:${RESET}    Press ${YELLOW}${BOLD}Ctrl + C${RESET}\n`);

    // Keep process alive indefinitely to stream logs to terminal until user presses Ctrl+C
    const keepAlive = setInterval(() => {}, 60000);
    process.on('exit', () => clearInterval(keepAlive));
}

// Graceful Teardown
function shutdown() {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log(`\n${YELLOW}🛑 Shutting down TON ZK-Mixer services...${RESET}`);

    if (relayerProcess) {
        try {
            if (process.platform === 'win32') {
                spawn('taskkill', ['/pid', relayerProcess.pid.toString(), '/f', '/t']);
            } else {
                relayerProcess.kill('SIGINT');
            }
        } catch (_) {}
    }

    if (frontendProcess) {
        try {
            if (process.platform === 'win32') {
                spawn('taskkill', ['/pid', frontendProcess.pid.toString(), '/f', '/t']);
            } else {
                frontendProcess.kill('SIGINT');
            }
        } catch (_) {}
    }

    if (monitorProcess) {
        try {
            if (process.platform === 'win32') {
                spawn('taskkill', ['/pid', monitorProcess.pid.toString(), '/f', '/t']);
            } else {
                monitorProcess.kill('SIGINT');
            }
        } catch (_) {}
    }

    setTimeout(() => {
        freePort(4000);
        freePort(3000);
        console.log(`${GREEN}👋 All processes terminated cleanly.${RESET}`);
        process.exit(0);
    }, 1200);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

run().catch((err) => {
    console.error(`${RED}Fatal launcher error:${RESET}`, err);
    shutdown();
});
