#!/usr/bin/env sh
set -eu

MODEL_DIR=".docker_data/llm-models/llama-cpp"
MAIN_MODEL_FILE="${LLAMA_CPP_MAIN_FILE:-qwen3.5-9b-instruct-q4_k_m.gguf}"
DRAFT_MODEL_FILE="${LLAMA_CPP_DRAFT_FILE:-qwen3.5-0.8b-instruct-q8_0.gguf}"
MAIN_MODEL_PATH="$MODEL_DIR/$MAIN_MODEL_FILE"
DRAFT_MODEL_PATH="$MODEL_DIR/$DRAFT_MODEL_FILE"

MAIN_MODEL_URL="${LLAMA_CPP_MAIN_URL:-https://huggingface.co/bartowski/Qwen3.5-9B-Instruct-GGUF/resolve/main/Qwen3.5-9B-Instruct-Q4_K_M.gguf}"
DRAFT_MODEL_URL="${LLAMA_CPP_DRAFT_URL:-https://huggingface.co/bartowski/Qwen3.5-0.8B-Instruct-GGUF/resolve/main/Qwen3.5-0.8B-Instruct-Q8_0.gguf}"
MAIN_MODEL_URL_FALLBACK="${LLAMA_CPP_MAIN_URL_FALLBACK:-https://huggingface.co/Qwen/Qwen3.5-9B-Instruct-GGUF/resolve/main/Qwen3.5-9B-Instruct-Q4_K_M.gguf}"
DRAFT_MODEL_URL_FALLBACK="${LLAMA_CPP_DRAFT_URL_FALLBACK:-https://huggingface.co/Qwen/Qwen3.5-0.8B-Instruct-GGUF/resolve/main/Qwen3.5-0.8B-Instruct-Q8_0.gguf}"
HF_TOKEN="${HUGGINGFACE_TOKEN:-${HF_TOKEN:-}}"

LEGACY_MODEL_FILE=".docker_data/models/llama-3.2-1b-instruct-q4_k_m.gguf"

download_file() {
	output="$1"
	url="$2"

	if command -v curl >/dev/null 2>&1; then
		auth_args=""
		if [ -n "$HF_TOKEN" ]; then
			auth_args="-H Authorization: Bearer $HF_TOKEN"
		fi
		# shellcheck disable=SC2086
		curl -L --fail --retry 3 $auth_args -o "$output" "$url"
	elif command -v wget >/dev/null 2>&1; then
		if [ -n "$HF_TOKEN" ]; then
			wget --header="Authorization: Bearer $HF_TOKEN" -O "$output" "$url"
		else
			wget -O "$output" "$url"
		fi
	else
		echo "[llama-cpp] Error: neither curl nor wget found."
		exit 1
	fi
}

try_download_with_fallbacks() {
	output="$1"
	label="$2"
	primary="$3"
	fallback="$4"

	if download_file "$output" "$primary"; then
		return 0
	fi

	echo "[llama-cpp] primary URL failed for $label, trying fallback..."
	if download_file "$output" "$fallback"; then
		return 0
	fi

	echo "[llama-cpp] failed to download $label from known URLs"
	return 1
}

verify_file_size() {
	filepath="$1"
	min_size="$2"
	label="$3"

	SIZE=$(wc -c < "$filepath" | tr -d ' ')
	if [ "$SIZE" -lt "$min_size" ]; then
		echo "[llama-cpp] Error: $label seems too small ($SIZE bytes)."
		rm -f "$filepath"
		exit 1
	fi
}

echo "[llama-cpp] Checking Qwen 3.5 models..."

if [ ! -d "$MODEL_DIR" ]; then
	mkdir -p "$MODEL_DIR"
fi

if [ ! -f "$MAIN_MODEL_PATH" ] && [ -f "$LEGACY_MODEL_FILE" ]; then
	echo "[llama-cpp] Migrating legacy model to new path..."
	mv "$LEGACY_MODEL_FILE" "$MAIN_MODEL_PATH"
fi

if [ ! -f "$MAIN_MODEL_PATH" ]; then
	echo "[llama-cpp] Main model not found. Downloading: $MAIN_MODEL_FILE"
	echo "[llama-cpp] URL: $MAIN_MODEL_URL"
	try_download_with_fallbacks "$MAIN_MODEL_PATH" "main model" "$MAIN_MODEL_URL" "$MAIN_MODEL_URL_FALLBACK"
else
	echo "[llama-cpp] Main model already exists: $MAIN_MODEL_FILE"
fi

if [ ! -f "$DRAFT_MODEL_PATH" ]; then
	echo "[llama-cpp] Draft model not found. Downloading: $DRAFT_MODEL_FILE"
	echo "[llama-cpp] URL: $DRAFT_MODEL_URL"
	try_download_with_fallbacks "$DRAFT_MODEL_PATH" "draft model" "$DRAFT_MODEL_URL" "$DRAFT_MODEL_URL_FALLBACK"
else
	echo "[llama-cpp] Draft model already exists: $DRAFT_MODEL_FILE"
fi

echo "[llama-cpp] Verifying model integrity..."
verify_file_size "$MAIN_MODEL_PATH" 500000000 "main model"
verify_file_size "$DRAFT_MODEL_PATH" 100000000 "draft model"

echo "[llama-cpp] Qwen 3.5 models are ready."