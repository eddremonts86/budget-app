#!/usr/bin/env sh
set -e

echo "[ai-bootstrap] Starting AI services bootstrap..."

echo "[ai-bootstrap] Configuring Ollama..."
sh scripts/ai/bootstrap-ollama.sh

echo "[ai-bootstrap] Configuring Llama.cpp..."
sh scripts/ai/bootstrap-llama-cpp.sh

echo "[ai-bootstrap] Checking LM Studio..."
if nc -z localhost 1234 2>/dev/null; then
	echo "[ai-bootstrap] LM Studio detected on port 1234."
else
	echo "[ai-bootstrap] LM Studio not detected on port 1234 (this is optional)."
fi

echo "[ai-bootstrap] All AI services configured."