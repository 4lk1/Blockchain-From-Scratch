#!/usr/bin/env bash
# Run a local HTTP server for the frontend

set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/frontend"
python -m http.server 8001
