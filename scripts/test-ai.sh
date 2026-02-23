#!/usr/bin/env sh
set -e

echo "[ai-test] Testing AI integration endpoints..."

# Test Llama.cpp
echo "[ai-test] 1. Testing Llama.cpp (port 8080)..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/health | grep -q "200"; then
  echo "  [OK] Llama.cpp is healthy."
else
  echo "  [FAIL] Llama.cpp health check failed."
fi

# Test Ollama
echo "[ai-test] 2. Testing Ollama (port 11434)..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:11434/api/tags | grep -q "200"; then
  echo "  [OK] Ollama is reachable."
else
  echo "  [FAIL] Ollama is not reachable."
fi

# Test App Config
echo "[ai-test] 3. Testing App AI Config..."
# This assumes the app is running and accessible
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/ai/config | grep -q "200"; then
  echo "  [OK] App AI config endpoint is reachable."
else
  echo "  [WARN] App AI config endpoint not reachable (app might not be fully started)."
fi

echo "[ai-test] Integration tests completed."
