#!/usr/bin/env sh

set -eu

MODE="${1:-soft}"

case "$MODE" in
  soft)
    echo "[reset] stopping stack (containers + network)..."
    docker compose down --remove-orphans
    ;;
  hard)
    echo "[reset] stopping stack and removing named volumes..."
    docker compose down --remove-orphans --volumes
    ;;
  *)
    echo "Usage: sh scripts/docker/reset-stack.sh [soft|hard]"
    exit 1
    ;;
esac

echo "[reset] done"
