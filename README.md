# Universal Zero-Knowledge Mixer Protocol on TON Blockchain

A complete, production-grade, end-to-end Zero-Knowledge Mixer Protocol built for the **The Open Network (TON) Blockchain**. The protocol supports anonymous deposits and withdrawals for **native TON** and **ANY Jetton token (TEP-74)** using **Groth16 zk-SNARKs** over the **BLS12-381** curve with native TVM pairing precompiles.

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
├── scripts/
│   ├── wallet_manager.ts         # Programmatic testnet keypair & balance manager
│   ├── deploy_mixer.ts           # TON Testnet deployment script
│   └── e2e_testnet.ts            # Live TON Testnet end-to-end integration test
├── tests/
│   └── mixer_sandbox.spec.ts     # Comprehensive Sandbox test suite (7/7 tests passing)
├── tact.config.json              # Tact compiler configuration
├── blueprint.config.ts           # Blueprint framework configuration
└── package.json
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
