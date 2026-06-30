# Changelog

All notable changes to the Chain Explorer blockchain simulator are documented here.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).  
Versioning tracks major project phases and releases.

---

## [Unreleased]

### Fixed
- **Blocks table invisible:** `.virtual-scroll` used `contain: strict`, which applies size containment and collapsed the table wrapper to zero height when no explicit height was set — rows existed in the DOM but did not paint.
  - **Why:** Phase 9 performance CSS intended layout/paint isolation, not zero-height collapse.
  - **Impact:** Blocks view table and headers render again; virtual scrolling still uses `contain: content`.
  - **Risks:** negligible; slightly less aggressive containment than `strict`.
- **Blocks view refresh race:** block table DOM updates now re-check whether the Blocks view is active when the scheduled render runs, not only when the fetch started.

### Added
- **Security Lab redesign:** lazy-loaded `security-lab.js` + `security-lab.css` with 11 threat topics (integrity, transactions, consensus, network), severity badges, threat-model cards, step-by-step simulations, and preserved live API demos for tamper detection and 51% attacks.
  - **Why:** Phase 3 goal — interactive security learning without rewriting backend attack logic.
  - **Impact:** Lab view uses topic sidebar + detail panels; deep links via `#lab/{topic-id}`; reset still available.
  - **Risks:** Animated demos are educational only; live tamper demo still validates without persisting changes.
- **Analytics miner legend:** Miner distribution chart now includes a ranked list with wallet names, color swatches, block counts, share %, and rewards; API adds `name` to miner stats.

### Added
- `IMPLEMENTATION_RULES.md` — governance for contributors and AI agents (Phase 12).
- `AGENTS.md` — quick orientation index.
- `.cursor/rules/implementation.mdc` — Cursor rule aligned with this repo’s stack.
- Updated Cursor rules (`backend`, `frontend`, `architecture`) to match FastAPI + vanilla JS (replacing stale Next.js guidance).

### Changed
- Documentation cross-links among README, DEVELOPER, ARCHITECTURE, and implementation rules.
- `.cursor/rules/design.mdc` and `performance.mdc` aligned with actual stack (tokens, ApiCache, lazy load — not generic Next.js advice).
- **README.md** rewritten for Chain Explorer v2: accurate stack, dashboard views, and a dedicated **How to run** section (`dev.sh`, manual start, ports, verification).
- **`requirements.txt`:** bumped `pydantic` (2.7.4 → 2.10.6) and `pydantic-settings` (2.3.0 → 2.6.1) for prebuilt wheels on Python 3.13.
  - **Why:** older pins forced a Rust source build of `pydantic-core` that fails on 3.13.
  - **Impact:** `pip install -r requirements.txt` works on 3.12 and 3.13 without compiling native extensions.
  - **Risks:** minor dependency drift; API unchanged for this project’s Pydantic usage.

### Removed (docs only)
- Stale README references to aurora/glass UI, `cd backend` uvicorn, and outdated project layout.

---

## [2.0.0] — 2026 — Chain Explorer evolution

Educational blockchain simulator: PoW, ECDSA, SHA-256, HTTP sync, interactive dashboard.

### Phase 12 — Implementation Rules
- **What:** Process docs, changelog, agent index, corrected Cursor rules.
- **Why:** Prevent drift, stale AI guidance, and unstructured changes across phases.
- **Impact:** Safer future edits; agents/humans share one source of truth.
- **Risks:** Rules require discipline; outdated README sections may still mention old UI until updated incrementally.

### Phase 10 — Accessibility
- **What:** `accessibility.js/css`, high-contrast toggle, keyboard nav, ARIA landmarks, live announcements.
- **Why:** WCAG 2.2 alignment for educational use in classrooms.
- **Impact:** Screen reader and keyboard-only users can explore all views.
- **Risks:** Dynamic views must keep `aria-hidden` in sync when adding new panels.

### Phase 9 — Performance
- **What:** `ApiCache`, lazy module loading, virtual block list, block summaries API, visibility-aware polling.
- **Why:** Reduce network/render cost as chains grow.
- **Impact:** Faster dashboard; smaller payloads via `?summary=true`.
- **Risks:** Cache invalidation must accompany new mutation endpoints.

### Phase 8 — Developer Experience
- **What:** Structured logging, `AppError`, env config, `Hooks`/`UIStates`, DevTools, `DEVELOPER.md`.
- **Why:** Maintainability and debuggability.
- **Impact:** Consistent errors, `.env` configuration, loading/empty states.
- **Risks:** Debug endpoints must stay gated behind `CHAIN_DEBUG`.

### Phase 7 — Educational Mode
- **What:** Learn view with 17 concepts (what/why/how/where/advantages/limitations), interactive demos.
- **Why:** Beginner-friendly explanations alongside the simulator.
- **Impact:** Contextual “Learn” links on every major view.
- **Risks:** Copy must stay accurate when chain behavior changes.

### Phase 6 — Visualizations
- **What:** Visualize tab with 13 interactive topics, live chain integration, animations.
- **Why:** Visual learning for chain structure, PoW, forks, mempool, etc.
- **Impact:** Merkle demo is educational only (not in block headers).
- **Risks:** Polling animations respect reduced-motion but custom demos need manual checks.

### Phase 5 — Analytics
- **What:** Analytics dashboard, `GET /analytics`, Chart.js KPIs and charts.
- **Why:** Network/mining metrics for teaching throughput and sync.
- **Impact:** Charts lazy-loaded; destroyed when leaving view.
- **Risks:** Chart.js CDN dependency for analytics view only.

### Phase 4 — UI/UX Redesign
- **What:** Sidebar dashboard, light/dark theme, Etherscan-style tables, toasts.
- **Why:** Professional explorer aesthetic.
- **Impact:** Modular views (`overview`, `blocks`, `transactions`, etc.).
- **Risks:** None significant; replaced aurora/glass clutter.

### Phase 3 — Blockchain improvements
- **What:** Mempool dedup/capacity, stronger validation, persistence, HTTP sync, balance cache.
- **Why:** Correctness and multi-node demos.
- **Impact:** `data/chain.json`, `wallets.enc`, `peers.json`.
- **Risks:** Legacy hash compatibility preserved via `stable_json`.

### Phase 2 — Architecture refactor
- **What:** Split monolithic services/frontend; unified balances via `get_balance()`; `Miner` wired in.
- **Why:** Separation of concerns without behavior change.
- **Impact:** `backend/services/*.py`, `frontend/js/{api,ui,events,app}.js`.
- **Risks:** None if services remain thin wrappers.

### Phase 1 — Codebase audit
- **What:** Full audit before changes; documented baseline.
- **Why:** Informed refactoring plan.
- **Impact:** Roadmap for phases 2–12.
- **Risks:** N/A (read-only).

---

## How to add entries

When merging significant work, append under `[Unreleased]`:

```markdown
### Fixed | Added | Changed | Removed
- **Short title** — what changed.
  - **Why:** …
  - **Impact:** …
  - **Risks:** …
```

On release, rename `[Unreleased]` to a version/date section.
