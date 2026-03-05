#!/usr/bin/env sh

set -eu

MODEL="${1:-${OLLAMA_MODEL:-qwen3.5:9b}}"
DRAFT_MODEL="${2:-${OLLAMA_DRAFT_MODEL:-qwen3.5:0.8b}}"
MAX_RETRIES="${OLLAMA_HEALTH_RETRIES:-60}"
SLEEP_SECONDS="${OLLAMA_HEALTH_SLEEP_SECONDS:-2}"

echo "[ollama] ensuring container is running..."
docker compose up -d ollama

echo "[ollama] waiting for healthy status..."
retries=0
while ! docker compose ps ollama | grep -q "healthy"; do
  retries=$((retries + 1))

  if [ "$retries" -ge "$MAX_RETRIES" ]; then
    echo "[ollama] timed out waiting for healthy status"
    docker compose ps
    exit 1
  fi

  sleep "$SLEEP_SECONDS"
done

echo "[ollama] container is healthy"

echo "[ollama] pulling main model: $MODEL"
if docker compose exec -T ollama ollama list | grep -q "$MODEL"; then
  echo "[ollama] main model already exists: $MODEL"
else
  echo "[ollama] downloading main model $MODEL..."
  docker compose exec -T ollama ollama pull "$MODEL"
fi

echo "[ollama] pulling draft model: $DRAFT_MODEL"
if docker compose exec -T ollama ollama list | grep -q "$DRAFT_MODEL"; then
  echo "[ollama] draft model already exists: $DRAFT_MODEL"
else
  echo "[ollama] downloading draft model $DRAFT_MODEL..."
  docker compose exec -T ollama ollama pull "$DRAFT_MODEL"
fi

echo "[ollama] ready at http://localhost:11434"
