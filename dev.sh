#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

(
  cd "$ROOT_DIR/server"
  npm i --silent >/dev/null 2>&1 || true
  npm run dev &
)  

(
  cd "$ROOT_DIR/client"
  npm i --silent >/dev/null 2>&1 || true
  npm run dev &
)

echo "Server and client started."
echo "- Server: http://localhost:4000"
echo "- Client: http://localhost:5173"

# Wait for background jobs
wait


