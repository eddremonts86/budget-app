#!/usr/bin/env sh

set -eu

QUERY="${1:-resume las secciones principales del dashboard}"
BASE_URL="${APP_URL:-http://localhost:3000}"
STATUS_URL="$BASE_URL/api/ai/status"
SEARCH_URL="$BASE_URL/api/ai/search"

echo "[smoke-ai] status target: $STATUS_URL"
echo "[smoke-ai] query: $QUERY"

STATUS_FILE="$(mktemp)"
STATUS_HTTP_CODE="$(curl -sS -o "$STATUS_FILE" -w "%{http_code}" "$STATUS_URL")"

if [ "$STATUS_HTTP_CODE" != "200" ]; then
	echo "[smoke-ai] status request failed with status: $STATUS_HTTP_CODE"
	cat "$STATUS_FILE"
	rm -f "$STATUS_FILE"
	exit 1
fi

if ! node -e "const fs=require('fs');const r=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));if(!r||!Array.isArray(r.statuses)||!r.statuses.length){process.exit(1)}const ok=r.statuses.some((s)=>s&&s.available===true);if(!ok){process.exit(2)}" "$STATUS_FILE"; then
	echo "[smoke-ai] no available AI providers reported by /api/ai/status"
	cat "$STATUS_FILE"
	rm -f "$STATUS_FILE"
	exit 1
fi

echo "[smoke-ai] status endpoint OK (200) with available provider"
rm -f "$STATUS_FILE"

PAYLOAD=$(cat <<EOF
{"query":"$QUERY"}
EOF
)

SEARCH_FILE="$(mktemp)"
SEARCH_HTTP_CODE="$(curl -sS -o "$SEARCH_FILE" -w "%{http_code}" -X POST "$SEARCH_URL" -H "Content-Type: application/json" -d "$PAYLOAD")"

if [ "$SEARCH_HTTP_CODE" = "200" ]; then
	echo "[smoke-ai] search endpoint OK (200)"
	echo "[smoke-ai] search response preview:"
	head -c 400 "$SEARCH_FILE"
	echo
else
	echo "[smoke-ai] search endpoint returned $SEARCH_HTTP_CODE (non-fatal)"
	head -c 300 "$SEARCH_FILE"
	echo
fi

rm -f "$SEARCH_FILE"