#!/usr/bin/env sh
set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)"
cd "$ROOT_DIR"

AUTH_E2E_DB_URL="${AUTH_E2E_DB_URL:-postgresql://postgres:postgres@127.0.0.1:5433/tanstack_template_auth_e2e}"
AUTH_E2E_BASE_URL="${AUTH_E2E_BASE_URL:-http://127.0.0.1:3110}"
AUTH_E2E_PORT="${AUTH_E2E_PORT:-3110}"

pnpm db:up
docker compose stop app >/dev/null 2>&1 || true

(lsof -ti tcp:"$AUTH_E2E_PORT" | xargs kill -9) >/dev/null 2>&1 || true
(pkill -f "vite dev --host 127.0.0.1 --port $AUTH_E2E_PORT") >/dev/null 2>&1 || true

AUTH_E2E_DB_URL="$AUTH_E2E_DB_URL" pnpm auth:e2e:prepare >/dev/null

DATABASE_URL="$AUTH_E2E_DB_URL" \
BETTER_AUTH_URL="$AUTH_E2E_BASE_URL" \
VITE_BETTER_AUTH_URL="$AUTH_E2E_BASE_URL" \
AUTH_MODE=local \
VITE_AUTH_MODE=local \
SKIP_AUTH=0 \
VITE_SKIP_AUTH=0 \
VITE_E2E=0 \
DISABLE_TANSTACK_VITE_DEVTOOLS=true \
pnpm exec vite dev --host 127.0.0.1 --port "$AUTH_E2E_PORT" --strictPort >/tmp/auth-local-approval-smoke-server.log 2>&1 &
SERVER_PID=$!

cleanup() {
  kill "$SERVER_PID" >/dev/null 2>&1 || true
}

trap cleanup EXIT INT TERM

for _ in $(seq 1 60); do
  if curl -sf "$AUTH_E2E_BASE_URL" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

if ! curl -sf "$AUTH_E2E_BASE_URL" >/dev/null 2>&1; then
  echo '{"status":"failed","message":"Auth-local approval smoke server did not become ready"}'
  exit 1
fi

AUTH_E2E_DB_URL="$AUTH_E2E_DB_URL" AUTH_E2E_BASE_URL="$AUTH_E2E_BASE_URL" pnpm tsx scripts/testing/validate-auth-local-approval.ts