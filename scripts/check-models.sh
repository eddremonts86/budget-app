#!/usr/bin/env sh
set -e

# Define model paths
LLAMA_MODEL_PATH=".docker_data/llm-models/llama-cpp/llama-3.2-1b-instruct-q4_k_m.gguf"
LEGACY_MODEL_PATH=".docker_data/models/llama-3.2-1b-instruct-q4_k_m.gguf"

# Check Llama.cpp model
if [ ! -f "$LLAMA_MODEL_PATH" ] && [ -f "$LEGACY_MODEL_PATH" ]; then
  mkdir -p ".docker_data/llm-models/llama-cpp"
  mv "$LEGACY_MODEL_PATH" "$LLAMA_MODEL_PATH"
fi

if [ ! -f "$LLAMA_MODEL_PATH" ]; then
  echo "❌ ERROR: Llama.cpp model not found at $LLAMA_MODEL_PATH"
  echo "The application requires this model to start the AI service."
  echo ""
  echo "👉 ACTION REQUIRED: Run the following command to download the model:"
  echo "   pnpm docker:up:full"
  echo "   OR"
  echo "   sh scripts/bootstrap-llama-cpp.sh"
  echo ""
  exit 1
fi

echo "✅ All required AI models are present."
exit 0
