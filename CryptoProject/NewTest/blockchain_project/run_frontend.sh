#!/bin/bash
# Run a local HTTP server for the frontend

cd "$(dirname "$0")/frontend"
python -m http.server 8001
