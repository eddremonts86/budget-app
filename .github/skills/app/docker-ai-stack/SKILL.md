---
name: docker-ai-stack
description: Stack Docker con AI local en TanStack Template. Usar cuando se trabaje con docker-compose.yml, se configuren proveedores locales de IA (llama-cpp, Ollama, LM Studio), se levante el stack completo de desarrollo, se gestionen modelos GGUF, se configure ChromaDB para RAG, o se solucionan problemas de conectividad entre servicios. También aplica para scripts de bootstrap y migración de modelos.
---

# Docker AI Stack Skill

## Services Overview

| Service    | Container                     | Port      | Image                             |
| ---------- | ----------------------------- | --------- | --------------------------------- |
| App        | `tanstack-template-app`       | 3000      | Local build                       |
| PostgreSQL | `tanstack-template-db`        | 5433→5432 | postgres:15-alpine                |
| Llama.cpp  | `tanstack-template-llama-cpp` | 8080      | ghcr.io/ggml-org/llama.cpp:server |
| Ollama     | `tanstack-template-ollama`    | 11434     | ollama/ollama:latest              |
| LM Studio  | `tanstack-template-lmstudio`  | 1234      | lmstudio/llmster-preview:cpu      |
| ChromaDB   | `tanstack-template-chromadb`  | 8000      | chromadb/chroma:latest            |

## Model Storage (Shared Volume)

All local AI models persist under `.docker_data/llm-models/`:

```
.docker_data/
├── llm-models/
│   ├── llama-cpp/    ← GGUF models (e.g. qwen3.5-2b-instruct-q4_k_m.gguf)
│   ├── ollama/       ← Ollama model cache
│   └── lmstudio/     ← LM Studio model cache
├── postgres/         ← PostgreSQL data
└── chroma/           ← ChromaDB vector store
```

**Never delete `.docker_data/llm-models/` unless intentionally clearing all models.**

## Quick Start Commands

```bash
# Full stack (app + db + all AI providers)
pnpm docker:up:full

# Only infrastructure (db + AI providers, no app)
docker compose up -d db ollama llama-cpp chromadb

# App + DB only (no AI)
docker compose up -d app db

# Stop all
docker compose down

# Stop + remove volumes (⚠️ destroys DB and models)
docker compose down -v
```

## Llama.cpp Configuration

Default model: `qwen3.5-2b-instruct-q4_k_m.gguf`  
Draft model: `qwen3.5-0.8b-instruct-q8_0.gguf`

Override via env vars:

```bash
LLAMA_CPP_MAIN_MODEL=/models/my-model.gguf
LLAMA_CPP_DRAFT_MODEL=/models/draft.gguf
LLAMA_CPP_CTX_SIZE=8192      # Context window (default: 4096)
LLAMA_CPP_ENABLE_DRAFT=1     # Speculative decoding (default: enabled)
LLAMA_CPP_DRAFT_MAX=16
LLAMA_CPP_DRAFT_MIN=4
```

**Adding a new GGUF model:**

1. Place `.gguf` file in `.docker_data/llm-models/llama-cpp/`
2. Set `LLAMA_CPP_MAIN_MODEL=/models/your-model.gguf` in `.env.docker`
3. Restart: `docker compose restart llama-cpp`

## Ollama Model Management

```bash
# Pull a model
docker exec -it tanstack-template-ollama ollama pull llama3.2

# List available models
docker exec -it tanstack-template-ollama ollama list

# Remove a model
docker exec -it tanstack-template-ollama ollama rm llama3.2

# Run interactive chat (debug)
docker exec -it tanstack-template-ollama ollama run llama3.2
```

## Bootstrap Scripts

