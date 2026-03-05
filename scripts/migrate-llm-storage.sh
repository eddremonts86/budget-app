#!/usr/bin/env sh
set -eu

ROOT_DIR=".docker_data"
NEW_ROOT="$ROOT_DIR/llm-models"

mkdir -p "$NEW_ROOT"

migrate_dir() {
  legacy_dir="$1"
  target_dir="$2"

  if [ -d "$legacy_dir" ] && [ ! -d "$target_dir" ]; then
    echo "[migrate] moving $legacy_dir -> $target_dir"
    mkdir -p "$(dirname "$target_dir")"
    mv "$legacy_dir" "$target_dir"
  fi
}

migrate_dir "$ROOT_DIR/models" "$NEW_ROOT/llama-cpp"
migrate_dir "$ROOT_DIR/ollama" "$NEW_ROOT/ollama"
migrate_dir "$ROOT_DIR/lmstudio" "$NEW_ROOT/lmstudio"

echo "[migrate] llm storage migration check complete"
