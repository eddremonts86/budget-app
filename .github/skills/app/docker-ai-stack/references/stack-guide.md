# Docker AI Stack — Complete Stack Reference

## docker-compose.yml Services Summary

```yaml
# Full production container map
services:
  app:
    container_name: tanstack-template-app
    ports: ['3000:3000']
    depends_on: [db, ollama, llama-cpp, lmstudio, chromadb] # ← all must be healthy

  db:
    image: postgres:15-alpine
    container_name: tanstack-template-db
    ports: ['5433:5432'] # host:container (5433 to avoid conflicts)
    volumes: ['.docker_data/postgres:/var/lib/postgresql/data']
    environment:
      POSTGRES_DB: tanstack_template
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres

  llama-cpp:
    image: ghcr.io/ggml-org/llama.cpp:server
    container_name: tanstack-template-llama-cpp
    ports: ['8080:8080']
    volumes: ['.docker_data/llm-models/llama-cpp:/models']
    command: >
      --model /models/${LLAMA_CPP_MAIN_MODEL:-qwen3.5-2b-instruct-q4_k_m.gguf}
      --port 8080 --host 0.0.0.0
      --ctx-size ${LLAMA_CPP_CTX_SIZE:-4096}
      --n-predict -1 --flash-attn

  ollama:
    image: ollama/ollama:latest
    container_name: tanstack-template-ollama
    ports: ['11434:11434']
    volumes: ['.docker_data/llm-models/ollama:/root/.ollama']

  lmstudio:
    image: lmstudio/llmster-preview:cpu
    container_name: tanstack-template-lmstudio
    ports: ['1234:1234']
    volumes: ['.docker_data/llm-models/lmstudio:/root/.cache/lm-studio']

  chromadb:
    image: chromadb/chroma:latest
    container_name: tanstack-template-chromadb
    ports: ['8000:8000']
    volumes: ['.docker_data/chroma:/chroma/chroma']
```

---

## Volume Layout

```
.docker_data/                        ← gitignored, persists across rebuilds
├── llm-models/
│   ├── llama-cpp/                   ← mount: /models inside container
│   │   └── qwen3.5-2b-instruct-q4_k_m.gguf   ← default model
│   ├── ollama/                      ← ollama cache
│   └── lmstudio/                    ← lm-studio model cache
├── postgres/                        ← PostgreSQL data directory
└── chroma/                          ← ChromaDB vector store
```

**Critical**: Never `rm -rf .docker_data/llm-models/` — models are large (1-10GB) and slow to redownload.

---

## Bootstrap Scripts

```bash
# Bootstrap all local providers (download default models)
bash scripts/ai/bootstrap.sh

# Bootstrap individual providers
bash scripts/ai/bootstrap-llama-cpp.sh
bash scripts/ai/bootstrap-ollama.sh
bash scripts/ai/bootstrap-lmstudio.sh

# Ensure runtime is ready before running app
bash scripts/ai/ensure-runtime.sh

# Health smoke test (checks all provider health endpoints)
bash scripts/ai/smoke.sh

# Chat smoke test (sends a test message)
bash scripts/ai/smoke-chat.sh
```

---

## Provider URL Mapping (inside Docker network)

In `.env.docker`, service names replace `localhost`:

```bash
# .env.docker (Docker internal network)
DATABASE_URL=postgresql://postgres:postgres@db:5432/tanstack_template
VITE_AI_LLAMA_CPP_URL=http://llama-cpp:8080
VITE_AI_OLLAMA_URL=http://ollama:11434
VITE_AI_LMSTUDIO_URL=http://lmstudio:1234
CHROMADB_URL=http://chromadb:8000

# .env.development (local dev, outside Docker)
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/tanstack_template
VITE_AI_LLAMA_CPP_URL=http://localhost:8080
VITE_AI_OLLAMA_URL=http://localhost:11434
VITE_AI_LMSTUDIO_URL=http://localhost:1234
```

---

## Common Operations

```bash
# ---- Starting ----
# Full stack (app + DB + all AI)
docker compose up -d

# Infrastructure only (no app container)
docker compose up -d db ollama llama-cpp lmstudio chromadb

# App + DB only (development mode — run app with pnpm dev:server)
docker compose up -d db

# ---- Stopping ----
docker compose down              # stop, keep volumes
docker compose down -v           # ⚠️ stop + DELETE all volumes

# ---- Restarting a single service ----
docker compose restart llama-cpp
docker compose restart ollama

# ---- Viewing logs ----
docker compose logs -f llama-cpp
docker compose logs -f ollama
docker compose logs --tail=50 db

# ---- Status ----
docker compose ps
docker compose top
```

---

## Ollama Model Management

