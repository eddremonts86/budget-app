#!/usr/bin/env sh

set -eu

PORT="${LMSTUDIO_PORT:-1234}"

echo "[lmstudio] ensuring service is up"
docker compose up -d lmstudio

echo "[lmstudio] restarting server with CORS enabled on port ${PORT}"
docker compose exec -T lmstudio lms server stop || true
docker compose exec -T lmstudio lms server start --port "$PORT" --cors

echo "[lmstudio] validating CORS headers"
if ! curl -i -s "http://localhost:${PORT}/v1/models" -H "Origin: http://localhost:3000" | grep -qi 'access-control-allow-origin'; then
  echo "[lmstudio] CORS header not detected after restart"
  exit 1
fi

echo "[lmstudio] CORS enabled successfully"
