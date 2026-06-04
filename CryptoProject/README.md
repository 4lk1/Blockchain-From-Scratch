# 🔗 Blockchain from Scratch

**A complete, educational blockchain implementation in Python with cryptographic security, interactive visualizer, and security demonstrations.**

> **Start here**: See [INDEX.md](INDEX.md) for complete project structure and documentation.

## Quick Start

### Web Interface (Recommended)
```bash
python app.py
# Opens at http://localhost:5000
```

### Install Dependencies
```bash
pip install -r requirements.txt
```

## What's Inside

✓ **Core Blockchain**: Blocks, transactions, mining consensus  
✓ **Cryptography**: SHA-256 hashing + RSA-2048 signatures  
✓ **Web Interface**: Interactive visualizer with 5 demo tabs  
✓ **REST API**: 10+ endpoints (all tested)  
✓ **Security Demos**: 51% attack, tampering, hash analysis  
✓ **Education**: Complete code examples and explanations  

## Quick Navigation

| Goal | Command | Details |
|------|---------|----------|
| Learn Everything | See [INDEX.md](INDEX.md) | Complete file guide and project map |
| Run Web Demo | `python app.py` | Visual blockchain explorer |
| Run Security Tests | `python security_demo.py` | 3 security demonstrations |
| Test API | `python test_api.py` | 10 endpoint tests |
| Interactive Menu | `python main.py` | Menu-based exploration |
| Complete Example | `python example_complete.py` | Full workflow in one script |
  - `mine_block(difficulty)`: Perform Proof-of-Work
  - Properties: index, timestamp, transactions, previous_hash, nonce

### `transaction.py`
- **Transaction class**: Represents a digital transaction
  - `sign_transaction()`: Sign with RSA private key
  - `verify_signature()`: Verify transaction authenticity
  - Properties: sender, receiver, amount, timestamp, signature

- **Wallet class**: Manages public/private key pairs
  - RSA-2048 key generation
  - Simplified address generation via SHA-256
  - `create_transaction()`: Create and sign transactions

### `blockchain.py`
- **Blockchain class**: Main blockchain implementation
  - `create_genesis_block()`: Initialize chain with first block
  - `mine_pending_transactions()`: Mine a new block
  - `is_chain_valid()`: Validate entire chain integrity
  - `get_balance()`: Calculate address balance
  - `get_transaction_history()`: Retrieve address transactions

### `security_demo.py`
- `demo_resistance_to_manipulation()`: Show tampering detection
- `demo_51_percent_attack()`: Simulate majority mining attack
- `demo_hash_distribution()`: Demonstrate Proof-of-Work effort

### `main.py`
- Interactive menu system
- Transaction demonstrations
- Blockchain explorer
- Comprehensive test suite

## Installation & Usage

### Prerequisites
- Python 3.8+
- `cryptography` library

### Setup

```bash
# Navigate to project directory
cd /home/thearchitect/Uni/CryptoProject

# Install dependencies
pip install -r requirements.txt
```

### Running the Program

```bash
# Start the interactive menu
python main.py
```

### Menu Options

1. **Basic Blockchain Demo**
   - Create wallets
   - Perform transactions
   - Mine blocks
   - View blockchain and balances

2. **Security Demonstrations**
   - Manipulation resistance
   - 51% attack simulation
   - Hash distribution analysis

3. **Interactive Explorer**
   - Query blockchain state
   - Check balances
   - View transaction history
   - Add transactions and mine blocks

4. **Test Suite**
   - Genesis block creation
   - Transaction validation
   - Proof-of-Work verification
   - Chain integrity checks
   - Manipulation detection

## Cryptographic Details

### Hashing
- **Algorithm**: SHA-256
- **Application**: Block and transaction hashing
- **Property**: Deterministic, avalanche effect

### Digital Signatures
- **Algorithm**: RSA-2048
- **Signing**: PSS padding with SHA-256
- **Purpose**: Transaction authenticity and non-repudiation

### Proof-of-Work
- **Method**: Hash-based puzzle solving
- **Target**: Find nonce where block hash has N leading zeros
- **Difficulty**: Adjustable (default: 4)
- **Cost**: Computationally expensive, easy to verify

## Educational Concepts

### 1. Immutability
Changing any transaction requires re-mining that block. Since each block references the previous block's hash, changing one block breaks all subsequent blocks. Recovering requires:
1. Modify block content
2. Recalculate block hash
3. Update next block's previous_hash
4. Recalculate all subsequent blocks
5. Spend computational effort proportional to chain length