```bash
# List available models
docker exec -it tanstack-template-ollama ollama list

# Pull a new model
docker exec -it tanstack-template-ollama ollama pull llama3.2
docker exec -it tanstack-template-ollama ollama pull qwen2.5:1.5b

# Remove a model
docker exec -it tanstack-template-ollama ollama rm llama3.2

# Current running model info
curl http://localhost:11434/api/ps
```

---

## Health Check Endpoints

```bash
# Llama.cpp
curl http://localhost:8080/health
# → {"status":"ok"}

# Llama.cpp models
curl http://localhost:8080/v1/models | jq '.data[].id'

# Ollama
curl http://localhost:11434/api/tags | jq '.models[].name'

# LM Studio
curl http://localhost:1234/v1/models | jq '.data[].id'

# ChromaDB
curl http://localhost:8000/api/v1/heartbeat
# → {"nanosecond heartbeat": <timestamp>}
```

---

## Provider Switching (CLI)

```bash
# Switch active AI provider (updates config-store)
pnpm tsx scripts/ai/switch-provider.ts ollama
pnpm tsx scripts/ai/switch-provider.ts llama-cpp
pnpm tsx scripts/ai/switch-provider.ts openai
pnpm tsx scripts/ai/switch-provider.ts anthropic

# Run integration tests against all providers
pnpm tsx scripts/ai/test-integration.ts
```

---

## Troubleshooting Matrix

| Symptom                       | Likely Cause                         | Fix                                                            |
| ----------------------------- | ------------------------------------ | -------------------------------------------------------------- |
| `llama-cpp` exits immediately | No `.gguf` model in `/models`        | Run `bash scripts/ai/bootstrap-llama-cpp.sh`                   |
| Port 8080 already in use      | Another process bound to port        | `lsof -i :8080 \| grep LISTEN` → kill PID                      |
| `app` container won't start   | AI service unhealthy                 | `docker compose logs llama-cpp` → fix AI, then restart app     |
| Ollama returns 404 on models  | Model not pulled yet                 | `docker exec -it tanstack-template-ollama ollama pull <model>` |
| ChromaDB connection refused   | ChromaDB not started                 | `docker compose up -d chromadb`                                |
| DB migrations fail on start   | DB not yet ready                     | Wait 5s, check `docker compose ps db` → then migrate           |
| "model too slow" / timeout    | Model too large for available RAM    | Use smaller model or lower `LLAMA_CPP_CTX_SIZE`                |
| LM Studio offline             | No model loaded in LM Studio UI      | Load a model in LM Studio → restart service                    |
| `ECONNREFUSED localhost:8080` | Running outside Docker, no llama-cpp | Start: `docker compose up -d llama-cpp`                        |

---

## System Requirements

| Profile     | RAM   | Recommended Model                  |
| ----------- | ----- | ---------------------------------- |
| Minimal     | 4 GB  | `qwen3.5-0.8b-instruct-q8_0.gguf`  |
| Standard    | 8 GB  | `qwen3.5-2b-instruct-q4_k_m.gguf`  |
| Comfortable | 16 GB | `llama3.2-3b-instruct-q4_k_m.gguf` |
| Power       | 32 GB | `llama3.1-8b-instruct-q5_k_m.gguf` |

---

## Data Reset Procedures

```bash
# Reset only PostgreSQL (keep AI models — fast)
docker compose stop db
rm -rf .docker_data/postgres
docker compose up -d db
sleep 5
pnpm drizzle-kit migrate
pnpm tsx scripts/db/seed-complex.ts

# Reset only AI models (re-download required — slow)
docker compose stop llama-cpp ollama lmstudio
rm -rf .docker_data/llm-models
docker compose up -d llama-cpp ollama lmstudio
bash scripts/ai/bootstrap.sh

# Full reset (nuclear option) ⚠️
docker compose down
rm -rf .docker_data
docker compose up -d
bash scripts/ai/bootstrap.sh
pnpm drizzle-kit migrate
pnpm tsx scripts/db/seed-complex.ts
```

---

## Speculative Decoding (Llama.cpp Advanced)

```bash
# Enable speculative decoding (2-4x speedup on supported models)
LLAMA_CPP_ENABLE_DRAFT=1                        # enable
LLAMA_CPP_MAIN_MODEL=/models/main-model.gguf    # main model
LLAMA_CPP_DRAFT_MODEL=/models/draft-0.8b.gguf  # draft model (same architecture, smaller)
LLAMA_CPP_DRAFT_MAX=16                          # max draft tokens
LLAMA_CPP_DRAFT_MIN=4                           # min draft tokens

# Default pairing (Qwen3.5 main + draft)
# main:  qwen3.5-2b-instruct-q4_k_m.gguf
# draft: qwen3.5-0.8b-instruct-q8_0.gguf
```
