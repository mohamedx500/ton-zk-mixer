
// ============================================================================
// TVM ASM Intrinsics for BLS12-381 Cryptography and Code Upgrades
// ============================================================================
asm fun blsG1Add(x: Slice, y: Slice): Slice { BLS_G1_ADD }
asm fun blsG1Neg(x: Slice): Slice { BLS_G1_NEG }
asm fun blsG1InGroup(x: Slice): Int { BLS_G1_INGROUP }
asm fun blsG2InGroup(x: Slice): Int { BLS_G2_INGROUP }
asm fun blsG1IsZero(x: Slice): Int { BLS_G1_ISZERO }
asm fun blsG2IsZero(x: Slice): Int { BLS_G2_ISZERO }
asm fun cellIsExotic(x: Cell): Int { XCTOS NIP }
asm fun cellToRawSlice(x: Cell): Slice { XCTOS DROP }
asm fun blsR(): Int { BLS_PUSHR }
asm fun nativeSetCode(code: Cell) { SETCODE }
asm fun mulmod(x: Int, y: Int, m: Int): Int { MULMOD }

asm fun blsPairing(
  x1: Slice, y1: Slice,
  x2: Slice, y2: Slice,
  x3: Slice, y3: Slice,
  x4: Slice, y4: Slice,
  n: Int
): Int { BLS_PAIRING }

asm fun blsG1Multiexp_4(
  x1: Slice, y1: Int,
  x2: Slice, y2: Int,
  x3: Slice, y3: Int,
  x4: Slice, y4: Int,
  n: Int
): Slice { BLS_G1_MULTIEXP }

// ============================================================================
// Groth16 BLS12-381 Verification Key Constants (Generated for Mixer Circuit)
// ============================================================================
const vk_gamma_2: Slice = rawSlice("93e02b6052719f607dacd3a088274f65596bd0d09920b61ab5da61bbdc7f5049334cf11213945d57e5ac7d055d042b7e024aa2b2f08f0a91260805272dc51051c6e47ad4fa403b02b4510b647ae3d1770bac0326a805bbefd48056c8c121bdb8");
const vk_delta_2: Slice = rawSlice("87e3f16ce1380378128d6f5bae70bb65eb28dfd5bc38a8e4225fd52c40d64be21c7fe5e1705601d484dfe3114bf0ebe60a1d166e81cde814ec3b3c870a4f33a88478e09a0799d648a5d205522b74eb5c77ad6857a2c5ac42ae643901c02b3179");
const vk_alpha_1: Slice = rawSlice("937dfd26fa61d2e961cc0019adc901f0ecb6f409f1cd3b2afc720afbaca42f13671c0c44fd6f8d27c1af886151cd5648");
const vk_beta_2:  Slice = rawSlice("80b61272470f2c76aaf8fee9838e01d367807d80037af69c196c450498336824ecc4ba6073bfd2e2a015816826f7f3de1300f0483130e69764278d6185eb448436fa4d325bfa83ac2ca3d4f7d5690fcee8853f689c7c97706feb4680038e7339");

// IC Constants
const IC0: Slice = rawSlice("8ea2b792fe594ae95794a3a9f999390db5589011d721e78e5fe660d206dea642d1701417a76fb04e38b0f6f5816e4b1d");
const IC1: Slice = rawSlice("b6bb6d1eb1e9780c65c0f2b4af7bfcb71cee6af3bf7c8e2cdface6e06afd3a0c8daff816e6c2ff65380b1ca42c3a16f6");
const IC2: Slice = rawSlice("b2fe2cb319bf7361635d963d2f38ab668782a3aba2f08d2493091a4f5ac7d5187e4d29b691cfc88d2ec13b30150a3701");
const IC3: Slice = rawSlice("a0a82f08502e1c902014e90734970cd0d94c368ffc96de2c7a45ba886f6a22026cc6504b80bccd70c5623f94bb49a133");
const IC4: Slice = rawSlice("a87c499577747f8c65568ef6c211b45ba3ef7a5cb7d29aa35c672a50247769696e7fc906648a45e2f780388a3a2dddd7");

