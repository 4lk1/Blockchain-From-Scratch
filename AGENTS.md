# Agent & Contributor Guide

Quick orientation for AI agents and new contributors working on **Chain Explorer**.

## Read first

1. [`IMPLEMENTATION_RULES.md`](IMPLEMENTATION_RULES.md) — **required** before editing code.
2. [`CHANGELOG.md`](CHANGELOG.md) — update after significant changes.
3. [`backend/ARCHITECTURE.md`](backend/ARCHITECTURE.md) — what the simulator is/is not.
4. [`DEVELOPER.md`](DEVELOPER.md) — run, config, DX, performance, accessibility.

## Stack (actual — not Next.js)

| Layer | Technology |
|-------|------------|
| Backend | Python 3.12+, FastAPI, Pydantic, ECDSA, SHA-256 |
| Frontend | Vanilla HTML/CSS/JS modules, Chart.js (lazy) |
| Persistence | JSON + Fernet (`data/`) |
| Sync | HTTP REST between peers |

## Key paths

```
backend/api.py              # Routes (thin)
backend/services/           # Business logic
backend/blockchain.py       # Chain + balances
frontend/index.html         # Shell + views
frontend/js/api.js          # HTTP + cache
frontend/js/ui.js           # Dashboard rendering
frontend/js/accessibility.js
```

## Commands

```bash
./scripts/dev.sh
# or
python -m uvicorn backend.api:app --reload
cd frontend && python -m http.server 8001
```

## Do not

- Rewrite to React/Next.js without explicit request.
- Add UTXO, full P2P, or Merkle roots in headers unless requested.
- Leave TODOs or placeholder implementations.
- Change consensus/validation behavior silently — document in CHANGELOG.

## After significant edits

Explain: **what** · **why** · **expected impact** · **possible risks** — and append to `CHANGELOG.md`.
