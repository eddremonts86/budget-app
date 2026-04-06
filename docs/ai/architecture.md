# AI Connection Architecture

This document describes the current AI runtime architecture after the consolidation into `src/ai`.

## Overview

The application supports five providers:

- **Llama.cpp**: local OpenAI-compatible runtime.
- **Ollama**: local runtime with model discovery via `/api/tags` and `/api/ps`.
- **LM Studio**: local OpenAI-compatible runtime.
- **OpenAI**: hosted API with bearer-token auth.
- **Anthropic**: hosted API with `x-api-key` auth.

## Domain Layout

The AI domain is now centered in `src/ai`:

- `src/modules/ai/config`: schemas, defaults, environment resolution, persisted config store, validation.
- `src/modules/ai/providers`: registry, headers, discovery, probing and per-provider implementations.
- `src/modules/ai/rag`: retrieval, embeddings, context injection and sync.
- `src/modules/ai/prompts`: shared prompt construction for chat and search flows.
- `src/modules/ai/storage`: client-side chat persistence.
- `src/modules/ai/audit`: AI audit logging.
- `src/modules/ai/server`: shared server-side helpers for provider resolution, model selection, model discovery, message normalization, contextual injection, HTTP responses and streaming orchestration.

## Provider Structure

Each provider lives in its own folder under `src/modules/ai/providers` and is split into:

- `adapter.ts`: adapter construction for `@tanstack/ai`.
- `config.ts`: provider defaults entrypoint.
- `models.ts`: provider-specific model discovery.
- `probe.ts`: health and availability probing.
- `types.ts`: provider constants and labels.
- `index.ts`: local barrel.

This structure is implemented for `anthropic`, `lmstudio`, `llama-cpp`, `ollama` and `openai`.

## Configuration Store

The configuration source of truth lives in `src/modules/ai/config`.

- `getActiveAiConfig()` and `getAllAiConfigs()` are exported from `src/modules/ai/config/store.ts`.
- `readAiConfig()` and `writeAiConfig()` are exported from `src/modules/ai/config/file-store.ts`.
- `validateAiConfig()` enforces required base URL, chat endpoint and provider-specific credentials.

The Settings UI remains a consumer of this domain, but no longer owns the core schemas.

## Public API

The top-level barrel in `src/modules/ai/index.ts` now exposes the domain with direct exports for config, providers, rag, storage, audit and server helpers.
Namespace aliases such as `aiConfig` and `aiProviders` are still available for compatibility.

## Server-Side Flow

The HTTP layer remains in the route handlers under `src/routes/api.ai.*`, but it now consumes the centralized domain:

- `/api/ai/chat`: chat completions and contextual injection.
- `/api/ai/search`: AI-assisted search responses.
- `/api/ai/models`: model discovery for the selected provider.
- `/api/ai/status`: provider health/status listing.
- `/api/ai/test-connection`: probe for a specific provider config.
- `/api/ai/config-store`: persisted configuration read/write.

To reduce route-level duplication, provider fallback and model resolution helpers now live in `src/modules/ai/server/provider-resolution.ts` and `src/modules/ai/server/provider-models.ts`.
`src/modules/ai/server/provider-runtime.ts` now resolves the effective provider, adapter registry entry and model in one place.
`src/modules/ai/server/chat-execution.ts` centralizes the final `@tanstack/ai` execution for routes that stream assistant responses.
`src/modules/ai/server/model-discovery.ts` centralizes config-based model discovery used by `/api/ai/models`.
Prompt construction now lives in `src/modules/ai/prompts`, while chat message normalization, contextual injection, provider-specific streaming adapters and shared JSON response helpers live in `src/modules/ai/server`.

## Integration in Features

### Help Chat (`/dashboard/help`)

The Help Chat UI consumes storage and configuration from `src/ai` while calling `/api/ai/chat`.

### Global Search

The sidebar search consumes `/api/ai/search`, which resolves the active provider through the centralized AI domain.

## Legacy References

The runtime code now imports the AI domain directly from `src/ai`.
All AI documentation is consolidated in this `docs/ai/` folder.

## Error Handling

The API returns structured error codes such as:

- `CONFIG_INVALID`: active provider configuration is incomplete.
- `NO_PROVIDER`: no provider could be resolved or reached.
- `UNKNOWN_PROVIDER`: configured provider id is not registered.
