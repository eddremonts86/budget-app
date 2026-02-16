#!/usr/bin/env sh

set -eu

MODEL="${1:-${LMSTUDIO_MODEL:-google/gemma-3-1b}}"
IDENTIFIER="${2:-${LMSTUDIO_IDENTIFIER:-local-model}}"
MAX_RETRIES="${LMSTUDIO_HEALTH_RETRIES:-60}"
SLEEP_SECONDS="${LMSTUDIO_HEALTH_SLEEP_SECONDS:-2}"

echo "[lmstudio] ensuring container is running..."
docker compose up -d lmstudio

echo "[lmstudio] waiting for healthy status..."
retries=0
while ! docker compose ps lmstudio | grep -q "healthy"; do
  retries=$((retries + 1))

  if [ "$retries" -ge "$MAX_RETRIES" ]; then
    echo "[lmstudio] timed out waiting for healthy status"
    docker compose ps
    exit 1
  fi

  sleep "$SLEEP_SECONDS"
done

echo "[lmstudio] container is healthy"

echo "[lmstudio] enforcing server-side CORS"
docker compose exec -T lmstudio lms server stop || true
docker compose exec -T lmstudio lms server start --port 1234 --cors

if docker compose exec -T lmstudio lms ls | grep -Fq "$MODEL"; then
  echo "[lmstudio] model already downloaded: $MODEL"
else
  echo "[lmstudio] downloading model: $MODEL"
  if ! docker compose exec -T lmstudio lms get "$MODEL" --yes; then
    echo "[lmstudio] exact model not found, trying fallback search for: $MODEL"
    docker compose exec -T lmstudio lms get "$MODEL" --gguf --yes
  fi
fi

if docker compose exec -T lmstudio lms ps | grep -Fq "$IDENTIFIER"; then
  echo "[lmstudio] model already loaded with identifier: $IDENTIFIER"
else
  echo "[lmstudio] loading model with identifier: $IDENTIFIER"
  if ! docker compose exec -T lmstudio lms load "$MODEL" --identifier "$IDENTIFIER"; then
    echo "[lmstudio] load with identifier failed, retrying without identifier"
    docker compose exec -T lmstudio lms load "$MODEL"
  fi
fi

echo "[lmstudio] loaded models:"
docker compose exec -T lmstudio lms ps || true

echo "[lmstudio] ready at http://localhost:1234/v1"