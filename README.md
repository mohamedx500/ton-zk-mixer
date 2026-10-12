# TON ZK-Mixer Protocol

> **Institutional-Grade Zero-Knowledge Privacy Protocol on The Open Network (TON)**  
> Powered by Groth16 zk-SNARKs over BLS12-381, Native TVM Pairing Precompiles, and a Decentralized Gasless Relayer Network.

[![TON Mainnet](https://img.shields.io/badge/TON%20Mainnet-Active-0098EA?style=flat-square&logo=telegram)](https://tonscan.org/address/UQBc0izk6rtfjroHgkzP4pEBUHfMCtSS1CGT988kw8DbqY7A)
[![Language](https://img.shields.io/badge/Smart%20Contracts-Tact%200.16-blue?style=flat-square)](https://tact-lang.org)
[![ZK-SNARKs](https://img.shields.io/badge/Proving%20System-Groth16%20%7C%20BLS12--381-purple?style=flat-square)](https://circom.io)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2016%20Turbopack-black?style=flat-square)](https://nextjs.org)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

---

## 1. Executive Summary

**TON ZK-Mixer** is a non-custodial privacy protocol engineered for the TON blockchain. It breaks the deterministic link between sender and recipient addresses using zero-knowledge proofs (**zk-SNARKs**).

Depositors deposit fixed denominations of TON into an on-chain **Incremental Merkle Tree**. When withdrawing, the recipient provides a cryptographic zero-knowledge proof generated entirely client-side via WebAssembly. The smart contract validates that:
1. The commitment belongs to the valid on-chain Merkle tree.
2. The user possesses the private secret and nullifier corresponding to the deposit.
3. The nullifier has never been spent previously.
4. The proof cryptographically binds the designated recipient address, preventing front-running and MEV theft.

The protocol operates with **zero on-chain leakage of the depositor's identity**, and recipient payouts can be executed gaslessly to fresh, unlinked wallets funded entirely by the Relayer Network.

---

## 2. Live On-Chain Deployments

| Network | Component | On-Chain Address | Verification & Explorer |
| :--- | :--- | :--- | :--- |
| **TON Mainnet** | **TonZkMixer Core** | `UQBc0izk6rtfjroHgkzP4pEBUHfMCtSS1CGT988kw8DbqY7A` | [View on TonScan](https://tonscan.org/address/UQBc0izk6rtfjroHgkzP4pEBUHfMCtSS1CGT988kw8DbqY7A) |
| **TON Mainnet** | **Gasless Relayer** | `UQAqBeQ17Cx9xaTLQr_H8Oa9HpRXrZeT2vuJ_Sb0FOoBsfnQ` | [View on TonScan](https://tonscan.org/address/UQAqBeQ17Cx9xaTLQr_H8Oa9HpRXrZeT2vuJ_Sb0FOoBsfnQ) |
| **TON Testnet** | **TonZkMixer Core** | `0QAz-Jy7XX5pMi925pFFHGzTgKRqirwK7CgtZMT5mGAhknET` | [View on Testnet Explorer](https://testnet.tonscan.org/address/0QAz-Jy7XX5pMi925pFFHGzTgKRqirwK7CgtZMT5mGAhknET) |

---

## 3. Cryptographic Specification

```
   [ Depositor Wallet ]
           |
           | 1. Generate (secret, nullifier)
           |    commitment = MiMC(nullifier, secret)
           v
   +-------------------------------------------------------------+
   |                  TonZkMixer Smart Contract                  |
   |   - Inserts commitment into on-chain Incremental Tree      |
   |   - Computes & records new Merkle Root                      |
   +-------------------------------------------------------------+
           |
           | Time delay & anonymity accumulation
           v
   [ Recipient / Client Prover ]
           |
           | 2. Fetch Merkle Proof from contract
           | 3. Generate Groth16 Proof (snarkjs WASM in-browser)
           |    Public inputs: [MerkleRoot, NullifierHash, Recipient, AssetID]
           v
   +-------------------------------------------------------------+
   |                    Gasless Relayer / TVM                    |
   |   - TVM executes native BLS12-381 pairing precompiles       |
   |   - Checks nullifier map (reentrancy & double-spend shield)  |
   |   - Releases exact denomination to recipient                |
   +-------------------------------------------------------------+
           |
           v
   [ Fresh Recipient Wallet (0 Prior History) ]
```

### 3.1 Curve & Proof System
- **Curve**: **BLS12-381** (optimal pairing curve supported natively by TON Virtual Machine).
- **Proving Scheme**: **Groth16** zero-knowledge succinct non-interactive arguments of knowledge.
- **Hash Primitive**: **MiMC-5** algebraic round permutation over the BLS12-381 scalar field $r$:
  $$r = 52435875646498198632059764217716606335340676784449893096240094181876821708289$$
- **Circuit Depth**: 8-level incremental binary Merkle tree (capacity of $2^8 = 256$ deposits per active tree generation, rotating seamlessly across historical roots).

### 3.2 Public Signals & Front-Running Immunity
The Circom circuit (`circuits/mixer.circom`) enforces constraints on the following public signals:
1. `root`: Valid Merkle tree root matching contract root history.
2. `nullifierHash`: Hash derived from the secret nullifier, registered on-chain to prevent double-spending.
3. `recipient`: The 256-bit scalar representation of the destination TON address. Proof is mathematically invalid if intercepted or submitted with any other recipient.
4. `assetId`: Identifier for native TON (`0`) or specific Jettons (TEP-74).

---

## 4. Smart Contract Architecture (`contracts/mixer.tact`)

### 4.1 9 Anonymity Pool Tiers & Upfront Fee Model
To maximize anonymity set uniformity and eliminate withdrawal-time balance discrepancies, the protocol uses an **Upfront Tier Model**:
- All fees (protocol maintenance + execution margins) are paid **at deposit time**.
- **Withdrawals are 100% clean, exact integer amounts** (e.g., an exact 100.0 TON withdrawal arrives at the recipient address, preventing fee-correlation heuristic tracking).

| Tier | Category | Pool Denomination | Upfront Protocol Fee | Total Required Deposit | Recipient Payout |
| :---: | :---: | :---: | :---: | :---: | :---: |
| **1.0 TON** | Standard | 1.0 TON | 0.20 TON | **1.20 TON** | **1.00 TON** |
| **5.0 TON** | Standard | 5.0 TON | 0.75 TON | **5.75 TON** | **5.00 TON** |
| **10.0 TON** | Standard | 10.0 TON | 1.20 TON | **11.20 TON** | **10.00 TON** |
| **25.0 TON** | Standard | 25.0 TON | 2.50 TON | **27.50 TON** | **25.00 TON** |
| **50.0 TON** | Standard | 50.0 TON | 4.50 TON | **54.50 TON** | **50.00 TON** |
| **100.0 TON** | Whale | 100.0 TON | 8.00 TON | **108.00 TON** | **100.00 TON** |
| **250.0 TON** | Whale | 250.0 TON | 18.00 TON | **268.00 TON** | **250.00 TON** |
| **500.0 TON** | Whale | 500.0 TON | 30.00 TON | **530.00 TON** | **500.00 TON** |
| **1000.0 TON** | Whale | 1000.0 TON | 50.00 TON | **1050.00 TON** | **1000.00 TON** |

### 4.2 TVM BLS12-381 Pairing Verification
The contract utilizes TON's low-level TVM pairing instructions:
- `BLS_PAIRING` (`0xFCA0`)
- `BLS_G1_MULTIEXP` (`0xFCA1`)
- `BLS_G1_ADD` (`0xFCA2`)
- `BLS_G1_NEG` (`0xFCA3`)

These allow Groth16 verification to complete in **~0.0084 TON** of gas computation, enabling ultra-low transaction costs.

### 4.3 Nullifier Registry & Double-Spending Prevention
- Nullifiers are permanently stored in an on-chain mapping `nullifiers: map<Int as uint256, Bool>`.
- Any attempt to reuse a note will immediately revert on-chain (`require(!self.nullifiers.get(nullifierHash), "Already spent")`).

### 4.4 Upgradability via `SETCODE`
The contract implements non-custodial upgradeability using TVM's `SETCODE` instruction. In the event of circuit optimizations or cryptographic upgrades:
- An authorized upgrade message replaces code cell `c3` while **preserving all storage state** (Merkle trees, accumulated deposits, and spent nullifier registries remain intact).

---

## 5. Gasless Relayer Network

A recipient wishing to preserve complete financial privacy cannot use an existing funded wallet to pay gas on TON without creating an on-chain funding trail.

The **Gasless Relayer Network** solves this dilemma:
1. **Client-Side Generation**: The recipient generates their Groth16 zk-SNARK proof locally in WebAssembly.
2. **Relay Dispatch**: The client submits the proof to the Relayer endpoint (`POST /api/relay` or standalone port `4000`).
3. **Anti-Spam Verification**: The relayer verifies the proof off-chain using the public verification key and checks the contract's nullifier status.
4. **Gas Sponsoring**: The relayer submits the on-chain withdrawal transaction, paying the required TVM execution gas (~0.04 TON).
5. **Direct Execution**: The contract validates the pairing proof and transfers the full pool denomination directly to the recipient's empty wallet.

### Relayer Implementation Modes:
- **Serverless Edge Relayer**: Built directly into Next.js (`frontend/src/app/api/relay/route.ts`) for zero-maintenance Vercel deployments.
- **Dedicated Daemon**: Standalone Express service (`relayer/src/server.ts`) with high-concurrency queueing and automatic rate-limit backoff.
- **Auto-TopUp Sentinel**: Background monitor (`relayer/src/monitor.ts`) tracking relayer balances and funding operations.

---

## 6. Frontend DApp & WebGL Telemetry Globe

The frontend is built with **Next.js 16**, **Tailwind CSS**, and **Turbopack**, following a **Stealth Brutalist & Cryptographic Terminal** aesthetic.

### Key Capabilities:
- **Monochrome Brutalism**: Pitch black (`#000000`) surfaces, crisp `#1C1C1E` borders, and high-readability JetBrains Mono typography. Zero distracting emojis or neon gradients.
- **Real On-Chain 3D WebGL Globe (`NetworkGlobe.tsx`)**:
  - Visualizes **100% REAL on-chain transactions** queried directly from the TON Mainnet Mixer contract via TonCenter RPC.
  - **Zero mock data**: No artificial coordinate loops or continuous fake arcs. Replays verified historical transactions once on mount, then listens exclusively for live block deltas.
- **100% In-Browser Proving**: Generates Groth16 zk-SNARK proofs locally in WebAssembly (`snarkjs`) without sending secret notes over the network.
- **Interactive Transactions Map (`TransactionsMap.tsx`)**: Real-time privacy stream showing live on-chain deposit and withdrawal events with transaction hashes and explorer links.
- **TonConnect Integration**: Deep links and QR codes for Tonkeeper, MyTonWallet, Tonhub, and Telegram Wallet.

---

## 7. Security & Hardening Model

### 7.1 Security Audit Highlights
- **Zero Secrets in Repository**: Full audit completed; all mnemonics, seeds, and private keys purged from current state and git history.
- **Server-Side Credential Isolation**: Relayer mnemonics are stored exclusively in server environment variables (`RELAYER_MNEMONIC`) and are never exposed to client bundles (no `NEXT_PUBLIC_` leakage).
- **Strict Parameter Sanitization**: API routes validate all cryptographic inputs (`piA`, `piB`, `piC`, `root`, `nullifierHash`, `recipient`) with strict format and range checks before submitting to TVM.
- **HTTP Security Headers**: Next.js production configuration enforces `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection`, and `Referrer-Policy: strict-origin-when-cross-origin`.
- **Client-Side Secret Isolation**: Deposit notes (`secret` + `nullifier`) are generated in browser cryptographically secure PRNG memory (`crypto.getRandomValues`). The user is prompted to back up their note offline; notes are never transmitted to any backend.

---

## 8. Repository Layout

```
├── contracts/
│   ├── mixer.tact               # Core TonZkMixer contract (Tact 0.16)
│   └── verifier.tact            # Groth16 Verifier with TVM BLS precompiles
├── circuits/
│   ├── mixer.circom             # Groth16 ZK circuit definition (Circom)
│   ├── mimc.circom              # MiMC-5 permutation circuit
│   ├── merkle_tree.circom       # Incremental tree verification circuit
│   ├── mixer_final.zkey         # Groth16 proving key
│   └── verification_key.json    # Public verification key
├── frontend/                    # Next.js 16 Web Application
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/relay/       # Serverless Gasless Relayer endpoint
│   │   │   ├── page.tsx         # Main DApp interface
│   │   │   └── globals.css      # Brutalist styling system
│   │   ├── components/
│   │   │   ├── DepositCard.tsx  # Deposit flow & note generation
│   │   │   ├── WithdrawCard.tsx # In-browser proving & gasless withdrawal
│   │   │   ├── NetworkGlobe.tsx # 3D WebGL real on-chain transaction globe
│   │   │   ├── TransactionsMap.tsx # Real-time transaction stream
│   │   │   └── AdminDashboard.tsx  # Wallet-gated protocol metrics
│   │   └── lib/
│   │       ├── contracts.ts     # Contract ABI, addresses & pool tiers
│   │       ├── crypto.ts        # In-browser MiMC hasher
│   │       └── prover.ts        # snarkjs in-browser WASM prover
├── relayer/                     # Standalone Gasless Relayer daemon
│   └── src/
│       ├── server.ts            # Relayer HTTP REST server
│       ├── monitor.ts           # Auto-TopUp Sentinel
│       └── wallet.ts            # Relayer wallet management
├── scripts/
│   ├── deploy_mainnet.ts        # Mainnet deployment script
│   ├── deploy_mixer.ts          # Testnet deployment script
│   ├── upgrade_treasury.ts      # SETCODE bytecode upgrade script
│   └── test_gasless_relay.ts    # Relayer integration testing
└── tests/
    └── mixer_sandbox.spec.ts    # Comprehensive TON Sandbox test suite
```

---

## 9. Local Development & Quick Start

### 9.1 Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **pnpm**
- **Circom 2.1+** (if recompiling ZK circuits)

### 9.2 Clone & Install
```bash
git clone https://github.com/mohamedx500/ton-zk-mixer.git
cd ton-zk-mixer

# Install root dependencies
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..

# Install relayer dependencies
cd relayer && npm install && cd ..
```

### 9.3 Environment Setup
Copy the template configuration:
```bash
cp .env.example .env
```

Configure your `.env` variables:
```ini
# Network Selection ('mainnet' or 'testnet')
TON_NETWORK=mainnet
TON_RPC_ENDPOINT=https://toncenter.com/api/v2/jsonRPC
TONCENTER_API_KEY=your_optional_toncenter_api_key

# Smart Contract
MIXER_CONTRACT_ADDRESS=UQBc0izk6rtfjroHgkzP4pEBUHfMCtSS1CGT988kw8DbqY7A

# Relayer Wallet (Required for Gasless Withdrawals)
RELAYER_MNEMONIC="word1 word2 ... word24"

# Client Frontend Settings
NEXT_PUBLIC_TON_NETWORK=mainnet
NEXT_PUBLIC_MIXER_ADDRESS=UQBc0izk6rtfjroHgkzP4pEBUHfMCtSS1CGT988kw8DbqY7A
NEXT_PUBLIC_TON_RPC_ENDPOINT=https://toncenter.com/api/v2/jsonRPC
NEXT_PUBLIC_RELAYER_URL=/api/relay
```

### 9.4 Launch Full Protocol Suite
Launch both the Relayer and Frontend DApp with a single command:
```bash
npm start
```
Or use platform-specific scripts:
- **Windows**: `start.bat`
- **Linux / macOS**: `./start.sh`

The launcher automatically:
1. Verifies circuit binaries (`mixer.wasm`, `mixer_final.zkey`).
2. Cleans up stale background ports (`3000`, `4000`).
3. Starts the Relayer service on `http://localhost:4000`.
4. Starts Next.js with Turbopack on `http://localhost:3000`.

---

## 10. Verification & Automated Test Suite

Run the full end-to-end test suite inside the TON Sandbox virtual machine:

```bash
npm test
```

### Coverage Overview:
- `✓` **Native TON Deposit**: Accepts valid deposits and appends commitment to on-chain Merkle tree.
- `✓` **Groth16 ZK-SNARK Verification**: Validates BLS12-381 pairing and transfers clean funds.
- `✓` **Double-Spend Rejection**: Verifies that spent nullifiers are rejected with code 1002.
- `✓` **Front-Running Prevention**: Verifies that tampered recipient addresses produce invalid proofs.
- `✓` **Dynamic Pool Tiers**: Verifies 9 upfront pool denominations (1 to 1000 TON).
- `✓` **Emergency Safeguards**: Verifies pause, unpause, and owner safety controls.
- `✓` **Contract Upgradeability**: Verifies `SETCODE` preserves full anonymity set across upgrades.

---

## 11. Security Disclaimers

> **Notice**: Cryptographic privacy protocols rely on strict user operational security (OpSec). 
> - Users must securely back up their deposit notes (`ton-zk-note-*.txt`). Lost notes cannot be recovered by anyone, including the protocol administrators.
> - Withdrawing immediately after depositing reduces privacy. For maximum anonymity, allow several deposits from other participants to enter the anonymity set before executing a withdrawal.

---

## 12. License

This project is licensed under the **MIT License**. See [LICENSE](LICENSE) for details.
