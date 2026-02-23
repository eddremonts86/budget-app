#!/usr/bin/env sh
set -e

echo "[ai-bootstrap] Starting AI services bootstrap..."

# 1. Bootstrap Ollama
echo "[ai-bootstrap] Configuring Ollama..."
sh scripts/bootstrap-ollama.sh

# 2. Bootstrap Llama.cpp (download model)
echo "[ai-bootstrap] Configuring Llama.cpp..."
sh scripts/bootstrap-llama-cpp.sh

# 3. Check for LM Studio (optional check)
echo "[ai-bootstrap] Checking LM Studio..."
if nc -z localhost 1234 2>/dev/null; then
  echo "[ai-bootstrap] LM Studio detected on port 1234."
else
  echo "[ai-bootstrap] LM Studio not detected on port 1234 (this is optional)."
fi

echo "[ai-bootstrap] All AI services configured."
