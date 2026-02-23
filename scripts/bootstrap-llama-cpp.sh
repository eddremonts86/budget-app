#!/usr/bin/env sh
set -eu

MODEL_URL="https://huggingface.co/bartowski/Llama-3.2-1B-Instruct-GGUF/resolve/main/Llama-3.2-1B-Instruct-Q4_K_M.gguf"
MODEL_FILE="models/llama-3.2-1b-instruct-q4_k_m.gguf"
MODEL_DIR="models"

echo "[llama-cpp] Checking for model..."

if [ ! -d "$MODEL_DIR" ]; then
  mkdir -p "$MODEL_DIR"
fi

if [ ! -f "$MODEL_FILE" ]; then
  echo "[llama-cpp] Model not found. Downloading Llama 3.2 1B Instruct..."
  echo "[llama-cpp] URL: $MODEL_URL"
  # Check if curl exists
  if command -v curl >/dev/null 2>&1; then
    curl -L -o "$MODEL_FILE" "$MODEL_URL"
  elif command -v wget >/dev/null 2>&1; then
    wget -O "$MODEL_FILE" "$MODEL_URL"
  else
    echo "[llama-cpp] Error: neither curl nor wget found. Please install one of them."
    exit 1
  fi
  echo "[llama-cpp] Download complete."
else
  echo "[llama-cpp] Model already exists."
fi

# Verify checksum (simple check)
if [ -f "$MODEL_FILE" ]; then
  echo "[llama-cpp] Verifying model integrity..."
  # Just checking file size > 100MB for now as a smoke test
  SIZE=$(wc -c < "$MODEL_FILE" | tr -d ' ')
  if [ "$SIZE" -lt 100000000 ]; then
    echo "[llama-cpp] Error: Model file seems too small ($SIZE bytes). Delete it and try again."
    rm "$MODEL_FILE"
    exit 1
  fi
  echo "[llama-cpp] Integrity check passed."
fi