```bash
# Bootstrap all local AI providers (downloads models)
bash scripts/ai/bootstrap.sh

# Individual providers
bash scripts/ai/bootstrap-ollama.sh
bash scripts/ai/bootstrap-llama-cpp.sh
bash scripts/ai/bootstrap-lmstudio.sh

# Ensure runtime is ready before running app
bash scripts/ai/ensure-runtime.sh

# Quick health check
bash scripts/ai/smoke.sh
bash scripts/ai/smoke-chat.sh

# Switch active provider via CLI
pnpm tsx scripts/ai/switch-provider.ts ollama
pnpm tsx scripts/ai/switch-provider.ts llama-cpp

# Test all AI integrations
pnpm tsx scripts/ai/test-integration.ts
```

## Provider Health Check URLs

```bash
# Llama.cpp
curl http://localhost:8080/health
curl http://localhost:8080/v1/models

# Ollama
curl http://localhost:11434/api/tags
curl http://localhost:11434/api/ps

# LM Studio
curl http://localhost:1234/v1/models

# ChromaDB
curl http://localhost:8000/api/v1/heartbeat
```

## App AI Settings UI

1. Navigate to **Settings > AI**
2. Select active provider
3. Check connection status (green = healthy)
4. Optionally switch model from discovered list

## Service Dependencies

The `app` service depends on: `lmstudio`, `chromadb`, `ollama`, `llama-cpp` (all healthy).
If any AI service fails to start, the app won't start.

**For app-only dev (no AI):**

```bash
# Run just DB + app, bypass AI service health checks
docker compose up -d db
pnpm dev:server   # runs outside docker
```

## Troubleshooting

| Problem                      | Cause                       | Fix                                                             |
| ---------------------------- | --------------------------- | --------------------------------------------------------------- |
| `llama-cpp` exits on start   | No `.gguf` in models folder | Download model to `.docker_data/llm-models/llama-cpp/`          |
| Port 8080/11434 already used | Another process running     | `lsof -i :8080` → kill process                                  |
| `app` won't start            | AI service unhealthy        | `docker compose logs llama-cpp` to diagnose                     |
| ChromaDB connection refused  | ChromaDB not started        | `docker compose up -d chromadb`                                 |
| DB migrations fail           | DB not ready                | Wait for postgres health check, then `pnpm drizzle-kit migrate` |
| Model too slow               | Insufficient RAM/CPU        | Use smaller model (1B, Q4) or adjust `LLAMA_CPP_CTX_SIZE`       |

## System Requirements

| Config      | RAM  | Model           |
| ----------- | ---- | --------------- |
| Minimal     | 4GB  | Qwen3.5-0.8B Q8 |
| Standard    | 8GB  | Qwen3.5-2B Q4   |
| Comfortable | 16GB | LLaMA 3.2 3B Q4 |

## Docker Volumes & Data Reset

```bash
# Reset only PostgreSQL (keep AI models)
docker compose stop db
rm -rf .docker_data/postgres
docker compose up -d db

# Reset only AI models (re-download required)
docker compose stop llama-cpp ollama lmstudio
rm -rf .docker_data/llm-models
docker compose up -d llama-cpp ollama lmstudio

# Full reset ⚠️
docker compose down
rm -rf .docker_data
docker compose up -d
bash scripts/ai/bootstrap.sh   # re-download models
```

## Environment Files

```
.env.development  ← loaded by app in dev
.env.docker       ← Docker-specific overrides (base URLs point to containers)
.env.production   ← production (never commit secrets)
```

Key Docker overrides in `.env.docker`:

```bash
DATABASE_URL=postgresql://postgres:postgres@db:5432/tanstack_template
VITE_AI_LLAMA_CPP_URL=http://llama-cpp:8080
VITE_AI_OLLAMA_URL=http://ollama:11434
VITE_AI_LMSTUDIO_URL=http://lmstudio:1234
```

---

## References

Load these files for real Docker configuration and bootstrap patterns:

- `references/stack-guide.md` — Full `docker-compose.yml` service map, bootstrap script flow (`scripts/ai/bootstrap.sh`), model storage layout (`.docker_data/`), llama-cpp server config, Ollama API patterns, LM Studio setup, ChromaDB RAG integration, reset commands, health check endpoints, `.env.docker` overrides
