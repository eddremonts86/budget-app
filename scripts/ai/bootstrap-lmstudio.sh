#!/usr/bin/env sh

set -eu

MODEL="${1:-${LMSTUDIO_MODEL:-llama-3.2-1b}}"
IDENTIFIER="${2:-${LMSTUDIO_IDENTIFIER:-lmstudio:compat}}"
DRAFT_MODEL="${3:-${LMSTUDIO_DRAFT_MODEL:-}}"
DRAFT_IDENTIFIER="${4:-${LMSTUDIO_DRAFT_IDENTIFIER:-}}"
MAIN_CANDIDATES="${LMSTUDIO_MAIN_CANDIDATES:-$MODEL,llama-3.2-1b,llama-3.2-3b,qwen3.5-2b,qwen3.5-4b}"
DRAFT_CANDIDATES="${LMSTUDIO_DRAFT_CANDIDATES:-$DRAFT_MODEL,qwen3.5-0.8b}"
COMPAT_FALLBACK_CANDIDATES="${LMSTUDIO_COMPAT_FALLBACK_CANDIDATES:-llama-3.2-1b,llama-3.2-3b}"
MAX_RETRIES="${LMSTUDIO_HEALTH_RETRIES:-60}"
SLEEP_SECONDS="${LMSTUDIO_HEALTH_SLEEP_SECONDS:-2}"

is_supported_main() {
	value="$1"
	lower_value="$(printf '%s' "$value" | tr '[:upper:]' '[:lower:]')"

	case "$lower_value" in
		*qwen3.5*2b*|*qwen3.5*4b*|*llama-3.2*1b*|*llama-3.2*3b*)
			return 0
			;;
		*)
			return 1
			;;
	esac
}

is_supported_draft() {
	value="$1"
	lower_value="$(printf '%s' "$value" | tr '[:upper:]' '[:lower:]')"

	case "$lower_value" in
		*qwen3.5*0.8b*)
			return 0
			;;
		*)
			return 1
			;;
	esac
}

download_first_available() {
	candidates_csv="$1"
	mode="$2"
	downloaded_model=""

	OLD_IFS="$IFS"
	IFS=','
	for candidate in $candidates_csv; do
		IFS="$OLD_IFS"
		candidate_trimmed="$(printf '%s' "$candidate" | sed 's/^ *//; s/ *$//')"
		[ -n "$candidate_trimmed" ] || continue

		if [ "$mode" = "main" ] && ! is_supported_main "$candidate_trimmed"; then
			echo "[lmstudio] skipping unsupported main candidate: $candidate_trimmed" >&2
			continue
		fi

		if [ "$mode" = "draft" ] && ! is_supported_draft "$candidate_trimmed"; then
			echo "[lmstudio] skipping unsupported draft candidate: $candidate_trimmed" >&2
			continue
		fi

		if docker compose exec -T lmstudio lms ls | grep -Fq "$candidate_trimmed"; then
			echo "[lmstudio] $mode model already downloaded: $candidate_trimmed" >&2
			downloaded_model="$candidate_trimmed"
			break
		fi

		echo "[lmstudio] trying to download $mode model: $candidate_trimmed" >&2
		if printf '%s' "$candidate_trimmed" | grep -q '/'; then
			if docker compose exec -T lmstudio lms get "$candidate_trimmed" --yes; then
				downloaded_model="$candidate_trimmed"
				break
			fi
		elif docker compose exec -T lmstudio lms get "$candidate_trimmed" --gguf --yes; then
			downloaded_model="$candidate_trimmed"
			break
		fi

		echo "[lmstudio] candidate failed: $candidate_trimmed" >&2
		IFS=','
	done
	IFS="$OLD_IFS"

	if [ -z "$downloaded_model" ]; then
		return 1
	fi

	printf '%s\n' "$downloaded_model"
}

echo "[lmstudio] ensuring container is running..."
docker compose up -d lmstudio

echo "[lmstudio] waiting for healthy status..."
retries=0
while ! docker compose ps lmstudio | grep -q "healthy"; do
	retries=$((retries + 1))

	if [ "$retries" -ge "$MAX_RETRIES" ]; then
		echo "[lmstudio] timed out waiting for healthy status"
		docker compose ps
		exit 1
	fi

	sleep "$SLEEP_SECONDS"
done

echo "[lmstudio] container is healthy"

echo "[lmstudio] enforcing server-side CORS"
docker compose exec -T lmstudio lms server stop || true
docker compose exec -T lmstudio lms server start --port 1234 --cors

if ! is_supported_main "$MODEL"; then
	echo "[lmstudio] unsupported LMSTUDIO_MODEL: $MODEL"
	exit 1
fi

MAIN_MODEL_RESOLVED="$(download_first_available "$MAIN_CANDIDATES" "main")" || {
	echo "[lmstudio] failed to download/find a supported main model."
	exit 1
}
MODEL="$MAIN_MODEL_RESOLVED"

if docker compose exec -T lmstudio lms ps | grep -Fq "$IDENTIFIER"; then
	echo "[lmstudio] main model already loaded with identifier: $IDENTIFIER"
else
	echo "[lmstudio] loading main model with identifier: $IDENTIFIER"
	if ! docker compose exec -T lmstudio lms load "$MODEL" --identifier "$IDENTIFIER"; then
		echo "[lmstudio] load with identifier failed, retrying without identifier"
		if ! docker compose exec -T lmstudio lms load "$MODEL"; then
			echo "[lmstudio] main model failed to load, trying compatibility fallback candidates"
			FALLBACK_MODEL_RESOLVED="$(download_first_available "$COMPAT_FALLBACK_CANDIDATES" "main")" || {
				echo "[lmstudio] no compatible fallback model could be downloaded"
				exit 1
			}
			MODEL="$FALLBACK_MODEL_RESOLVED"
			docker compose exec -T lmstudio lms load "$MODEL" --identifier "$IDENTIFIER"
		fi
	fi
fi

if [ -z "$DRAFT_MODEL" ]; then
	echo "[lmstudio] draft model disabled"
	DRAFT_MODEL=""
elif ! is_supported_draft "$DRAFT_MODEL"; then
	echo "[lmstudio] unsupported LMSTUDIO_DRAFT_MODEL: $DRAFT_MODEL (skipping draft)"
	DRAFT_MODEL=""
fi

if [ -n "$DRAFT_MODEL" ]; then
	if DRAFT_MODEL_RESOLVED="$(download_first_available "$DRAFT_CANDIDATES" "draft")"; then
		DRAFT_MODEL="$DRAFT_MODEL_RESOLVED"
	else
		echo "[lmstudio] draft model unavailable; continuing without draft loaded"
		DRAFT_MODEL=""
	fi
fi

if [ -n "$DRAFT_MODEL" ] && [ -n "$DRAFT_IDENTIFIER" ]; then
	if docker compose exec -T lmstudio lms ps | grep -Fq "$DRAFT_IDENTIFIER"; then
		echo "[lmstudio] draft model already loaded with identifier: $DRAFT_IDENTIFIER"
	else
		echo "[lmstudio] loading draft model with identifier: $DRAFT_IDENTIFIER"
		docker compose exec -T lmstudio lms load "$DRAFT_MODEL" --identifier "$DRAFT_IDENTIFIER" || true
	fi
fi

echo "[lmstudio] loaded models:"
docker compose exec -T lmstudio lms ps || true

echo "[lmstudio] ready at http://localhost:1234/v1"