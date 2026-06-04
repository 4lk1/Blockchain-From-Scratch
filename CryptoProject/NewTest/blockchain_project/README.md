# 🔗 Blockchain Simulator - Professional Educational Platform

> A production-quality educational blockchain simulator with modern web interface, RESTful API, and interactive demonstrations of blockchain concepts.

![Version](https://img.shields.io/badge/version-2.0.0-cyan) ![Python](https://img.shields.io/badge/Python-3.12+-blue) ![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-green) ![License](https://img.shields.io/badge/license-Educational-blue)

---

## 📋 Quick Navigation

- **Getting Started**: [Installation & Quick Start](#-quick-start)
- **Learn**: [Educational Concepts](#-security-concepts)
- **Build**: [API Documentation](#-api-documentation)
- **Explore**: [Project Structure](#-project-structure)
- **Support**: [Troubleshooting](#-troubleshooting)

---

## 🎯 Overview

The Blockchain Simulator is a comprehensive educational platform that demonstrates blockchain technology from first principles. Perfect for university education, interviews, and self-learning.

**What You'll Build:**
- Create digital wallets with ECDSA signatures
- Mine blocks using Proof-of-Work consensus
- Validate blockchain integrity with cryptographic hashing
- Simulate attacks: double-spending and 51% takeovers
- See tampering detection in real-time

**Production Features:**
- Clean layered architecture (services, models, utils)
- Type-safe Python with full Pydantic validation
- Premium UI: Aurora gradients + liquid glass effects
- RESTful API with auto-generated Swagger documentation
- Real cryptography: ECDSA + SHA-256

---

## ✨ Features at a Glance

### 🔐 Blockchain Core
✅ SHA-256 hashing  
✅ ECDSA signatures  
✅ Proof-of-Work mining  
✅ Chain validation  
✅ Transaction signing  

### 🎨 Interactive UI
✅ Modern liquid glass design  
✅ Real-time synchronization  
✅ Responsive layout  
✅ Dark mode with aurora colors  
✅ Modal forms for operations  

### 📊 Demonstrations
✅ Tamper detection  
✅ 51% attack simulation  
✅ Mining visualization  
✅ Transaction pool  
✅ Chain validation  

---

## 🚀 Quick Start

### Prerequisites
- Python 3.12+
- Terminal/Command Prompt
- Modern web browser

### 1️⃣ Install & Setup

```bash
# Clone/Navigate to project
cd blockchain_project

# Create virtual environment
python3.12 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2️⃣ Start Services

**Terminal 1** - Backend API:
```bash
cd backend
python -m uvicorn api:app --reload
```

**Terminal 2** - Frontend:
```bash
cd frontend
python -m http.server 8001
```

### 3️⃣ Open in Browser

Visit: **http://localhost:8001**

Done! 🎉 Start with "Create" button to make your first wallet.

---

## 🏗️ Architecture

```
Frontend (http://localhost:8001)
    ↓ (Fetch API)
Backend API (http://localhost:8000)
    ├─ FastAPI Server
    ├─ Models (Pydantic validation)
    ├─ Services (Business logic)
    ├─ Utils (Helpers)
    └─ Blockchain Core
        ├─ wallet.py (ECDSA)
        ├─ transaction.py (Signing)
        ├─ block.py (Hashing)
        ├─ blockchain.py (Validation)
        ├─ miner.py (Proof-of-Work)
        └─ attack.py (Simulations)
```

**Design**: Clean layered architecture with service-oriented pattern

---

## 📚 API Reference

### Documentation
- **Interactive Docs**: http://localhost:8000/docs (Swagger UI)
- **Alternative Docs**: http://localhost:8000/redoc (ReDoc)
- **OpenAPI Schema**: http://localhost:8000/openapi.json

### Essential Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/wallets` | GET | List all wallets |
| `/wallet/create` | POST | Create new wallet |
| `/transactions` | GET | View pending transactions |
| `/transaction/create` | POST | Create transaction |
| `/mine` | POST | Mine new block |
| `/blocks` | GET | View all blocks |
| `/validate` | GET | Validate blockchain |
| `/tamper` | POST | Tamper demo |
| `/attack/51percent` | POST | 51% attack simulation |
| `/reset` | POST | Reset blockchain |

### Example: Create Transaction

```bash
curl -X POST http://localhost:8000/transaction/create \
  -H "Content-Type: application/json" \
  -d '{
    "sender_address": "0xalice",
    "receiver_address": "0xbob",
    "amount": 50.0
  }'
```

---

## 📖 How to Use (Walkthrough)

### Step 1: Create Wallets
1. Type "Alice" in wallet name field
2. Click "Create"
3. Repeat for "Bob" and "Charlie"
4. ✓ Wallets appear in left sidebar with balances

### Step 2: Create Transactions
1. Click "Transaction" button
2. Select "Alice" as sender
3. Select "Bob" as receiver
4. Enter amount: 50
5. Click "Create"
6. ✓ Transaction appears in pool

### Step 3: Mine Block
1. Click "Mine" button
2. Select "Charlie" as miner
3. Click "Mine Block"
4. ✓ Block created, Charlie earns 10 coin reward
5. ✓ See nonce value (Proof-of-Work difficulty)

### Step 4: Validate Blockchain
1. Click "Validate"
2. ✓ See "Valid" indicator if chain is intact
3. Try again after tampering to see "Invalid"

### Step 5: Tamper Demonstration
1. Click "Tamper" button
2. Block Index: 1
3. Transaction Index: 0
4. New Amount: 999
5. Click "Execute Tamper"
6. ✓ See before/after hashes differ
7. ✓ Validate chain - now shows "Invalid"

### Step 6: 51% Attack
1. Click "51% Attack" button
2. Click "Run Attack"
3. ✓ See attacker with 60% power overtakes network
4. ✓ Attacker's chain becomes accepted (longest chain rule)
5. ✓ Double-spending succeeds!

---

## 🔐 Educational Concepts Explained

### 1. **Cryptographic Hashing** (SHA-256)
- Each block has unique hash based on its content
- Any modification changes the hash
- Hashes are linked: Block 2 contains hash of Block 1
- Breaking one link breaks all subsequent links
- **Example**: Change transaction amount in Block 1 → Hash changes → Block 2's reference becomes invalid

### 2. **Digital Signatures** (ECDSA)
- Sender proves ownership with private key
- Everyone can verify with public key
- Signature is impossible to forge
- **Example**: Alice signs transaction with her private key → Bob verifies with Alice's public key

### 3. **Proof-of-Work Mining**
- Miners must find nonce value where hash starts with N zeros
- Difficulty 3 = hash starts with `000`
- Requires trying thousands/millions of values
- First miner to find it gets reward
- **Example**: Miner tries 50,000 nonces → finds one → gets 10 coins

### 4. **Chain Validation**
- Blockchain validates every block
- Checks: correct hash, previous hash link, Proof-of-Work, signatures
- If ANY block is invalid → entire chain is invalid
- **Example**: Tamper with transaction → hash changes → next block's link breaks → validation fails

### 5. **51% Attack - Double Spending**
- If attacker controls >50% of mining power, they can:
  1. Build secret chain with different transactions
  2. Secretly mine blocks faster than honest network
  3. When private chain is longer, broadcast it
  4. Network switches to longest chain (consensus rule)
  5. Previous transactions are reversed
- **Example**: Attacker sends 100 coins to victim, victim sends goods, attacker mines longer chain without that transaction, now has coins AND goods!

### 6. **Consensus Rules**
- **Longest Chain Rule**: Network always accepts the longest valid chain
- **Why it works**: With 51%+ power, attacker's chain grows fastest
- **Why it fails with <50%**: Honest nodes' chain grows faster
- **Solution**: Decentralized consensus (no single authority)

---

## 📂 Project Structure

```
blockchain_project/
├── backend/
│   ├── api.py             # REST endpoints (350 lines)
│   ├── models.py          # Pydantic schemas (250 lines)
│   ├── services.py        # Business logic (400 lines)
│   ├── utils.py           # Helpers (250 lines)
│   ├── blockchain.py      # Chain logic
│   ├── block.py           # Block structure
│   ├── transaction.py     # Transaction signing
│   ├── wallet.py          # Wallet management
│   ├── miner.py           # Mining algorithm
│   ├── attack.py          # 51% simulation
│   └── requirements.txt   # Dependencies
│
├── frontend/
│   ├── index.html         # Semantic HTML (250 lines)
│   ├── style.css          # Aurora design (450 lines)
│   ├── app.js             # Modular JS (350 lines)
│   └── assets/            # Images/icons (future)
│
└── README.md              # This file
```

**Total Code**: ~3,000 lines of production-grade code

---

## 🛠️ Technologies

| Layer | Tech | Purpose |
|-------|------|---------|
| **Backend** | Python 3.12 | Runtime |
| | FastAPI 0.115 | REST framework |
| | Pydantic 2.7 | Data validation |
| | ECDSA 0.19 | Signatures |
| | SHA-256 | Hashing |
| **Frontend** | HTML5 | Semantic markup |
| | CSS3 | Aurora aesthetics |
| | Vanilla JS | Interactivity |
| | Fetch API | HTTP communication |

---

## 🐛 Troubleshooting

### Common Issues

**"Port 8000 already in use"**
```bash
python -m uvicorn api:app --port 8001 --reload
# Update API_BASE in app.js to http://localhost:8001
```

**Backend not responding**
```bash
curl http://localhost:8000/health
# Should see: {"status":"healthy","version":"2.0.0",...}
```

**Frontend not loading data**
1. Check browser console (F12)
2. Look for CORS errors
3. Verify backend is running
4. Clear browser cache (Ctrl+Shift+R)

**Transactions not signing**
- Ensure sender wallet exists
- Verify sender has sufficient balance
- Check backend logs for error messages

**Mining is stuck**
- This is normal! Mining is intentionally hard (Proof-of-Work)
- Try reducing difficulty in `backend/api.py`
- Or wait for computation to complete

---

## 📊 Performance

| Metric | Value |
|--------|-------|
| Frontend polls | Every 2 seconds |
| API response time | <100ms typical |
| Mining time (difficulty=3) | 1-3 seconds |
| Blockchain size | Limited by memory |
| Block creation | ~2.5 seconds target |

---

## 🔧 Development Notes

### Adding a New Feature

1. **API Endpoint**: Add to `backend/api.py`
2. **Business Logic**: Add service method in `backend/services.py`
3. **Data Model**: Add Pydantic model in `backend/models.py`
4. **Frontend API Call**: Add method to `BlockchainAPI` class in `frontend/app.js`
5. **UI Update**: Add rendering method in `UIRenderer` class

### Type Safety

All Python code has type hints:
```python
def create_wallet(self, name: str) -> Dict:
    """Create wallet. Returns wallet data."""
```

---

## 📝 Key Files Explained

### `backend/api.py`
FastAPI server defining all HTTP endpoints. Each endpoint uses services to perform operations.

### `backend/services.py`
Business logic separated into services:
- `BlockchainService`: Chain operations
- `WalletService`: Wallet management
- `TransactionService`: Transaction creation
- `MiningService`: Mining operations
- `AttackService`: Attack simulations

### `backend/models.py`
Pydantic models for request/response validation and automatic API documentation.

### `frontend/app.js`
Modular JavaScript with:
- `BlockchainAPI` class: All API calls
- `UIRenderer` class: All DOM updates
- Event handlers: User interactions
- `updateAppState()`: Real-time sync

### `blockchain.py`
Core blockchain logic:
- Chain validation
- Block creation
- Pending transactions
- Difficulty management

---

## 🎓 Learning Path

**Beginner** (Start here)
1. Create wallets
2. Create transactions
3. Mine blocks
4. Watch balances update
5. Understand Proof-of-Work

**Intermediate**
1. Read `blockchain.py` source code
2. Validate blockchain after mining
3. Study `wallet.py` for ECDSA
4. Review transaction signing

**Advanced**
1. Tamper with blockchain
2. Rebuild from tamper
3. Run 51% attack simulation
4. Modify difficulty setting
5. Review entire codebase

---

## 🎯 Key Takeaways

After using this simulator, you'll understand:

1. **Blockchain immutability**: Hashes create unbreakable links
2. **Mining hardness**: Proof-of-Work prevents spam/attacks
3. **Signature security**: Only private key can authorize transactions
4. **Consensus rules**: Longest chain is accepted (game theory)
5. **Attack vector**: 51% power breaks decentralized consensus
6. **Architecture patterns**: Services, models, clean separation

---

## ❓ FAQ

**Q: Can I use this for cryptocurrency?**  
A: No! This is for education only. Never trust it with real value.

**Q: Can I change the difficulty?**  
A: Yes, in `backend/api.py` line 82: `difficulty=3` to `difficulty=4`

**Q: How do I export blockchain data?**  
A: Fetch `/blocks` endpoint and save the JSON response.

**Q: Is this production-ready?**  
A: It's designed for education, not production use.

**Q: Can I run on mobile?**  
A: Yes! Frontend is fully responsive.

**Q: Why is mining slow?**  
A: That's intentional! Proof-of-Work is computational by design.

---

## 🚀 Next Steps

1. ✅ Run the simulator
2. ✅ Create wallets and transactions
3. ✅ Mine blocks and observe nonce
4. ✅ Experiment with tampering
5. ✅ Run 51% attack
6. ✅ Read source code
7. ✅ Modify parameters
8. ✅ Share with others!

---

## 📞 Support Resources

- **API Docs**: http://localhost:8000/docs
- **Browser Console**: F12 → Console tab
- **Backend Logs**: Terminal where you ran backend
- **Frontend Network Tab**: F12 → Network tab

---

## 📄 License

Educational use. For learning and demonstrations.

---

**Made with ❤️ for blockchain education**

*v2.0.0 | Clean Architecture | Production Grade | Learning Focused*
