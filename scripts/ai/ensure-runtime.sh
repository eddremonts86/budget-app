#!/usr/bin/env sh

set -eu

echo "[ai-ensure] checking docker daemon..."
if ! docker info >/dev/null 2>&1; then
	echo "[ai-ensure] docker daemon is not running. Start Docker Desktop first."
	exit 1
fi

echo "[ai-ensure] loading environment defaults..."
set -a
. ./.env.docker
set +a

echo "[ai-ensure] starting services..."
docker compose up -d db chromadb ollama lmstudio llama-cpp app

echo "[ai-ensure] ensuring Ollama models..."
sh scripts/ai/bootstrap-ollama.sh

echo "[ai-ensure] ensuring LM Studio compatible model is loaded..."
sh scripts/ai/bootstrap-lmstudio.sh

wait_http() {
	name="$1"
	url="$2"
	retries="${3:-30}"
	sleep_seconds="${4:-2}"

	i=0
	while [ "$i" -lt "$retries" ]; do
		if curl -fsS "$url" >/dev/null 2>&1; then
			echo "[ai-ensure] $name ready: $url"
			return 0
		fi
		i=$((i + 1))
		sleep "$sleep_seconds"
	done

	echo "[ai-ensure] timeout waiting for $name: $url"
	return 1
}

echo "[ai-ensure] waiting for endpoints..."
wait_http "app" "http://localhost:3000"
wait_http "llama-cpp" "http://localhost:8080/health"
wait_http "ollama" "http://localhost:11434/v1/models"
wait_http "lmstudio" "http://localhost:1234/v1/models"

json_first_model() {
	url="$1"
	node -e '
		const url = process.argv[1]
		fetch(url)
			.then((res) => res.json())
			.then((data) => {
				const first = data?.data?.[0]?.id || data?.models?.[0]?.model || data?.models?.[0]?.name || ""
				process.stdout.write(first)
			})
			.catch(() => process.stdout.write(""))
	' "$url"
}

OLLAMA_MODEL="$(json_first_model "http://localhost:11434/api/ps")"
if [ -z "$OLLAMA_MODEL" ]; then
	OLLAMA_MODEL="$(json_first_model "http://localhost:11434/api/tags")"
fi

LLAMA_CPP_MODEL="$(json_first_model "http://localhost:8080/v1/models")"
LMSTUDIO_MODEL="$(json_first_model "http://localhost:1234/v1/models")"

echo "[ai-ensure] quick chat smoke checks..."
if [ -n "$LLAMA_CPP_MODEL" ]; then
	curl --max-time 30 -fsS -X POST http://localhost:8080/v1/chat/completions \
		-H 'Content-Type: application/json' \
		-d "{\"model\":\"$LLAMA_CPP_MODEL\",\"messages\":[{\"role\":\"user\",\"content\":\"ok\"}],\"max_tokens\":8}" >/dev/null
fi

if [ -n "$OLLAMA_MODEL" ]; then
	curl --max-time 30 -fsS -X POST http://localhost:11434/api/chat \
		-H 'Content-Type: application/json' \
		-d "{\"model\":\"$OLLAMA_MODEL\",\"messages\":[{\"role\":\"user\",\"content\":\"ok\"}],\"think\":false,\"stream\":false}" >/dev/null
fi

if [ -n "$LMSTUDIO_MODEL" ]; then
	curl --max-time 30 -fsS -X POST http://localhost:1234/v1/chat/completions \
		-H 'Content-Type: application/json' \
		-d "{\"model\":\"$LMSTUDIO_MODEL\",\"messages\":[{\"role\":\"user\",\"content\":\"ok\"}],\"max_tokens\":8}" >/dev/null
fi

echo "[ai-ensure] all agents are ready and responding."