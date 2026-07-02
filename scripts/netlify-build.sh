#!/usr/bin/env bash
# Prepare the Chain Explorer frontend for Netlify.
#
# Netlify hosts static files only. The FastAPI backend must run elsewhere
# (Render, Railway, Fly.io, a VPS, etc.) unless CHAIN_NETLIFY_PROXY is enabled.
#
# Environment (set in Netlify UI → Site configuration → Environment variables):
#   CHAIN_API_URL          Backend base URL, e.g. https://your-api.onrender.com
#   CHAIN_NETLIFY_PROXY    Set to "true" to proxy API routes through Netlify
#                          (avoids CORS; requires CHAIN_API_URL as upstream)
#
# Local preview:
#   CHAIN_API_URL=https://your-api.example.com ./scripts/netlify-build.sh
#   npx serve dist/netlify
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/dist/netlify"
FRONTEND="$ROOT/frontend"

if [[ -f "$ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env"
  set +a
fi

BACKEND_URL="${CHAIN_API_URL:-}"
PROXY="${CHAIN_NETLIFY_PROXY:-false}"
META_API_URL="$BACKEND_URL"

echo "Netlify build — Chain Explorer frontend"
echo "  Output:   $OUT"
echo "  Backend:  ${BACKEND_URL:-<not set>}"
echo "  Proxy:    $PROXY"
echo ""

rm -rf "$OUT"
mkdir -p "$OUT"
cp -a "$FRONTEND/." "$OUT/"

if [[ "$PROXY" == "true" || "$PROXY" == "1" ]]; then
  if [[ -z "$BACKEND_URL" ]]; then
    echo "error: CHAIN_NETLIFY_PROXY requires CHAIN_API_URL (upstream backend)." >&2
    exit 1
  fi
  BACKEND_URL="${BACKEND_URL%/}"
  META_API_URL=""
  write_redirects() {
    cat > "$OUT/_redirects" <<EOF
/health              ${BACKEND_URL}/health              200
/config              ${BACKEND_URL}/config              200
/debug/info          ${BACKEND_URL}/debug/info          200
/chain               ${BACKEND_URL}/chain               200
/blocks              ${BACKEND_URL}/blocks              200
/blocks/*            ${BACKEND_URL}/blocks/:splat       200
/stats               ${BACKEND_URL}/stats               200
/analytics           ${BACKEND_URL}/analytics           200
/validate            ${BACKEND_URL}/validate            200
/wallets             ${BACKEND_URL}/wallets             200
/wallets/*           ${BACKEND_URL}/wallets/:splat      200
/wallets/name/*      ${BACKEND_URL}/wallets/name/:splat  200
/transactions        ${BACKEND_URL}/transactions        200
/wallet/create       ${BACKEND_URL}/wallet/create       200
/transaction/create  ${BACKEND_URL}/transaction/create  200
/mine                ${BACKEND_URL}/mine                200
/tamper              ${BACKEND_URL}/tamper              200
/attack/51percent    ${BACKEND_URL}/attack/51percent    200
/peers               ${BACKEND_URL}/peers               200
/peers/register      ${BACKEND_URL}/peers/register      200
/network/sync        ${BACKEND_URL}/network/sync        200
/reset               ${BACKEND_URL}/reset               200
/settings/difficulty ${BACKEND_URL}/settings/difficulty 200
EOF
  }
  write_redirects
  echo "  Wrote _redirects (same-origin API proxy → $BACKEND_URL)"
elif [[ -z "$META_API_URL" ]]; then
  META_API_URL="http://localhost:8000"
  echo "  warning: CHAIN_API_URL not set — meta tag left at localhost (set env in Netlify)." >&2
fi

# Inject API URL into the built index.html (runtime default for AppConfig).
python3 - "$OUT/index.html" "$META_API_URL" <<'PY'
import sys
from pathlib import Path

path = Path(sys.argv[1])
api_url = sys.argv[2]
text = path.read_text(encoding="utf-8")
needle = '<meta name="chain-api-url" content="'
start = text.find(needle)
if start == -1:
    raise SystemExit("chain-api-url meta tag not found in index.html")
start += len(needle)
end = text.find('"', start)
path.write_text(text[:start] + api_url + text[end:], encoding="utf-8")
PY

echo ""
echo "Build complete → $OUT"
if [[ -n "$META_API_URL" ]]; then
  echo "  Frontend will call API at: $META_API_URL"
else
  echo "  Frontend will call API on the same origin (Netlify proxy)."
fi
