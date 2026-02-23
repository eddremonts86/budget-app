#!/usr/bin/env sh

set -eu

MODEL="${1:-${OLLAMA_MODEL:-llama3.2}}"
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

echo "[ollama] pulling model: $MODEL"
if docker compose exec -T ollama ollama list | grep -q "$MODEL"; then
  echo "[ollama] model already exists: $MODEL"
else
  echo "[ollama] downloading model $MODEL..."
  docker compose exec -T ollama ollama pull "$MODEL"
fi

echo "[ollama] ready at http://localhost:11434"
