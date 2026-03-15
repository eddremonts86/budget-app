#!/usr/bin/env sh

set -eu

MODEL="${1:-${LMSTUDIO_MODEL:-google/gemma-3-1b}}"
IDENTIFIER="${2:-${LMSTUDIO_IDENTIFIER:-local-model}}"

echo "[lmstudio] ensuring service is up"
docker compose up -d lmstudio

echo "[lmstudio] downloading model if needed: $MODEL"
if docker compose exec -T lmstudio lms ls | grep -Fq "$MODEL"; then
  echo "[lmstudio] model already present"
else
  if ! docker compose exec -T lmstudio lms get "$MODEL" --yes; then
    echo "[lmstudio] exact model not found, trying fallback search for: $MODEL"
    docker compose exec -T lmstudio lms get "$MODEL" --gguf --yes
  fi
fi

echo "[lmstudio] loading model with identifier: $IDENTIFIER"
if ! docker compose exec -T lmstudio lms load "$MODEL" --identifier "$IDENTIFIER"; then
  echo "[lmstudio] retrying without identifier"
  docker compose exec -T lmstudio lms load "$MODEL"
fi

echo "[lmstudio] current loaded models"
docker compose exec -T lmstudio lms ps || true
