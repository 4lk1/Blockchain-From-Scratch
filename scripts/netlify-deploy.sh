#!/usr/bin/env bash
# Build and deploy Chain Explorer to Netlify.
#
# First-time setup:
#   npm install -g netlify-cli    # or use npx netlify below
#   netlify login
#   netlify init                  # link repo / create site (from repo root)
#
# Configure in Netlify (or .env):
#   CHAIN_API_URL=https://your-backend.example.com
#   CHAIN_NETLIFY_PROXY=true      # optional — same-origin proxy, no CORS setup
#
# Usage:
#   ./scripts/netlify-deploy.sh              # draft deploy (preview URL)
#   ./scripts/netlify-deploy.sh --prod       # production deploy
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

NETLIFY="${NETLIFY_CMD:-netlify}"

if ! command -v "$NETLIFY" >/dev/null 2>&1; then
  echo "Netlify CLI not found; using npx netlify-cli"
  NETLIFY="npx --yes netlify-cli"
fi

echo "Building Netlify publish directory…"
bash "$ROOT/scripts/netlify-build.sh"

echo ""
echo "Deploying to Netlify…"
# shellcheck disable=SC2086
$NETLIFY deploy --dir=dist/netlify "$@"