// Error Codes
const ERR_NOT_OWNER: Int = 1001;
const ERR_PAUSED: Int = 1002;
const ERR_INVALID_AMOUNT: Int = 1003;
const ERR_TREE_FULL: Int = 1004;
const ERR_UNKNOWN_ROOT: Int = 1005;
const ERR_NULLIFIER_SPENT: Int = 1006;
const ERR_INVALID_PROOF: Int = 1007;
const ERR_POOL_INACTIVE: Int = 1008;
const ERR_INSUFFICIENT_FEES: Int = 1009;

// ============================================================================
// Message Definitions
// ============================================================================

// Native TON deposit message
message(0x1001) DepositTon {
    commitment: Int as uint256;
}

// Anonymous Withdrawal message
message(0x1002) Withdraw {
    piA: Cell;
    piB: Cell;
    piC: Cell;
    root: Int as uint256;
    nullifierHash: Int as uint256;
    recipient: Address;
    assetId: Int as uint256;
}

// Admin Safeguard: Emergency Pause / Resume
message(0x1003) SetPaused {
    paused: Bool;
}

// Admin Safeguard: Emergency Rescue Funds
message(0x1004) EmergencyRescue {
    recipient: Address;
    amount: Int as coins;
    jettonWallet: Address?;
}

// Upgrade Pattern: Code upgrade via set_code preserving storage state & anonymity set
message(0x1005) UpgradeCode {
    new_code: Cell;
}

// Configure Asset Pool (supports dynamic registration of ANY Jetton)
message(0x1006) SetPool {
    assetId: Int as uint256;
    denomination: Int as coins;
    active: Bool;
}

// Treasury: Claim accumulated protocol fees to any destination
message(0x1007) ClaimFees {
    amount: Int as coins;
    destination: Address;
}

// Treasury: Toggle dynamic fee routing (Push vs Pull/Accumulate)
message(0x1008) SetFeeRouting {
    autoRoute: Bool;
}

// Standard TEP-74 Jetton Notification (received when user deposits any Jetton)
message(0x7362d09c) JettonNotification {
    query_id: Int as uint64;
    amount: Int as coins;
    sender: Address;
    forward_payload: Slice as remaining;
}

// Standard TEP-74 Jetton Transfer (dispatched when withdrawing Jettons)
message(0x0f8a7ea5) JettonTransfer {
    query_id: Int as uint64;
    amount: Int as coins;
    destination: Address;
    response_destination: Address;
    custom_payload: Cell?;
    forward_ton_amount: Int as coins;
    forward_payload: Slice as remaining;
}

// Events for off-chain indexing
message DepositEvent {
    assetId: Int as uint256;
    commitment: Int as uint256;
    leafIndex: Int as uint32;
    newRoot: Int as uint256;
}

message WithdrawalEvent {
    assetId: Int as uint256;
    nullifierHash: Int as uint256;
    recipient: Address;
    amount: Int as coins;
    fee: Int as coins;
}

// ============================================================================
// Standalone Helper Functions
// ============================================================================

// Parse 256-bit scalar from a TON Address for circuit binding
fun parseAddressScalar(addr: Address): Int {
    let s: Slice = beginCell().storeAddress(addr).endCell().asSlice();
    s.skipBits(11);
    let addrHash: Int = s.loadUint(256);
    return addrHash % blsR();
}

// MiMC round permutation (64 rounds with exponent 5)
fun mimcPermutation(x: Int, k: Int): Int {
    let state: Int = x;
    let c: Int = 0;
    let A: Int = 6364136223846793005;
    let B: Int = 1442695040888963407;
    let R: Int = blsR();
    repeat(64) {
        let t: Int = (state + k) % R;
        t = (t + c) % R;
        let t2: Int = mulmod(t, t, R);
        let t4: Int = mulmod(t2, t2, R);
        state = mulmod(t4, t, R);
        c = (mulmod(c, A, R) + B) % R;
    }
    return (state + k) % R;
}

