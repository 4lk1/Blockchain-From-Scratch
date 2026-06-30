# Developer Guide — Chain Explorer

> **Governance:** All changes must follow [`IMPLEMENTATION_RULES.md`](IMPLEMENTATION_RULES.md).  
> **History:** Record significant updates in [`CHANGELOG.md`](CHANGELOG.md).

This guide covers logging, debugging, error handling, configuration, and reusable frontend utilities.

## Quick start

```bash
cp .env.example .env          # optional — customize settings
pip install -r requirements.txt
chmod +x scripts/dev.sh
./scripts/dev.sh              # starts API :8000 + frontend :8001
```

Or manually:

```bash
python -m uvicorn backend.api:app --reload
cd frontend && python -m http.server 8001
```

---

## Configuration

### Backend (environment variables)

All settings use the `CHAIN_` prefix. See [`.env.example`](.env.example).

| Variable | Default | Description |
|----------|---------|-------------|
| `CHAIN_DEBUG` | `false` | Enables `/debug/info`, verbose 500 errors, uvicorn reload |
| `CHAIN_LOG_LEVEL` | `INFO` | `DEBUG`, `INFO`, `WARNING`, `ERROR` |
| `CHAIN_LOG_FORMAT` | `text` | `text` or `json` (structured logs) |
| `CHAIN_INITIAL_DIFFICULTY` | `3` | PoW leading zeros |
| `CHAIN_DATA_DIR` | `data` | Persistence directory |
| `CHAIN_PERSISTENCE_ENABLED` | `true` | Save chain/wallets to disk |

Load from `.env` in the project root automatically via `pydantic-settings`.

### Frontend

| Method | Purpose |
|--------|---------|
| `<meta name="chain-api-url">` in `index.html` | Default API base URL |
| `localStorage.chain_api_url` | Override API URL at runtime |
| `?debug=1` URL param | Enable debug mode + DevTools panel |
| `localStorage.chain_debug=true` | Persist debug mode |

Public config from API: `GET /config`

---

## Logging

### Backend

- Logger namespace: `blockchain` (children: `blockchain.api`, `blockchain.api.request`)
- Request middleware logs every HTTP call with duration and `X-Request-ID`
- JSON logs when `CHAIN_LOG_FORMAT=json`

```bash
CHAIN_LOG_LEVEL=DEBUG CHAIN_DEBUG=true python -m uvicorn backend.api:app --reload
```

### Frontend

`Logger` module with levels (`debug`, `info`, `warn`, `error`):

```javascript
Logger.debug('Fetching blocks', { count: 5 });
Logger.info('Dashboard initialized');
```

Debug mode sets level to `debug` automatically.

---

## Error handling

### Backend

Structured exceptions in `backend/exceptions.py`:

- `AppError` — base with `status_code`, `code`, `message`, `details`
- `NotFoundError`, `ValidationFailedError`, `ConflictError`

All errors return a consistent JSON shape:

```json
{
  "error": {
    "type": "ValidationError",
    "code": "VALIDATION_ERROR",
    "message": "Insufficient balance",
    "timestamp": 1710000000.0,
    "request_id": "abc123"
  }
}
```

### Frontend

- `ApiError` — typed error with `status`, `code`, `requestId`
- `ErrorUtils.parseResponse()` — normalizes API error bodies
- `ErrorUtils.notify(err)` — shows rich toast with request ID when available
- `Toast.showError(err, { title: 'Mining' })`

---

## Reusable frontend utilities

Located in `frontend/js/`:

| Module | Purpose |
|--------|---------|
| `config.js` | `AppConfig` — runtime settings |
| `logger.js` | `Logger` — namespaced console logging |
| `errors.js` | `ApiError`, `ErrorUtils` |
| `hooks.js` | `Hooks.track`, `Hooks.withAsync`, `Hooks.debounce`, `Hooks.useStorage` |
| `ui-states.js` | `UIStates.loading/empty/error` — consistent placeholders |
| `connection.js` | `ConnectionStatus` — offline banner |
| `devtools.js` | `ChainDev` console helpers (debug mode) |

### Hooks pattern (vanilla JS)

```javascript
// Track in-flight API calls
await Hooks.track('my-key', fetchSomething());

// Wrap async work with loading + error handling
const load = Hooks.withAsync('blocks', async () => {
  const blocks = await BlockchainAPI.getBlocks();
  render(blocks);
}, { onError: (err) => UIStates.setError(el, { message: err.toDisplayString() }) });

await load();
```

### UI states

```javascript
UIStates.setLoading(container, { message: 'Loading wallets…' });
UIStates.setEmpty(container, { title: 'No wallets', message: 'Create one above.' });
UIStates.setError(container, { title: 'Failed', message: err.toDisplayString() });
```

Table skeletons: `UIStates.loading({ rows: 4, cols: 6 })`

---

## Debugging

### API endpoints

| Endpoint | When available |
|----------|----------------|
| `GET /health` | Always |
| `GET /config` | Always — public settings |
| `GET /debug/info` | `CHAIN_DEBUG=true` only |
| `GET /docs` | Swagger UI |

### Frontend DevTools

Append `?debug=1` to the frontend URL, then use the browser console:

```javascript
ChainDev.config()        // local frontend config
ChainDev.health()        // ping API
ChainDev.configRemote()  // GET /config
ChainDev.debugInfo()     // GET /debug/info (requires CHAIN_DEBUG)
ChainDev.setApi('http://localhost:8000')
```

