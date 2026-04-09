#!/usr/bin/env sh
set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)"
cd "$ROOT_DIR"

pnpm db:up
docker compose stop app >/dev/null 2>&1 || true

(lsof -ti tcp:3000 | xargs -r kill -9) >/dev/null 2>&1 || true
(lsof -ti tcp:3100 | xargs -r kill -9) >/dev/null 2>&1 || true
(pkill -f "vite dev --port 3000") >/dev/null 2>&1 || true
(pkill -f "vite dev --host 127.0.0.1 --port 3100") >/dev/null 2>&1 || true
(pkill -f "npm run dev:server") >/dev/null 2>&1 || true

pnpm playwright test --reporter=dot
pnpm test:e2e:auth-local
