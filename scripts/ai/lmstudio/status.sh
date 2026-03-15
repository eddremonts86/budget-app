#!/usr/bin/env sh

set -eu

echo "[lmstudio] service status"
docker compose ps lmstudio

echo "[lmstudio] server status"
docker compose exec -T lmstudio lms status || true

echo "[lmstudio] downloaded models"
docker compose exec -T lmstudio lms ls || true

echo "[lmstudio] loaded models"
docker compose exec -T lmstudio lms ps || true
