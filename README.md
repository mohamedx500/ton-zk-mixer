# Universal Zero-Knowledge Mixer Protocol on TON Blockchain

A complete, production-grade, end-to-end Zero-Knowledge Mixer Protocol built for the **The Open Network (TON) Blockchain**. The protocol supports anonymous deposits and withdrawals for **native TON** and **ANY Jetton token (TEP-74)** using **Groth16 zk-SNARKs** over the **BLS12-381** curve with native TVM pairing precompiles.

---

## ⚡ Quick Start: Run the Full App

Launch both the **Gasless Relayer Network** (`http://localhost:4000`) and the **Next.js Web Frontend** (`http://localhost:3000`) with a single command:

```bash
# Recommended cross-platform entry point
npm start
# or
node start.js
```

*Or use native platform launchers:*
```cmd
# Windows (double-click or terminal)
start.bat
```
```bash
# Linux / macOS
chmod +x start.sh
./start.sh
```

This single entry point orchestrates:
1. **Prerequisite & Circuit Verification**: Automatically validates that `mixer.wasm` and `mixer_final.zkey` are present.
2. **Environment Sync**: Automatically mirrors root `.env` to `frontend/.env.local`.
3. **Port Cleanup**: Proactively frees ports 4000 and 3000 from stale background processes.
4. **Relayer Initialization**: Boots the Gasless Relayer Network on `http://localhost:4000` with instant health checks.
5. **Frontend Initialization**: Boots the Next.js DApp on `http://localhost:3000`.
6. **Unified Logging**: Merges color-coded logs and handles clean simultaneous shutdown on `Ctrl + C`.

---

## 🏛️ System Architecture

```
                                +-----------------------------------+
                                |        Off-Chain Client           |
                                |  (Secret, Nullifier, Merkle Tree) |
                                +-----------------+-----------------+
                                                  |
                    1. Deposit Note (Commitment)  |  2. Groth16 Proof (snarkjs)
                                                  v
                                +-----------------------------------+
                                |    TonZkMixer Smart Contract      |
                                |            (Tact)                 |
                                +--------+-----------------+--------+
                                         |                 |
                       3. Verify Pairing |                 | 4. Anonymous Payout
                                         v                 v
                        +----------------+--+    +---------+--------+
                        |  TVM BLS12-381    |    | Clean Recipient  |
                        | Native Pairing    |    |   Wallet (TON /  |
                        | Instructions      |    |     Jettons)     |
                        +-------------------+    +------------------+
```

---

## 🚀 Key Technical Highlights

1. **Universal Jetton & TON Support**:
   - **Native TON**: Fixed denomination deposits and anonymous payouts.
   - **Any Jetton (TEP-74)**: Dynamic asset ID resolution from the incoming `JettonNotification`. The mixer automatically binds token pools without hardcoding specific contracts.
2. **True Zero-Knowledge Privacy**:
   - Built on **BLS12-381** elliptic curve with Groth16 proving system.
   - Native TVM acceleration using `BLS_PAIRING`, `BLS_G1_MULTIEXP`, `BLS_G1_ADD`, and `BLS_G1_NEG`.
   - Off-chain proof generation in under **800ms**.
3. **Double-Spend & Front-Running Immunity**:
   - Nullifier replay protection: spent nullifiers are tracked permanently in a persistent bit-map.
   - Recipient and asset binding in Circom: proofs cannot be front-run, replayed, or stolen by relayers.
4. **Upgradable Smart Contract Architecture**:
   - Integrated `UpgradeCode` method using TVM's `SETCODE` instruction. The contract bytecode can be upgraded seamlessly by the admin without redeployment and without losing the anonymity set.
5. **Emergency Safeguards**:
   - Admin `SetPaused` mechanism to halt deposits and withdrawals during protocol audits.
   - `EmergencyRescue` function allowing recovery of native TON or Jettons in critical scenarios.

---

## 📁 Repository Structure

```
ZK-SNARKs/
├── circuits/
│   ├── mimc.circom               # MiMC-5 algebraic round permutation over BLS12-381
│   ├── merkle_tree.circom        # Incremental Merkle tree inclusion proof circuit
│   ├── mixer.circom              # Main Mixer ZK Circuit (8-level depth, 256 capacity)
│   ├── compile.js                # ZK compilation pipeline (Powers of Tau + Groth16 + Tact verifier)
│   └── mixer_js/                 # Compiled WASM witness generator
├── contracts/
│   ├── mixer.tact                # Main TonZkMixer smart contract in Tact
│   └── verifier.tact             # Standalone Tact Groth16 Verifier (via export-ton-verifier)
├── client/
│   ├── crypto.ts                 # Off-chain MiMC hashing, note generation, and Merkle tree
│   ├── prover.ts                 # snarkjs Groth16 proof generation and TVM cell packing
│   └── mixer_sdk.ts              # High-level client SDK for DApps and relayers
├── relayer/                      # Standalone Gasless Relayer Network
│   ├── src/
│   │   ├── server.ts             # Express REST API (POST /relay, GET /health, GET /status)
│   │   ├── verifier.ts           # Anti-spam Groth16 & on-chain state verification engine
│   │   ├── wallet.ts             # Relayer TON wallet manager & throttled TonClient
│   │   ├── init_wallet.ts        # Automated wallet generator & balance checker
│   │   └── config.ts             # Gas parameters & contract addresses
│   ├── config/
│   │   └── verification_key.json # BLS12-381 Groth16 verification key for off-chain checks
│   └── package.json
├── frontend/                     # Next.js 14 Web Application
│   ├── src/
│   │   ├── components/
│   │   │   ├── DepositCard.tsx   # Client-side deposit note generation & TonConnect integration
│   │   │   ├── WithdrawCard.tsx  # Gasless Relayer toggle & in-browser ZK prover
│   │   │   ├── StatsCard.tsx     # Live Merkle tree stats & on-chain metrics
│   │   │   └── Navbar.tsx        # TonConnect wallet button & network badge
│   │   └── lib/
│   │       ├── crypto.ts         # In-browser MiMC hasher & incremental Merkle tree
│   │       ├── prover.ts         # In-browser snarkjs WASM prover & BLS12-381 point compression
│   │       └── ton.ts            # Throttled TON RPC client with auto-retry
│   └── package.json
├── scripts/
│   ├── wallet_manager.ts         # Programmatic testnet keypair & balance manager
│   ├── deploy_mixer.ts           # TON Testnet deployment script
│   ├── e2e_testnet.ts            # Live TON Testnet end-to-end integration test
│   └── test_gasless_relay.ts     # Gasless Relayer end-to-end integration test
├── tests/
│   └── mixer_sandbox.spec.ts     # Comprehensive Sandbox test suite (7/7 tests passing)
├── tact.config.json              # Tact compiler configuration
├── blueprint.config.ts           # Blueprint framework configuration
└── package.json
```