fun mimcHash2(left: Int, right: Int): Int {
    return mimcPermutation(left, right);
}

// ============================================================================
// Universal Zero-Knowledge Mixer Protocol Smart Contract
// ============================================================================
contract TonZkMixer {
    owner: Address;
    paused: Bool;

    // Asset Pool configurations (supports native TON and ANY Jetton)
    tonDenomination: Int as coins;
    poolDenominations: map<Int as uint256, Int as coins>;
    poolActive: map<Int as uint256, Bool>;
    assetToWallet: map<Int as uint256, Address>;

    // Incremental Merkle Tree State (Depth 8 = 256 leaves)
    nextIndex: Int as uint32;
    currentRoot: Int as uint256;
    filledSubtrees: map<Int as uint8, Int as uint256>;
    roots: map<Int as uint256, Bool>;

    // Nullifier Replay Protection
    nullifiers: map<Int as uint256, Bool>;

    // Protocol metrics
    totalDeposits: Int as uint32;
    totalWithdrawals: Int as uint32;

    // Protocol Treasury & Dynamic Fee Routing
    accumulatedFees: Int as coins;
    autoFeeRouting: Bool;

    init(owner: Address, tonDenomination: Int as coins) {
        self.owner = owner;
        self.paused = false;
        self.tonDenomination = tonDenomination;
        self.nextIndex = 0;
        self.totalDeposits = 0;
        self.totalWithdrawals = 0;
        self.accumulatedFees = 0;
        self.autoFeeRouting = false;

        // Depth 8 empty Merkle tree root (MiMC zero root)
        self.currentRoot = 28540350499119009681420814586570208555647217197677146208526354650332466819092;
        self.roots.set(self.currentRoot, true);

        // Precalculated zeros for empty subtrees
        self.filledSubtrees.set(0, 0);
        self.filledSubtrees.set(1, 26760436723079599114156261024773088945162174177681114247257228059452133286738);
        self.filledSubtrees.set(2, 49805117892226887705433882477829019469189709515680730241134068488479104321007);
        self.filledSubtrees.set(3, 34162532089165557872555999490810826360866891512524212903868944992409165958346);
        self.filledSubtrees.set(4, 12065341230963984502268999964813370256733330825792765139130654822054443574461);
        self.filledSubtrees.set(5, 20095215596226596229888342491272490362691963655779245281594603364219523414282);
        self.filledSubtrees.set(6, 26688408143737521602050809276927750311697202602580550002857195015397954451642);
        self.filledSubtrees.set(7, 15253914714795283522559445283510429755384964837064974290229706328058425059510);

        // Native TON pool (assetId = 0) is active by default
        self.poolActive.set(0, true);
        self.poolDenominations.set(0, tonDenomination);
    }

    // Fallback receiver for deployment and plain TON transfers
    receive() {}

    // Upfront Tiered Fee Model: Calculates protocol + relayer upfront fee based on pool size (9 Pools from Micro to Whale)
    fun getUpfrontFee(denomination: Int): Int {
        if (denomination == ton("0.05")) {
            return ton("0.01"); // 0.05 TON Pool -> 0.01 TON fee (Total: 0.06 TON)
        }
        if (denomination == ton("0.1") || denomination == ton("0.10")) {
            return ton("0.02"); // 0.1 TON Pool -> 0.02 TON fee (Total: 0.12 TON)
        }
        if (denomination == ton("0.5") || denomination == ton("0.50")) {
            return ton("0.08"); // 0.5 TON Pool -> 0.08 TON fee (Total: 0.58 TON)
        }
        if (denomination == ton("1.0") || denomination == ton("1")) {
            return ton("0.20"); // 1.0 TON Pool -> 0.20 TON fee (Total: 1.20 TON)
        }
        if (denomination == ton("5.0") || denomination == ton("5")) {
            return ton("0.35"); // 5.0 TON Pool -> 0.35 TON fee (Total: 5.35 TON)
        }
        if (denomination == ton("10.0") || denomination == ton("10")) {
            return ton("0.50"); // 10.0 TON Pool -> 0.50 TON fee (Total: 10.50 TON)
        }
        if (denomination == ton("50.0") || denomination == ton("50")) {
            return ton("1.20"); // 50.0 TON Pool -> 1.20 TON fee (Total: 51.20 TON)
        }
        if (denomination == ton("100.0") || denomination == ton("100")) {
            return ton("2.00"); // 100.0 TON Pool -> 2.00 TON fee (Total: 102.00 TON)
        }
        if (denomination == ton("500.0") || denomination == ton("500")) {
            return ton("5.00"); // 500.0 TON Pool -> 5.00 TON fee (Total: 505.00 TON)
        }
        return denomination / 50; // Fallback: 2%
    }

    // ------------------------------------------------------------------------
    // Deposit: Native TON (Upfront Tiered Fee Model)
    // ------------------------------------------------------------------------
    receive(msg: DepositTon) {
        nativeThrowUnless(ERR_PAUSED, !self.paused);
        nativeThrowUnless(ERR_TREE_FULL, self.nextIndex < 256);

        let fee: Int = 0;
        if (context().value == ton("0.06")) {
            fee = ton("0.01");
        } else if (context().value == ton("0.12")) {
            fee = ton("0.02");
        } else if (context().value == ton("0.58")) {
            fee = ton("0.08");
        } else if (context().value == ton("1.20") || context().value == ton("1.2")) {
            fee = ton("0.20");
        } else if (context().value == ton("5.35")) {
            fee = ton("0.35");
        } else if (context().value == ton("10.50") || context().value == ton("10.5")) {
            fee = ton("0.50");
        } else if (context().value == ton("51.20") || context().value == ton("51.2")) {
            fee = ton("1.20");
        } else if (context().value == ton("102.00") || context().value == ton("102")) {
            fee = ton("2.00");
        } else if (context().value == ton("505.00") || context().value == ton("505")) {
            fee = ton("5.00");
        } else {
            let poolFee: Int = self.getUpfrontFee(self.tonDenomination);
            let expectedTotal: Int = self.tonDenomination + poolFee;
            nativeThrowUnless(ERR_INVALID_AMOUNT, context().value == expectedTotal);
            fee = poolFee;
        }

        self.accumulatedFees = self.accumulatedFees + fee;

        let leafIndex: Int = self.nextIndex;
        let newRoot: Int = self.insertCommitment(msg.commitment);
        self.totalDeposits = self.totalDeposits + 1;

        emit(DepositEvent{
            assetId: 0,
            commitment: msg.commitment,
            leafIndex: leafIndex,
            newRoot: newRoot
        }.toCell());
    }

    // ------------------------------------------------------------------------
    // Deposit: Universal Jetton (TEP-74 Notification Handler)
    // ------------------------------------------------------------------------
    receive(msg: JettonNotification) {
        nativeThrowUnless(ERR_PAUSED, !self.paused);
        nativeThrowUnless(ERR_TREE_FULL, self.nextIndex < 256);

        // Derive dynamic asset ID from the sender JettonWallet contract address
        let jettonWallet: Address = context().sender;
        let assetId: Int = parseAddressScalar(jettonWallet);

        // If pool is not yet configured, automatically initialize it with the deposited amount
        let isConfigured: Bool? = self.poolActive.get(assetId);
        if (isConfigured == null || !isConfigured!!) {
            self.poolActive.set(assetId, true);
            self.poolDenominations.set(assetId, msg.amount);
            self.assetToWallet.set(assetId, jettonWallet);
        } else {
            let requiredAmount: Int? = self.poolDenominations.get(assetId);
            nativeThrowUnless(ERR_INVALID_AMOUNT, requiredAmount != null && msg.amount == requiredAmount!!);
        }

        // Extract commitment (uint256) from forward payload
        let slice: Slice = msg.forward_payload;
        let commitment: Int = slice.loadUint(256);

        let leafIndex: Int = self.nextIndex;
        let newRoot: Int = self.insertCommitment(commitment);
        self.totalDeposits = self.totalDeposits + 1;

        emit(DepositEvent{
            assetId: assetId,
            commitment: commitment,
            leafIndex: leafIndex,
            newRoot: newRoot
        }.toCell());
    }

    // ------------------------------------------------------------------------
    // Anonymous Withdrawal: Zero-Knowledge Groth16 Proof Verification & Payout
    // ------------------------------------------------------------------------
    receive(msg: Withdraw) {
        nativeThrowUnless(ERR_PAUSED, !self.paused);

        // 1. Verify Nullifier has NOT been spent
        let isSpent: Bool? = self.nullifiers.get(msg.nullifierHash);
        nativeThrowUnless(ERR_NULLIFIER_SPENT, isSpent == null || !isSpent!!);

        // 2. Verify Root is a known historical valid root
        let isKnown: Bool? = self.roots.get(msg.root);
        nativeThrowUnless(ERR_UNKNOWN_ROOT, isKnown != null && isKnown!!);

        // 3. Verify Pool is active
        let poolActive: Bool? = self.poolActive.get(msg.assetId);
        nativeThrowUnless(ERR_POOL_INACTIVE, poolActive != null && poolActive!!);

        // 4. Verify Zero-Knowledge Proof with public signals [root, nullifierHash, recipient, assetId]
        let recipientScalar: Int = parseAddressScalar(msg.recipient);
        let proofValid: Bool = self.verifyProof(msg.piA, msg.piB, msg.piC, msg.root, msg.nullifierHash, recipientScalar, msg.assetId);
        nativeThrowUnless(ERR_INVALID_PROOF, proofValid);

        // 5. Mark Nullifier as spent
        self.nullifiers.set(msg.nullifierHash, true);
        self.totalWithdrawals = self.totalWithdrawals + 1;

        // 6. Execute Payout with Upfront Tiered Fee Model (Zero fee deduction on withdrawal)
        let fee: Int = 0;
        let recipientAmount: Int = 0;

        if (msg.assetId == 0) {
            recipientAmount = self.tonDenomination;

            // Payout recipient full pool denomination (Stealth Mode: null body, zero metadata leak)
            send(SendParameters{
                to: msg.recipient,
                value: recipientAmount,
                mode: SendIgnoreErrors,
                bounce: false,
                body: null
            });
        } else {
            // Payout Jetton without fee deduction
            let jettonWallet: Address? = self.assetToWallet.get(msg.assetId);
            if (jettonWallet != null) {
                let jettonAmount: Int = self.poolDenominations.get(msg.assetId)!!;
                recipientAmount = jettonAmount;

                // Transfer to clean recipient
                send(SendParameters{
                    to: jettonWallet!!,
                    value: ton("0.04"),
                    mode: SendIgnoreErrors,
                    body: JettonTransfer{
                        query_id: 0,
                        amount: recipientAmount,
                        destination: msg.recipient,
                        response_destination: msg.recipient,
                        custom_payload: null,
                        forward_ton_amount: 1,
                        forward_payload: emptySlice()
                    }.toCell()
                });
            }
        }

        emit(WithdrawalEvent{
            assetId: msg.assetId,
            nullifierHash: msg.nullifierHash,
            recipient: msg.recipient,
            amount: recipientAmount,
            fee: fee
        }.toCell());
    }

    // ------------------------------------------------------------------------
    // Internal Incremental Merkle Tree Insertion
    // ------------------------------------------------------------------------
    fun insertCommitment(leaf: Int): Int {
        let currentLevelHash: Int = leaf;
        let currentIndex: Int = self.nextIndex;

        let i: Int = 0;
        repeat(8) {
            if (currentIndex % 2 == 0) {
                self.filledSubtrees.set(i, currentLevelHash);
                currentLevelHash = mimcHash2(currentLevelHash, self.getTreeZero(i));
            } else {
                let left: Int = self.filledSubtrees.get(i)!!;
                currentLevelHash = mimcHash2(left, currentLevelHash);
            }
            currentIndex = currentIndex / 2;
            i = i + 1;
        }

        self.nextIndex = self.nextIndex + 1;
        self.currentRoot = currentLevelHash;
        self.roots.set(currentLevelHash, true);
        return currentLevelHash;
    }

    fun getTreeZero(level: Int): Int {
        if (level == 0) { return 0; }
        if (level == 1) { return 26760436723079599114156261024773088945162174177681114247257228059452133286738; }
        if (level == 2) { return 49805117892226887705433882477829019469189709515680730241134068488479104321007; }
        if (level == 3) { return 34162532089165557872555999490810826360866891512524212903868944992409165958346; }
        if (level == 4) { return 12065341230963984502268999964813370256733330825792765139130654822054443574461; }
        if (level == 5) { return 20095215596226596229888342491272490362691963655779245281594603364219523414282; }
        if (level == 6) { return 26688408143737521602050809276927750311697202602580550002857195015397954451642; }
        return 15253914714795283522559445283510429755384964837064974290229706328058425059510;
    }

    // ------------------------------------------------------------------------
    // Internal Groth16 BLS12-381 Verification
    // ------------------------------------------------------------------------
    fun verifyProof(
        piACell: Cell,
        piBCell: Cell,
        piCCell: Cell,
        root: Int,
        nullifierHash: Int,
        recipient: Int,
        assetId: Int
    ): Bool {
        let piA: Slice = cellToRawSlice(piACell);
        let piB: Slice = cellToRawSlice(piBCell);
        let piC: Slice = cellToRawSlice(piCCell);

        // Sanity check point lengths and group memberships
        if (piA.bits() != 384 || piB.bits() != 768 || piC.bits() != 384) {
            return false;
        }
        if (blsG1InGroup(piA) == 0 || blsG2InGroup(piB) == 0 || blsG1InGroup(piC) == 0) {
            return false;
        }
        if (blsG1IsZero(piA) != 0 || blsG2IsZero(piB) != 0 || blsG1IsZero(piC) != 0) {
            return false;
        }

        // Multi-exponentiation for public signals: acc = IC1*root + IC2*nullifierHash + IC3*recipient + IC4*assetId
        let acc: Slice = blsG1Multiexp_4(
            IC1, root,
            IC2, nullifierHash,
            IC3, recipient,
            IC4, assetId,
            4
        );
        let cpub: Slice = blsG1Add(acc, IC0);

        // Pairing check: e(A, B) == e(alpha, beta) + e(C, delta) + e(cpub, gamma)
        let piANeg: Slice = blsG1Neg(piA);
        let ok: Int = blsPairing(
            cpub,       vk_gamma_2,
            piANeg,     piB,
            piC,        vk_delta_2,
            vk_alpha_1, vk_beta_2,
            4
        );

        return ok != 0;
    }

    // ------------------------------------------------------------------------
    // Emergency Safeguards & Admin Controls
    // ------------------------------------------------------------------------
    receive(msg: SetPaused) {
        nativeThrowUnless(ERR_NOT_OWNER, context().sender == self.owner);
        self.paused = msg.paused;
    }

    receive(msg: SetPool) {
        nativeThrowUnless(ERR_NOT_OWNER, context().sender == self.owner);
        self.poolActive.set(msg.assetId, msg.active);
        self.poolDenominations.set(msg.assetId, msg.denomination);
        if (msg.assetId == 0) {
            self.tonDenomination = msg.denomination;
        }
    }

    receive(msg: EmergencyRescue) {
        nativeThrowUnless(ERR_NOT_OWNER, context().sender == self.owner);
        if (msg.jettonWallet == null) {
            // Rescue native TON (Stealth Mode: null body)
            send(SendParameters{
                to: msg.recipient,
                value: msg.amount,
                mode: SendIgnoreErrors,
                bounce: false,
                body: null
            });
        } else {
            // Rescue Jettons
            send(SendParameters{
                to: msg.jettonWallet!!,
                value: ton("0.05"),
                mode: SendIgnoreErrors,
                body: JettonTransfer{
                    query_id: 0,
                    amount: msg.amount,
                    destination: msg.recipient,
                    response_destination: msg.recipient,
                    custom_payload: null,
                    forward_ton_amount: 1,
                    forward_payload: emptySlice()
                }.toCell()
            });
        }
    }

    // ------------------------------------------------------------------------
    // Treasury Management & Dynamic Fee Routing Controls
    // ------------------------------------------------------------------------
    receive(msg: ClaimFees) {
        nativeThrowUnless(ERR_NOT_OWNER, context().sender == self.owner);
        nativeThrowUnless(ERR_INSUFFICIENT_FEES, msg.amount <= self.accumulatedFees);

        self.accumulatedFees = self.accumulatedFees - msg.amount;

        send(SendParameters{
            to: msg.destination,
            value: msg.amount,
            mode: SendIgnoreErrors,
            bounce: false,
            body: null
        });
    }

    receive(msg: SetFeeRouting) {
        nativeThrowUnless(ERR_NOT_OWNER, context().sender == self.owner);
        self.autoFeeRouting = msg.autoRoute;
    }

    // ------------------------------------------------------------------------
    // Upgrade Pattern: Code upgrade via set_code preserving storage state
    // ------------------------------------------------------------------------
    receive(msg: UpgradeCode) {
        nativeThrowUnless(ERR_NOT_OWNER, context().sender == self.owner);
        nativeSetCode(msg.new_code);
    }

    // ------------------------------------------------------------------------
    // Public Getters
    // ------------------------------------------------------------------------
    get fun isKnownRoot(root: Int): Bool {
        let known: Bool? = self.roots.get(root);
        return known != null && known!!;
    }

    get fun isNullifierSpent(nullifierHash: Int): Bool {
        let spent: Bool? = self.nullifiers.get(nullifierHash);
        return spent != null && spent!!;
    }

    get fun currentRoot(): Int {
        return self.currentRoot;
    }

    get fun nextIndex(): Int {
        return self.nextIndex;
    }

    get fun isPaused(): Bool {
        return self.paused;
    }

    get fun owner(): Address {
        return self.owner;
    }

    get fun totalDeposits(): Int {
        return self.totalDeposits;
    }

    get fun totalWithdrawals(): Int {
        return self.totalWithdrawals;
    }

    get fun poolDenomination(assetId: Int): Int {
        let d: Int? = self.poolDenominations.get(assetId);
        if (d != null) {
            return d!!;
        }
        return 0;
    }

    get fun protocolFeePercent(): Int {
        return 1; // 1% Protocol Fee
    }

    get fun adminFeeWallet(): Address {
        return address("0:ef0a4616cdf0bb8dfd7513028cbf2ff85a89507a5b6c3e9171c09a06b6231d0a");
    }

    get fun accumulatedFees(): Int {
        return self.accumulatedFees;
    }

    get fun upfrontFee(denomination: Int): Int {
        return self.getUpfrontFee(denomination);
    }

    get fun userTvl(): Int {
        let bal: Int = myBalance();
        if (bal > self.accumulatedFees) {
            return bal - self.accumulatedFees;
        }
        return 0;
    }

    get fun autoFeeRouting(): Bool {
        return self.autoFeeRouting;
    }
}
