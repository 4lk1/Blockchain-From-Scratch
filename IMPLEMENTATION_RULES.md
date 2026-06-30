# Implementation Rules

Governance for evolving the Chain Explorer blockchain simulator into a **production-quality, educational, visually impressive, and maintainable** application — while **preserving existing logic and intent**.

All contributors (human and AI) should follow these rules before and after every change.

---

## 1. Before editing any file

### Understand why it exists
- Read the file and its callers first.
- Check [`backend/ARCHITECTURE.md`](backend/ARCHITECTURE.md) for ledger/consensus assumptions.
- Check [`DEVELOPER.md`](DEVELOPER.md) for DX, performance, and accessibility patterns.
- Identify whether the change is **behavioral** (requires careful validation) or **presentational** (UI/docs only).

### Reuse existing abstractions
| Layer | Prefer |
|-------|--------|
| Backend | `backend/services/*.py`, `backend/models.py`, `backend/exceptions.py`, `backend/config.py` / `settings.py` |
| API | FastAPI routes in `backend/api.py` — thin handlers delegating to services |
| Frontend API | `BlockchainAPI` + `ApiCache` in `frontend/js/api.js` |
| UI state | `UIStates`, `Hooks`, `Scheduler`, `RenderUtils` |
| Notifications | `Toast`, `ErrorUtils`, `Accessibility.announce` |
| Config | `CHAIN_*` env vars, `AppConfig`, `get_config()` |

Do **not** duplicate balance logic, validation rules, or HTTP client code.

### Preserve project conventions
- **Backend:** Python 3.12+, type hints, Pydantic models for API I/O, `blockchain` logger namespace.
- **Frontend:** Vanilla ES modules (no React build), design tokens in `style.css`, feature CSS in `frontend/css/`.
- **Naming:** `snake_case` (Python), `camelCase` (JS), `kebab-case` (CSS classes).
- **Commits:** Focused diffs; explain *why* in messages when asked to commit.

### Avoid unnecessary rewrites
- Extend before replacing.
- No drive-by refactors in unrelated files.
- If a file exceeds ~400 lines, **split by responsibility** — do not rewrite from scratch.

---

## 2. Every new component must be

### Typed
- **Python:** Full type hints on public functions; Pydantic models for request/response bodies.
- **JavaScript:** JSDoc on exported objects and non-obvious parameters; prefer explicit shapes in comments when TS is unavailable.

### Reusable
- One clear responsibility per module.
- Frontend utilities live in focused files (`cache.js`, `hooks.js`, etc.) — not inline in `ui.js`.
- Backend logic belongs in services, not in route handlers.

### Documented
- Public API endpoints: FastAPI `summary` + `description` (auto OpenAPI).
- New env vars: add to `.env.example` and `DEVELOPER.md`.
- New frontend modules: one-line header comment + section in `DEVELOPER.md` if non-obvious.

### Tested when practical
- **Backend:** `pytest` for validation, crypto, and service logic (`tests/` mirroring `backend/`).
- **Frontend:** Manual checklist via dashboard; add lightweight tests only for pure utilities if Node test runner is introduced.
- **Always:** Run existing flows after changes — mine, transfer, validate, sync, tamper demo.

### No placeholders
- Do **not** leave `TODO`, `FIXME`, stub implementations, or `console.log` debug noise unless explicitly requested.
- Ship complete, working code or do not merge.

---

## 3. After every significant change

Document in [`CHANGELOG.md`](CHANGELOG.md) under `[Unreleased]`:

1. **What changed** — files and behavior.
2. **Why** — problem or goal.
3. **Expected impact** — users, performance, API compatibility.
4. **Possible risks** — regressions, migration steps, known limits.

For AI-assisted work, include the same four points in the PR or session summary.

---

## 4. Architectural boundaries (do not break)

```
frontend/js/          → UI, client cache, lazy modules
backend/api.py        → HTTP surface only
backend/services/     → business orchestration
backend/blockchain.py → ledger rules (consensus, balances)
backend/validation.py → shared validation helpers
data/                 → runtime state (gitignored)
```

**Intentionally simplified (do not “fix” without explicit request):**
- Account model (not UTXO)
- HTTP peer sync (not native P2P)
- Server-side wallet signing (educational)
- Float amounts (not satoshis/wei)
- Flat tx list in block hash (Merkle root not in headers)

---

## 5. UI / UX standards

- Follow Phase 4 design system (`style.css` tokens).
- WCAG-oriented patterns from Phase 10 (`accessibility.js`, `accessibility.css`).
- Performance patterns from Phase 9 (cache, lazy load, virtual lists).
- Educational copy from Phase 7 (`education.js`) — accurate for *this* simulator.

---

## 6. Security & safety

- Never commit secrets (`.env`, wallet keys, `data/.wallet_key`).
- Never disable validation to “make demos work.”
- Sanitize user-facing error messages in production (`CHAIN_DEBUG=false`).
- CORS and peer URLs are trust boundaries — document changes.

---

## 7. Objective

> Evolve the simulator into a polished teaching platform — not a different product.

When in doubt, choose the change that:
1. Keeps the chain logic correct and auditable.
2. Helps learners *see* what the code is doing.
3. Minizes long-term maintenance cost.

---

## Related documents

| Document | Purpose |
|----------|---------|
| [`CHANGELOG.md`](CHANGELOG.md) | Running change history |
| [`DEVELOPER.md`](DEVELOPER.md) | Setup, DX, performance, a11y |
| [`backend/ARCHITECTURE.md`](backend/ARCHITECTURE.md) | Ledger & consensus design |
| [`AGENTS.md`](AGENTS.md) | Quick index for AI agents |
| [`.cursor/rules/`](.cursor/rules/) | Cursor IDE enforcement rules |
