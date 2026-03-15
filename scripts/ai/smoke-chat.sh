#!/usr/bin/env sh

set -eu

BASE_URL="${APP_URL:-http://localhost:3000}"
URL="$BASE_URL/api/ai/chat?locale=es-ES"
PROMPT="${1:-Responde solo con una frase corta en español confirmando que el chat funciona.}"

echo "[smoke-ai-chat] target: $URL"
echo "[smoke-ai-chat] prompt: $PROMPT"

TMP_FILE="$(mktemp)"
HTTP_CODE="$(curl -sS -N --max-time 45 -o "$TMP_FILE" -w "%{http_code}" -X POST "$URL" -H "Content-Type: application/json" -d "{\"messages\":[{\"role\":\"user\",\"content\":\"$PROMPT\"}]}")"

if [ "$HTTP_CODE" != "200" ]; then
	echo "[smoke-ai-chat] request failed with status: $HTTP_CODE"
	head -c 400 "$TMP_FILE"
	echo
	rm -f "$TMP_FILE"
	exit 1
fi

if ! grep -q '^data:' "$TMP_FILE"; then
	echo "[smoke-ai-chat] expected SSE data frames but none were found"
	head -c 400 "$TMP_FILE"
	echo
	rm -f "$TMP_FILE"
	exit 1
fi

if grep -q '"type":"RUN_ERROR"' "$TMP_FILE"; then
	echo "[smoke-ai-chat] RUN_ERROR detected in SSE stream"
	head -c 500 "$TMP_FILE"
	echo
	rm -f "$TMP_FILE"
	exit 1
fi

echo "[smoke-ai-chat] SSE endpoint OK (200)"
echo "[smoke-ai-chat] response preview:"
head -c 500 "$TMP_FILE"
echo

rm -f "$TMP_FILE"