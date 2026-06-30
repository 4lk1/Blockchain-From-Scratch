# Blockchain Architecture & Assumptions

This document describes the Phase 3 blockchain design decisions for the educational simulator.

## Scope

This project is an **educational single-ledger simulator**, not a production cryptocurrency. Several production features are intentionally simplified or omitted.

## Consensus

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Consensus | Proof-of-Work (leading-zero hash) | Easy to visualize in the UI |
| Fork choice | Longest valid chain | Standard Nakamoto rule, used in peer sync |
| Block time target | Config only (`block_target_time`) | No automatic difficulty adjustment yet |

## Ledger Model

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Model | Account balances | Simpler for teaching transfers vs UTXO |
| Minting | `SYSTEM` reward transactions | Explicit mining reward, no cap |
| Amount type | `float` | Acceptable for demo; production would use integers |

## Cryptography

| Component | Implementation |
|-----------|----------------|
| Hashing | SHA-256 over deterministic JSON (`stable_json` for legacy chain compatibility) |
| Signatures | ECDSA (NIST256p) over transaction payload hash |
| Address | First 40 hex chars of SHA-256(public key bytes) |

### Signature validation rules

1. Non-`SYSTEM` transactions must be signed.
2. Signature must verify against payload hash.
3. Signer's public key must derive to the sender address.
4. Amount must be positive; self-transfers are rejected.

## Mempool

- FIFO pool with **deduplication by `transaction_id`** (payload hash).
- Capacity limited by `max_mempool_size` (default 500).
- Balance checks include pending outgoing transactions before admission.

## Chain Validation

Full validation (`is_chain_valid`) checks:

1. Block index continuity
2. Genesis `previous_hash == "0"`
3. Hash integrity (stored vs recalculated)
4. Proof-of-work for block difficulty
5. Transaction signatures
6. **Economic replay** — balances never go negative when replaying the chain
7. Block transaction count ≤ `max_block_size`

Quiet validation (no console output) is used for `/stats` to avoid log spam.

## Persistence

| File | Contents |
|------|----------|
| `data/chain.json` | Chain, mempool, difficulty, mining reward |
| `data/wallets.enc` | Fernet-encrypted wallet private keys |
| `data/peers.json` | Registered peer URLs |
| `data/.wallet_key` | Local encryption key (auto-generated if env not set) |

Set `BLOCKCHAIN_WALLET_KEY` in production-like deployments. Disable persistence with `CONFIG.persistence_enabled = False`.

## Networking (HTTP Sync, Not P2P)

**Architectural weakness addressed without full P2P:**

Native TCP peer discovery and gossip are **not implemented** — they add substantial complexity for a teaching tool.

Instead, the simulator uses **HTTP REST sync**:

```
Node A  ──GET /blocks──▶  Node B
         ◀── JSON chain ──
If B's chain is longer and valid → A replaces local chain
```

### API

- `GET /peers` — list registered peers
- `POST /peers/register` — add peer base URL
- `POST /network/sync` — fetch longest valid remote chain

### Assumptions

- Peers trust HTTP responses (no header-level auth in demo mode).
- All nodes share compatible chain serialization version.
- Sync is pull-based and manual/on-demand (not continuous).

## Wallet Security

| Property | Behavior |
|----------|----------|
| Private keys | Never returned by API |
| Storage | Encrypted at rest via Fernet |
| Signing | Server-side (demo UX tradeoff) |

**Assumption:** Users run this locally for learning. Server-side signing is intentional so the web UI can operate without client-side key management.

## Performance

- **Balance cache** rebuilt on chain mutation; reads are O(1) amortized.
- **Quiet validation** on stats endpoints avoids full console validation on every poll.
- Mining remains **synchronous** on the API thread (acceptable for low difficulty).

## Known Limitations (Future Work)

1. No automatic difficulty adjustment
2. No transaction nonces / replay protection across sessions beyond mempool dedup
3. No merkle tree in block header (full tx list hashed instead)
4. No authenticated peer protocol
5. Float balances (precision risk)
6. 51% attack simulation remains isolated from live chain

## Module Map

```
backend/
├── blockchain.py      # Chain + mempool + validation orchestration
├── block.py           # PoW block
├── transaction.py     # Signed transfers
├── wallet.py          # ECDSA keys
├── mempool.py         # Pending tx pool
├── validation.py      # Structure + economics checks
├── serialization.py   # JSON snapshot format
├── config.py          # Central configuration
├── crypto/            # Hashing helpers
├── persistence/       # Disk storage
├── network/           # Peer registry + HTTP sync
└── services/          # API-facing orchestration
```
