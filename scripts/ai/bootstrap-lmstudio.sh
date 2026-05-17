#!/usr/bin/env sh
# Bootstrap / verify LM Studio local server (host application, no Docker).
#
# LM Studio does NOT have an official Docker image — it runs as a native
# desktop application on macOS / Windows / Linux and exposes an
# OpenAI-compatible REST API on port 1234.
#
# This script:
#   1. Checks if the LM Studio server is already reachable at localhost:1234
#   2. If not, tries to start it via the `lms` CLI (installed with LM Studio)
#   3. Optionally loads a model if `lms` CLI is available
#
# Usage:
#   sh scripts/ai/bootstrap-lmstudio.sh
#   sh scripts/ai/bootstrap-lmstudio.sh qwen3.5-2b

set -eu

MODEL="${1:-${LMSTUDIO_MODEL:-qwen3.5-2b}}"
IDENTIFIER="${2:-${LMSTUDIO_IDENTIFIER:-lmstudio:compat}}"
MAX_RETRIES="${LMSTUDIO_HEALTH_RETRIES:-30}"
SLEEP_SECONDS="${LMSTUDIO_HEALTH_SLEEP_SECONDS:-2}"
LMS_PORT="${LMSTUDIO_PORT:-1234}"
LMS_URL="http://localhost:${LMS_PORT}/v1"

# ── Check if server is already up ────────────────────────────────────────────
server_ready() {
	curl -fsS "${LMS_URL}/models" > /dev/null 2>&1
}

if server_ready; then
	echo "[lmstudio] server already running at ${LMS_URL}"
else
	echo "[lmstudio] server not detected at ${LMS_URL}"

	# Try to start via lms CLI if available
	if command -v lms > /dev/null 2>&1; then
		echo "[lmstudio] starting server via: lms server start --port ${LMS_PORT} --cors"
		lms server start --host 0.0.0.0 --port "${LMS_PORT}" --cors || true

		echo "[lmstudio] waiting for server to be ready..."
		retries=0
		until server_ready; do
			retries=$((retries + 1))
			if [ "$retries" -ge "$MAX_RETRIES" ]; then
				echo "[lmstudio] ERROR: timed out waiting for LM Studio server"
				echo ""
				echo "  To start LM Studio manually:"
				echo "    1. Open LM Studio application"
				echo "    2. Go to the Developer tab"
				echo "    3. Click 'Start Server' (or run: lms server start --port ${LMS_PORT} --cors)"
				echo ""
				exit 1
			fi
			sleep "$SLEEP_SECONDS"
		done
	else
		echo ""
		echo "[lmstudio] ERROR: LM Studio is not running and 'lms' CLI not found."
		echo ""
		echo "  LM Studio is a native desktop application — no Docker container is needed."
		echo "  To set it up:"
		echo "    1. Download from https://lmstudio.ai"
		echo "    2. Open LM Studio → Developer tab → Start Server"
		echo "       (or run: lms server start --host 0.0.0.0 --port ${LMS_PORT} --cors)"
		echo ""
		echo "  Apps connect via: AI_LMSTUDIO_BASE_URL=${LMS_URL}"
		echo ""
		exit 1
	fi
fi

# ── Load model if lms CLI is available ───────────────────────────────────────
if command -v lms > /dev/null 2>&1; then
	if lms ps 2>/dev/null | grep -Fq "$MODEL"; then
		echo "[lmstudio] model already loaded: $MODEL"
	else
		echo "[lmstudio] loading model: $MODEL (identifier: $IDENTIFIER)"
		lms load "$MODEL" --identifier "$IDENTIFIER" || {
			echo "[lmstudio] WARNING: could not load model $MODEL"
			echo "  Load it manually in the LM Studio Developer tab."
		}
	fi

	echo "[lmstudio] loaded models:"
	lms ps 2>/dev/null || true
else
	echo "[lmstudio] 'lms' CLI not in PATH — skipping model load."
	echo "  Load a model manually in the LM Studio Developer tab."
fi

echo "[lmstudio] ready at ${LMS_URL}"