A floating DevTools panel appears in debug mode.

### Correlating requests

Every API response includes `X-Request-ID`. Error toasts show this as `(ref: abc123)` when present.

---

## Notifications

`Toast` supports plain and rich messages:

```javascript
Toast.success('Block mined');
Toast.show('Info message', 'info');
Toast.showWithTitle('Mining failed', 'Insufficient balance', 'error');
Toast.showError(apiError, { title: 'Transaction' });
```

---

## Loading & empty states

- **App loader** — full-screen spinner during initial API health check
- **Connection banner** — appears when polling detects API offline
- **Skeleton rows** — blocks/wallets/transactions tables while loading
- **Empty states** — guided messages when chain/wallets/mempool are empty

---

## Project layout (DX-related)

```
backend/
  settings.py          # env-driven config (pydantic-settings)
  logging_config.py    # text/json logging
  exceptions.py        # AppError hierarchy
  middleware/          # request logging + timing
  config.py            # blockchain CONFIG dataclass

frontend/js/
  config.js            # AppConfig
  logger.js            # Logger
  errors.js            # ApiError, ErrorUtils
  hooks.js             # Hooks (async tracking, debounce)
  ui-states.js         # Loading/empty/error components
  connection.js        # Offline banner
  devtools.js          # ChainDev helpers

scripts/dev.sh         # one-command dev stack
.env.example           # environment template
```

---

## Adding a new API endpoint (checklist)

1. Add Pydantic models in `backend/models.py`
2. Implement logic in the appropriate `backend/services/*.py`
3. Add route in `backend/api.py` with summary/description
4. Add `BlockchainAPI.staticMethod()` in `frontend/js/api.js`
5. Use `Hooks.withAsync('key', fn)` in UI renderers
6. Use `ErrorUtils.notify(err)` in event handlers

---

## Troubleshooting

| Symptom | Check |
|---------|-------|
| Frontend shows offline banner | `curl http://localhost:8000/health` |
| CORS errors | `CHAIN_CORS_ORIGINS` includes frontend origin |
| 500 with generic message | Set `CHAIN_DEBUG=true` for stack traces in logs |
| Wrong API URL | Meta tag, `ChainDev.config()`, or `localStorage.chain_api_url` |
| No request logs | `CHAIN_LOG_LEVEL=INFO` (middleware always logs at INFO+) |

See also [`backend/ARCHITECTURE.md`](backend/ARCHITECTURE.md) for service layer design.

---

## Accessibility (Phase 10)

WCAG 2.2 oriented improvements:

| Feature | Implementation |
|---------|----------------|
| Keyboard navigation | Full Tab order, arrow keys in Visualize/Learn/Lab topics, `Esc` closes mobile menu, `?` shortcuts help |
| Screen readers | Live region announcements on view change, connection status, toasts with `aria-live` |
| ARIA | Landmarks (`main`, `banner`, `nav`), `aria-current`, `aria-hidden` on inactive views, table captions |
| High contrast | **A+** toolbar toggle + `prefers-contrast: more` + `forced-colors` support |
| Focus | `:focus-visible` rings on all interactive elements (3px outline) |
| Responsive | 44px touch targets, mobile nav with `aria-expanded` |
| Reduced motion | Respects `prefers-reduced-motion` (Phase 9) |

Files: `frontend/css/accessibility.css`, `frontend/js/accessibility.js`


### Network

- **ApiCache** — TTL cache + in-flight deduplication (`frontend/js/cache.js`)
- **Summary blocks** — `GET /blocks?summary=true` omits transaction bodies (~90% smaller payloads)
- **Mutation invalidation** — POST endpoints clear relevant cache keys automatically
- **View-aware polling** — transactions poll only on Overview/Transactions; pauses when tab hidden

### Rendering

- **Fingerprint diffing** — skip DOM updates when data unchanged
- **Scheduler.schedule** — batch DOM writes in `requestAnimationFrame`
- **VirtualList** — windowed rows for 40+ blocks (`virtualizeThreshold` in config)
- **Chain preview** — renders last 15 blocks only
- **content-visibility** — inactive views skip layout/paint (`css/perf.css`)

### Code splitting / lazy loading

Heavy modules load on first visit only:

| View | Lazy-loaded |
|------|-------------|
| Analytics | Chart.js + `analytics.js` |
| Visualize | `visualizations.css` + `visualizations.js` |
| Learn | `education.css` + `education.js` |
| Security Lab | `security-lab.css` + `security-lab.js` |

Initial bundle: core dashboard only (~15 KB JS excluding CDN).

### Memory

- Chart.js instances destroyed when leaving Analytics
- Visualization timers cleared on topic switch
- Mempool history capped at 24 points in analytics

### Tuning

```javascript
// AppConfig.defaults (config.js)
pollIntervalMs: 3000,
analyticsPollMs: 8000,
virtualizeThreshold: 40,
chainPreviewMax: 15,
```

Backend pagination: `GET /blocks?summary=true&limit=100&offset=0`

---

## Implementation governance (Phase 12)

See [`IMPLEMENTATION_RULES.md`](IMPLEMENTATION_RULES.md) for the full rule set. Summary:

- Understand before edit · reuse abstractions · minimal diffs · no placeholders
- Python typing + Pydantic; JSDoc for JS utilities
- After significant changes: document **what / why / impact / risks** in `CHANGELOG.md`