---

## ⚡ Gasless Relayer Network (`/relayer`)

The Relayer Network constitutes the final privacy layer of the protocol, enabling users to withdraw to **completely fresh, empty wallets with 0 TON balance** by having the Relayer sponsor the gas fees on-chain.

```
+-------------------------------------------------------------------------------+
| User with 0 TON Balance (Bob)                                                 |
| 1. Generates local Groth16 Proof (snarkjs in WebAssembly)                     |
| 2. Sends proof via HTTP POST /relay to local Relayer                          |
+------------------------------------+------------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------------+
| Relayer Server (port 4000)                                                    |
| 1. Anti-Spam Check: snarkjs.groth16.verify(vkey, signals, proof) off-chain    |
| 2. Signal Binding: Check recipientScalar == addressToScalar(recipient)       |
| 3. State Check: isNullifierSpent == false && isKnownRoot == true               |
| 4. Broadcasts Withdraw tx with Relayer's gas to Mixer contract                |
+------------------------------------+------------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------------+
| TON Testnet Blockchain                                                        |
| Mixer verifies TVM BLS12-381 pairing -> Pays out 1.0 TON to fresh Bob wallet! |
+-------------------------------------------------------------------------------+
```

### Running the Relayer:
```bash
cd relayer
npm run start
```

### End-to-End Gasless Relay Test:
```bash
npx ts-node scripts/test_gasless_relay.ts
```

---

## 🧪 Testing & Verification

Run the full automated test suite in the TON Sandbox:

```bash
npm run e2e
```

**Test Suite Coverage (7/7 Passed):**
- ✔ 1. Should accept native TON deposit and update on-chain Merkle tree
- ✔ 2. Should verify ZK-SNARK Groth16 proof on-chain and anonymously withdraw TON
- ✔ 3. Safeguard: Should prevent double-spending the same nullifier
- ✔ 4. Safeguard: Should reject proof tampering / front-running attack
- ✔ 5. Universal Jetton Support: Should handle dynamic Jetton deposit and anonymous withdrawal
- ✔ 6. Emergency Safeguards: Pause, Unpause, and Emergency Rescue
- ✔ 7. Upgradable Architecture: Code upgrade via set_code preserves state and anonymity set

---

## 💰 Protocol Monetization & Admin Telemetry Dashboard

### 1. On-Chain Fee Mechanism
- **1% Protocol Fee Split**: When a valid Groth16 proof is verified, the contract splits the pool denomination:
  - Clean recipient receives `(Total_Amount - Fee)` (e.g. `0.99 TON` for 1.0 TON pool) with `bounce: false`.
  - Protocol fee (`0.01 TON`) is routed directly to the predefined admin wallet: `UQDvCkYWzfC7jf11EwKMvy_4WolQeltsPpFxwJoGtiMdCr0M`.
- **Seamless Upgrade via SETCODE**: Upgraded on-chain using `UpgradeCode` instruction without losing deposit commitments, nullifiers, or Merkle tree history.
  ```bash
  npx ts-node scripts/upgrade_fee_model.ts
  ```

### 2. Exclusive Wallet-Gated Admin Dashboard
- **Authentication Guard**: Uses `@tonconnect/ui-react` and `@ton/core` `Address.parse().toString()` to strictly verify the connected wallet matches `UQDvCkYWzfC7jf11EwKMvy_4WolQeltsPpFxwJoGtiMdCr0M`.
- **Navbar Integration**: Renders an exclusive "Admin Panel" tab with an amber badge for the administrator, while hiding it completely from regular users.
- **On-Chain Telemetry**:
  - **Protocol TVL**: Live total value locked in the mixer smart contract.
  - **Admin Fees Earned**: Total accumulated fees calculated from verified on-chain withdrawal events.
  - **Recent Deposits Table**: Chronological table showing timestamps, amounts, and 256-bit commitment hashes.
  - **Recent Withdrawals & Fees Table**: Recipient addresses, amounts received, and admin fee cuts (`+0.01 TON`).
  - **ZK Anonymity Set Assurance**: Guarantees that deposits and withdrawals are cryptographically unlinked, preserving the transaction graph privacy.


