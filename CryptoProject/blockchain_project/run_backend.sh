#!/usr/bin/env bash
# Run the blockchain backend API server

set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"
python -m uvicorn backend.api:app --host 127.0.0.1 --port 8000 --reload
