#!/usr/bin/env bash
# Start backend + frontend for local development
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

API_PORT="${CHAIN_API_PORT:-8000}"
FE_PORT="${CHAIN_FE_PORT:-8001}"

echo "Starting Chain Explorer dev stack"
echo "  API:      http://127.0.0.1:${API_PORT}  (docs: /docs)"
echo "  Frontend: http://127.0.0.1:${FE_PORT}"
echo "  Debug:    CHAIN_DEBUG=true or ?debug=1 on frontend"
echo ""

cleanup() {
  echo ""
  echo "Stopping dev servers…"
  jobs -p | xargs -r kill 2>/dev/null || true
}
trap cleanup EXIT INT TERM

python -m uvicorn backend.api:app --host 127.0.0.1 --port "$API_PORT" --reload &
python -m http.server "$FE_PORT" --directory frontend &

wait
