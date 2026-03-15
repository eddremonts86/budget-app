#!/usr/bin/env sh

set -eu

MODEL="${1:-${OLLAMA_MODEL:-qwen3.5:2b}}"
DRAFT_MODEL="${2:-${OLLAMA_DRAFT_MODEL:-qwen3.5:0.8b}}"
MAIN_CANDIDATES="${OLLAMA_MAIN_CANDIDATES:-$MODEL,qwen3.5:2b,qwen3.5:4b}"
MAX_RETRIES="${OLLAMA_HEALTH_RETRIES:-60}"
SLEEP_SECONDS="${OLLAMA_HEALTH_SLEEP_SECONDS:-2}"

pull_first_available() {
	candidates_csv="$1"
	resolved_model=""

	OLD_IFS="$IFS"
	IFS=','
	for candidate in $candidates_csv; do
		IFS="$OLD_IFS"
		candidate_trimmed="$(printf '%s' "$candidate" | sed 's/^ *//; s/ *$//')"
		[ -n "$candidate_trimmed" ] || continue

		if docker compose exec -T ollama ollama list | grep -Fq "$candidate_trimmed"; then
			echo "[ollama] main model already exists: $candidate_trimmed"
			resolved_model="$candidate_trimmed"
			break
		fi

		echo "[ollama] trying to download main model: $candidate_trimmed"
		if docker compose exec -T ollama ollama pull "$candidate_trimmed"; then
			resolved_model="$candidate_trimmed"
			break
		fi

		echo "[ollama] candidate failed: $candidate_trimmed"
		IFS=','
	done
	IFS="$OLD_IFS"

	if [ -z "$resolved_model" ]; then
		return 1
	fi

	printf '%s\n' "$resolved_model"
}

echo "[ollama] ensuring container is running..."
docker compose up -d ollama

echo "[ollama] waiting for healthy status..."
retries=0
while ! docker compose ps ollama | grep -q "healthy"; do
	retries=$((retries + 1))

	if [ "$retries" -ge "$MAX_RETRIES" ]; then
		echo "[ollama] timed out waiting for healthy status"
		docker compose ps
		exit 1
	fi

	sleep "$SLEEP_SECONDS"
done

echo "[ollama] container is healthy"

echo "[ollama] resolving main model from candidates: $MAIN_CANDIDATES"
MODEL="$(pull_first_available "$MAIN_CANDIDATES")" || {
	echo "[ollama] failed to resolve a main model (2B/4B)"
	exit 1
}

echo "[ollama] pulling draft model: $DRAFT_MODEL"
if docker compose exec -T ollama ollama list | grep -q "$DRAFT_MODEL"; then
	echo "[ollama] draft model already exists: $DRAFT_MODEL"
else
	echo "[ollama] downloading draft model $DRAFT_MODEL..."
	docker compose exec -T ollama ollama pull "$DRAFT_MODEL"
fi

echo "[ollama] ready at http://localhost:11434"