### 2. Consensus Mechanism
The longest valid chain is considered truth. To override a transaction:
1. Create alternative chain from that block's predecessor
2. Mine blocks faster than the network
3. Broadcast when your chain is longer
4. Network nodes accept your chain

### 3. 51% Attack
**Requirement**: Control >50% of mining power

**Process**:
1. Participate in mining like honest nodes
2. When you want to reverse transactions, secretly mine fork
3. Keep fork hidden while mining faster than honest network
4. Release fork when significantly longer
5. Network reorganizes to accept your chain

**Defenses**:
- Large decentralized network (hard to control 51%)
- Increased difficulty (higher attack cost)
- Economic incentives (mining more profitable than attacking)
- Longer finality (transactions considered irreversible after many blocks)
- Alternative consensus (Proof-of-Stake, etc.)

## Example Output

```
Block #0
  Hash:          0000a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t
  Previous Hash: 0
  Nonce:         1247
  Transactions:  0

Block #1
  Hash:          0000x9y8z7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g
  Previous Hash: 0000a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t
  Nonce:         3892
  Transactions:  2
    [0] abcd1234... → efgh5678...: 100
    [1] SYSTEM → abcd1234...: 10 (mining reward)
```

## Blockchain Properties

### Hash Function Properties
- **Deterministic**: Same input → same output
- **Avalanche Effect**: 1-bit input change → ~50% bit flip in output
- **One-way**: Can't reverse engineer input from hash
- **Collision-resistant**: Hard to find two inputs with same hash

### Immutability Mechanism
```
Transaction → Hash → Block → Chain Link
Modify transaction → Different hash → Break chain → Detected!
```

### Mining Difficulty
```
Difficulty 1: Find 1 leading zero (1/16 average attempts)
Difficulty 2: Find 2 leading zeros (1/256 average attempts)
Difficulty 3: Find 3 leading zeros (1/4096 average attempts)
Difficulty 4: Find 4 leading zeros (1/65536 average attempts)
```

## Test Scenarios

### Scenario 1: Honest Mining
1. Create wallets
2. Send transactions
3. Honest miners mine blocks
4. Blockchain grows legitimately

### Scenario 2: Tampering Attempt
1. Modify transaction in Block 1
2. Block hash changes
3. Block 2 can't link to Block 1
4. Chain validation fails

### Scenario 3: Re-mining Attack
1. Modify Block 1 and recalculate hash
2. Update Block 2's previous_hash
3. But Block 3 still links to old Block 2 hash
4. Need to re-mine ALL blocks after modification

### Scenario 4: 51% Attack
1. Create fork at historical block
2. Mine blocks faster (with 51% power)
3. Create longer chain
4. Broadcast longer chain
5. Network accepts new chain, reversing transactions

## Performance Characteristics

| Operation                   | Complexity | Description                  |
|-----------------------------|------------|------------------------------|
| Hash calculation            |     O(1)   | SHA-256 is fixed-size output |
| Mining block (difficulty D) |    O(2^D)  | Expected attempts: 16^D      |
| Chain validation            |     O(N)   | Validate each N block        |
| Balance lookup              |     O(N)   | Search all N transactions    |
| Tamper detection            |     O(1)   | Hash mismatch detection      |

## Security Assumptions

1. **One-way hash**: Can't reverse SHA-256
2. **Collision resistance**: No two inputs have same hash (for practical purposes)
3. **Digital signatures**: Only private key holder can sign
4. **Cryptographic strength**: RSA-2048 and SHA-256 are secure with current technology
5. **Network consensus**: Honest nodes constitute >50% of network

**Note**: This is an educational implementation. Production blockchains (Bitcoin, Ethereum) use additional mechanisms like:
- Transaction pools and memory management
- Fee mechanisms and block size limits
- Network protocols and peer-to-peer distribution
- Smart contracts and state machines
- Advanced consensus mechanisms (PoS, DPoS, etc.)


## Learning Objectives

 Understand block structure and hashing
 Implement Proof-of-Work consensus
 Learn digital signature cryptography
 Understand blockchain immutability
 Simulate network attacks
 Analyze economic security incentives
 Implement SPV (Simple Payment Verification) concepts
 Learn about Byzantine Fault Tolerance basics

---

**Languages Used**: Python 3
**Cryptography**: RSA-2048, SHA-256
**Dependencies**: cryptography library

For questions or improvements, feel free to ask or extend the codebase!
