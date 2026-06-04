#  Blockchain from Scratch - Complete Project Index

A complete, production-ready blockchain implementation with educational demonstrations, cryptographic security, and interactive web interface.

---

##  Project Structure

### **Core Blockchain Implementation**

| File               | Purpose                                        | Key Classes/Functions                                           |
|--------------------|------------------------------------------------|-----------------------------------------------------------------|
| **block.py**       | Block data structure with Proof-of-Work mining | `Block`, `calculate_hash()`,`mine_block()`                      |
| **transaction.py** | Signed transactions and cryptographic wallets  | `Transaction`, `Wallet`, `sign_transaction()`                   |
| **blockchain.py**  | Main blockchain with validation and consensus  | `Blockchain`, `mine_pending_transactions()`, `is_chain_valid()` |

**Technology**: SHA-256 hashing, RSA-2048 signatures, Proof-of-Work consensus

---

##  How to Run

### **Option 1: Web Interface (Recommended)**
```bash
python app.py
# Opens at http://localhost:5000
```
Interactive visualizer with blockchain explorer, transaction simulator, and security demos.

### **Option 2: Interactive Menu**
```bash
python main.py
```
CLI-based menu system with security demonstrations and wallet management.

### **Option 3: Run All Security Demos**
```bash
python security_demo.py
```
Executes:
- Manipulation resistance test
- 51% attack simulation
- Hash distribution analysis

### **Option 4: Complete Workflow Example**
```bash
python example_complete.py
```
Single script demonstrating full blockchain operations.

### **Option 5: Run API Tests**
```bash
python test_api.py
```
Validates all 10 REST API endpoints.

---

##  File Descriptions

### **Web Application**
- **app.py** (270+ lines) - Flask REST API backend with 10+ endpoints
- **index.html** (1.3 KB) - Interactive web frontend with professional UI
  - Blockchain explorer with visual block display
  - Wallet management and balance tracking
  - Transaction creation and signing
  - Security demonstrations (51% attack, manipulation, hash analysis)
  - Educational security overview

### **Security & Demonstrations**
- **security_demo.py** (299 lines) - Three security demonstrations
  - Tampering detection through hashing
  - 51% attack fork creation
  - Proof-of-Work difficulty analysis
- **test_api.py** (6.6 KB) - Comprehensive API testing suite
  - 10 sequential tests covering all blockchain operations
  - All tests passing ✓

### **Educational Examples**
- **main.py** - Interactive menu system with demonstrations
- **example_complete.py** - Complete workflow example script

### **Configuration**
- **requirements.txt** - Python dependencies (cryptography, Flask)
- **run_web.sh** - Quick start script for web server

---

##  Security Features

### Cryptographic Protection
- **SHA-256 Hashing**: Immutable block integrity
- **RSA-2048 Signatures**: Transaction authenticity and non-repudiation
- **Proof-of-Work**: Computational cost protection (adjustable difficulty 1-6)

### Attack Resistance
- **Tamper Detection**: Any block modification breaks the entire chain
- **Chain Validation**: Cryptographic linking prevents history rewriting
- **51% Attack Analysis**: Visual fork simulation and detection

---

##  Web Interface Features

### Main Tab: Blockchain Explorer
- Visual block display with hash information
- Real-time transaction pool
- Wallet balance tracking (5 built-in wallets: Alice, Bob, Charlie, Diana, Eve)
- Block creation and mining controls
- Chain validation status

### Security Demonstrations

**51% Attack Simulator**
- Side-by-side legitimate vs attacker chain visualization
- Fork creation with alternative transaction history
- Attack detection with economic feasibility analysis

**Manipulation Resistance Demo**
- Block selection with transaction modification
- Original hash comparison
- Impact analysis (cascading re-mining requirement)
- Computational cost calculation

**Hash Analysis Tool**
- 6 difficulty levels (1-6)
- Mining probability calculation
- Average nonce attempts estimation
- Exponential cost visualization

**Security Overview**
- Cryptographic hashing explanation
- Chain linking and immutability
- Digital signature importance
- Proof-of-Work mechanism details

---

##  REST API Endpoints

| Method | Endpoint                          | Purpose                   |
|--------|-----------------------------------|---------------------------|
| POST   | `/api/blockchain/init`            | Create new blockchain     |
| POST   | `/api/transactions/add`           | Add pending transaction   |
| POST   | `/api/blocks/mine`                | Mine new block            |
| GET    | `/api/blockchain/state`           | Get full blockchain       |
| POST   | `/api/blockchain/validate`        | Validate chain integrity  |
| GET    | `/api/wallet/<name>/balance`      | Get wallet balance        |
| GET    | `/api/wallet/<name>/transactions` | Get transaction history   |
| GET    | `/api/stats`                      | Get blockchain statistics |
| POST   | `/api/demo/fork`                  | Simulate 51% attack       |
| POST   | `/api/demo/tamper`                | Test manipulation         |

---

##  Dependencies

```
cryptography>=48.0.0   # RSA-2048 encryption and hashing
Flask>=3.1.3           # Web server
```

Install with:
```bash
pip install -r requirements.txt
```

---

##  Learning Path

1. **Start**: Read this INDEX.md
2. **Explore Code**: Read block.py → transaction.py → blockchain.py
3. **Run Web Demo**: `python app.py` and interact with visualizer
4. **Study Security**: Run `python security_demo.py`
5. **Test API**: Run `python test_api.py`
6. **Deep Dive**: Study security_demo.py and app.py for advanced patterns

---

##  Project Status

-  Complete blockchain implementation (1,249+ lines Python)
-  Cryptographic security (SHA-256, RSA-2048)
-  Proof-of-Work consensus mechanism
-  Interactive web interface (professional design)
-  REST API with 10+ endpoints (all tested)
-  Security demonstrations (3 comprehensive demos)
-  Educational examples and documentation

**All components tested and working** 

---

##  Quick Facts

| Aspect         | Details                                |
|----------------|----------------------------------------|
| Language       | Python 3.8+                            |
| Core Size      | ~1,249 lines                           |
| Cryptography   | SHA-256 + RSA-2048                     |
| Consensus      | Proof-of-Work (difficulty 1-6)         |
| Web Framework  | Flask                                  |
| UI Design      | Professional dark theme                |
| API Tests      | 10/10 passing                          |
| Demonstrations | 3 security demos + web interface demos |

---
