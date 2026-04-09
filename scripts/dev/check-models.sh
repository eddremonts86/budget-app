#!/usr/bin/env sh
set -e

MODEL_DIR=".docker_data/llm-models/llama-cpp"
LEGACY_DIR=".docker_data/models"

mkdir -p "$MODEL_DIR"

if [ -d "$LEGACY_DIR" ]; then
  legacy_models="$(ls -1 "$LEGACY_DIR"/*.gguf 2>/dev/null || true)"
  if [ -n "$legacy_models" ]; then
    for model_path in $legacy_models; do
      model_file="$(basename "$model_path")"
      if [ ! -f "$MODEL_DIR/$model_file" ]; then
        mv "$model_path" "$MODEL_DIR/$model_file"
      fi
    done
  fi
fi

models="$(ls -1 "$MODEL_DIR"/*.gguf 2>/dev/null || true)"
if [ -z "$models" ]; then
  echo "❌ ERROR: No llama.cpp GGUF models found in $MODEL_DIR"
  echo ""
  echo "👉 ACTION REQUIRED: Run one of:"
  echo "   pnpm docker:up:full"
  echo "   sh scripts/ai/bootstrap-llama-cpp.sh"
  echo ""
  exit 1
fi

echo "✅ AI models detected:"
echo "$models" | sed 's/^/ - /'
exit 0
