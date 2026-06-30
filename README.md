# Chain Explorer — Educational Blockchain Simulator

> A production-quality educational blockchain simulator with a modern explorer dashboard, RESTful API, interactive visualizations, and hands-on attack demos.

![Version](https://img.shields.io/badge/version-2.0.0-cyan) ![Python](https://img.shields.io/badge/Python-3.12+-blue) ![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-green) ![License](https://img.shields.io/badge/license-Educational-blue)

---

## Quick navigation

| | |
|---|---|
| **Run locally** | [How to run](#how-to-run) |
| **Use the dashboard** | [Dashboard walkthrough](#dashboard-walkthrough) |
| **Developers** | [Developer Guide](DEVELOPER.md) · [Architecture](backend/ARCHITECTURE.md) |
| **Contributors** | [Implementation Rules](IMPLEMENTATION_RULES.md) · [Changelog](CHANGELOG.md) · [Agent Guide](AGENTS.md) |
| **API** | [API reference](#api-reference) |
| **Help** | [Troubleshooting](#troubleshooting) |

---

## Overview

**Chain Explorer** demonstrates blockchain technology from first principles — hashing, ECDSA signatures, Proof-of-Work mining, chain validation, and consensus attacks — through a browser-based dashboard you can run locally.

**What you can do:**

- Create wallets and sign transactions with ECDSA
- Mine blocks with adjustable PoW difficulty
- Explore blocks, mempool, and wallet balances in real time
- Run tamper and 51% attack simulations
- Sync chains between multiple local nodes over HTTP
- Learn concepts via interactive **Visualize** and **Learn** views
- Inspect network metrics in **Analytics**

**Stack:** Python 3.12 + FastAPI backend · vanilla HTML/CSS/JS frontend · JSON persistence · real SHA-256 + ECDSA cryptography.

> **Educational use only.** This is not a production cryptocurrency. Do not use it with real value.

---

## Features

### Blockchain core
- SHA-256 block hashing with linked chain structure
- ECDSA transaction signing and verification
- Proof-of-Work mining with configurable difficulty
- Full chain validation (hashes, signatures, balance replay)
- Mempool with deduplication and capacity limits
- HTTP peer sync (longest valid chain rule)

### Dashboard
- Sidebar explorer UI with light / dark / system theme
- Views: Overview, Blocks, Transactions, Wallets, Mining, Analytics, Visualize, Learn, Lab
- Live polling, connection status, and chain integrity indicator
- Accessibility: keyboard navigation, ARIA landmarks, high-contrast mode

### Developer experience
- Auto-generated OpenAPI docs at `/docs`
- Structured logging, env-based config (`CHAIN_*` variables)
- Block summary API for lightweight list views
- Lazy-loaded modules (analytics, visualizations, education)

---

## How to run

You need **two processes**: the FastAPI backend (port **8000**) and a static file server for the frontend (port **8001**). The frontend talks to the API at `http://localhost:8000`.

### Prerequisites

| Requirement | Notes |
|-------------|-------|
| **Python 3.12+** | Check with `python3 --version` |
| **pip** | For installing dependencies |
| **Modern browser** | Chrome, Firefox, Safari, or Edge |

No Node.js build step is required — the frontend is plain HTML/CSS/JS.

### 1. Clone and install

```bash
git clone <your-repo-url> Blockchain-From-Scratch
cd Blockchain-From-Scratch

python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

pip install -r requirements.txt
```

Optional — copy environment defaults and customize:

```bash
cp .env.example .env
```

See [Configuration](#configuration) for available `CHAIN_*` variables.

### 2. Start the app (recommended)

From the **project root**, with your virtual environment active:

```bash
chmod +x scripts/dev.sh    # first time only
./scripts/dev.sh
```

This starts both servers and prints:

```
API:      http://127.0.0.1:8000  (docs: /docs)
Frontend: http://127.0.0.1:8001
```

Press **Ctrl+C** to stop both.

### 2. Start manually (two terminals)

**Terminal 1 — API** (run from project root):

```bash
source venv/bin/activate
python -m uvicorn backend.api:app --reload --host 127.0.0.1 --port 8000
```

**Terminal 2 — Frontend**:

```bash
cd frontend
python -m http.server 8001
```

> **Important:** Run uvicorn as `backend.api:app` from the repo root, not `cd backend && uvicorn api:app`.

### 3. Open the dashboard

| URL | Purpose |
|-----|---------|
| **http://localhost:8001** | Chain Explorer dashboard |
| **http://localhost:8000/docs** | Swagger API documentation |
| **http://localhost:8000/health** | Health check |

On first load you should see the **Overview** view with live stats. If the API is unreachable, a connection banner appears at the top — confirm the backend is running and that port 8000 is free.

### 4. Verify the backend

```bash
curl http://localhost:8000/health
```

Expected response (shape may vary slightly):

```json
{"status":"healthy","version":"2.0.0"}
```

### 5. Quick smoke test

1. Open **Wallets** → create a wallet named `Alice`
2. Open **Transactions** → send coins from `Alice` to another wallet
3. Open **Mining** → mine a block
4. Open **Overview** → confirm block count and balances updated

For attack demos, use the **Lab** view (tamper + 51% attack).

### Custom ports

Set ports via environment variables (or in `.env`):

```bash
CHAIN_API_PORT=9000 CHAIN_FE_PORT=9001 ./scripts/dev.sh
```

If you change the API port, update the frontend meta tag in `frontend/index.html`:

```html
<meta name="chain-api-url" content="http://localhost:9000">
```

Or override at runtime: `localStorage.setItem('chain_api_url', 'http://localhost:9000')`.

### Debug mode

- Backend: `CHAIN_DEBUG=true` in `.env` or environment
- Frontend: append `?debug=1` to the dashboard URL

See [DEVELOPER.md](DEVELOPER.md) for logging, error handling, and DevTools panel details.

---

## Architecture

```
Browser (http://localhost:8001)
    │  Fetch API + hash routing (#overview, #learn/topic, …)
    ▼
FastAPI (http://localhost:8000)
    ├── api.py              # Thin HTTP routes
    ├── services/           # Business logic
    ├── models.py           # Pydantic request/response schemas
    ├── blockchain.py       # Chain, balances, validation
    ├── mempool.py          # Pending transaction pool
    ├── persistence/        # JSON + encrypted wallet storage
    └── network/            # HTTP peer sync
```

Design notes and intentional simplifications (account model, no P2P, float amounts) are documented in [`backend/ARCHITECTURE.md`](backend/ARCHITECTURE.md).

---

## Dashboard walkthrough

| View | What to do |
|------|------------|
| **Overview** | Network stats, chain preview, difficulty control, quick actions |
| **Blocks** | Browse all blocks; virtualized table for long chains |
| **Transactions** | Create transfers; inspect mempool |
| **Wallets** | Create wallets; view addresses and balances |
| **Mining** | Select miner wallet and mine pending transactions |
| **Analytics** | Charts for blocks, mining, sync metrics (Chart.js, lazy-loaded) |
| **Visualize** | 13 interactive topics (hashing, PoW, forks, mempool, …) |
| **Learn** | 17 concept guides with diagrams and demos (`#learn/topic` deep links) |
| **Lab** | Tamper detection demo and 51% attack simulation |

**Suggested learning path:** Wallets → Transactions → Mining → Validate (Overview) → Lab → Learn / Visualize.

---

## API reference

### Documentation

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc
- **OpenAPI JSON:** http://localhost:8000/openapi.json

### Essential endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check |
| `/config` | GET | Public runtime configuration |
| `/wallets` | GET | List wallets |
| `/wallet/create` | POST | Create wallet |
| `/transactions` | GET | Pending mempool |
| `/transaction/create` | POST | Create signed transaction |
| `/mine` | POST | Mine block |
| `/blocks` | GET | All blocks (`?summary=true&limit=&offset=` for lightweight list) |
| `/blocks/{index}` | GET | Single block |
| `/stats` | GET | Chain statistics |
| `/analytics` | GET | Analytics aggregates |
| `/validate` | GET | Validate full chain |
| `/tamper` | POST | Tamper demo |
| `/attack/51percent` | POST | 51% attack simulation |
| `/network/sync` | POST | Sync with peer |
| `/peers` | GET | Registered peers |
| `/reset` | POST | Reset chain |
| `/settings/difficulty` | POST | Change mining difficulty |

### Example: create a transaction

```bash
curl -X POST http://localhost:8000/transaction/create \
  -H "Content-Type: application/json" \
  -d '{
    "sender_address": "<alice-address>",
    "receiver_address": "<bob-address>",
    "amount": 50.0
  }'
```

---

## Configuration

Copy [`.env.example`](.env.example) to `.env` in the project root. Common variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `CHAIN_API_PORT` | `8000` | API listen port |
| `CHAIN_FE_PORT` | `8001` | Used by `scripts/dev.sh` for frontend |
| `CHAIN_DEBUG` | `false` | Verbose errors + debug endpoints |
| `CHAIN_LOG_LEVEL` | `INFO` | Log verbosity |
| `CHAIN_INITIAL_DIFFICULTY` | `3` | PoW leading zeros |
| `CHAIN_MINING_REWARD` | `10.0` | Block reward amount |
| `CHAIN_DATA_DIR` | `data` | Persistence directory |
| `CHAIN_PERSISTENCE_ENABLED` | `true` | Save chain/wallets to disk |

Data files: `data/chain.json`, `data/wallets.enc`, `data/peers.json`.

---

## Project structure

```
Blockchain-From-Scratch/
├── backend/
│   ├── api.py                 # FastAPI routes
│   ├── blockchain.py          # Core chain logic
│   ├── models.py              # Pydantic schemas
│   ├── services/              # Wallet, mining, sync, analytics, …
│   ├── persistence/           # JSON + encrypted wallet store
│   ├── network/               # HTTP peer sync
│   ├── crypto/                # Hashing helpers
│   └── ARCHITECTURE.md
├── frontend/
│   ├── index.html             # Dashboard shell + views
│   ├── style.css              # Design tokens + layout
│   ├── css/                   # Feature styles (a11y, dx, perf, …)
│   └── js/
│       ├── api.js             # HTTP client + cache
│       ├── ui.js              # Dashboard rendering
│       ├── nav.js             # View routing
│       ├── analytics.js       # Charts (lazy)
│       ├── visualizations.js  # Interactive demos (lazy)
│       └── education.js       # Learn mode (lazy)
├── data/                      # Runtime persistence (gitignored)
├── scripts/dev.sh             # Start API + frontend
├── requirements.txt
├── .env.example
├── DEVELOPER.md
├── IMPLEMENTATION_RULES.md
└── CHANGELOG.md
```

---

## Educational concepts

| Topic | What you'll see |
|-------|-----------------|
| **Hashing** | Changing any block field breaks its hash and invalidates the chain |
| **Signatures** | Only the wallet owner can authorize outgoing transfers |
| **Proof-of-Work** | Miners search for a nonce until the hash meets the difficulty target |
| **Validation** | Full replay checks signatures, PoW, and that balances never go negative |
| **51% attack** | A longer secret chain can replace the honest chain (longest-chain rule) |

Deep dives with diagrams and interactive demos are in the **Learn** and **Visualize** views.

---

## Troubleshooting

### Port already in use

```bash
# Find what's using port 8000
ss -tlnp | grep 8000

# Or use a different port
CHAIN_API_PORT=8080 ./scripts/dev.sh
```

Remember to update `chain-api-url` in `frontend/index.html` if you change the API port.

### Backend not responding

```bash
curl http://localhost:8000/health
```

- Confirm uvicorn is running from the **project root** as `backend.api:app`
- Check the terminal for Python import errors (`pip install -r requirements.txt`)

### Frontend shows "Cannot connect to the API"

1. Verify backend is up (`/health`)
2. Open browser DevTools → Network tab for failed requests
3. Confirm `<meta name="chain-api-url">` matches your API port
4. Hard refresh: **Ctrl+Shift+R**

### Mining feels slow

That is intentional — Proof-of-Work is computationally expensive. Lower difficulty via the Overview control or `CHAIN_INITIAL_DIFFICULTY=2` in `.env`.

### Transactions rejected

- Sender wallet must exist and have sufficient balance (including pending outgoing txs)
- Amount must be positive; self-transfers are rejected
- Check backend logs: `CHAIN_LOG_LEVEL=DEBUG`

---

## Development

Follow [`IMPLEMENTATION_RULES.md`](IMPLEMENTATION_RULES.md) before editing code. After significant changes, update [`CHANGELOG.md`](CHANGELOG.md).

**Adding a feature (typical flow):**

1. Service method in `backend/services/`
2. Pydantic model in `backend/models.py` if needed
3. Route in `backend/api.py`
4. API method in `frontend/js/api.js`
5. UI in `frontend/js/ui.js` or a dedicated module

Full DX, performance, and accessibility notes: [`DEVELOPER.md`](DEVELOPER.md).

---

## Technologies

| Layer | Technology |
|-------|------------|
| Backend | Python 3.12, FastAPI, Pydantic, uvicorn |
| Crypto | ECDSA (NIST256p), SHA-256, Fernet wallet encryption |
| Frontend | HTML5, CSS3, vanilla ES modules, Chart.js (lazy) |
| Persistence | JSON files in `data/` |
| Sync | HTTP REST between peer nodes |

---

## License

Educational use — for learning and demonstrations.

---

**Made for blockchain education** · v2.0.0 · [Changelog](CHANGELOG.md)
