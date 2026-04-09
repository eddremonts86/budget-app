---
name: ai-providers
description: Sistema multi-proveedor de IA en TanStack Template. Usar cuando se trabaje con el módulo src/modules/ai/*, se agreguen o modifiquen proveedores (llama-cpp, ollama, lm-studio, openai, anthropic), se configuren endpoints de chat/search/models, se implemente streaming, se gestione el config-store, el sistema de audit, o se integre RAG y prompts. También aplica para la UI de Settings de AI.
---

# AI Providers Skill

## Provider Architecture Overview

```
src/modules/ai/
├── config/          ← schemas, defaults, env resolution, config store
├── providers/       ← registry + per-provider adapter/probe/models
│   ├── anthropic/   ← {adapter, config, models, probe, types, index}.ts
│   ├── llama-cpp/
│   ├── lmstudio/
│   ├── ollama/
│   ├── openai/
│   ├── registry.ts  ← registerProvider(), buildAdapter()
│   ├── probe.ts     ← probeProvider(), listProviderStatuses()
│   ├── headers.ts   ← getProviderHeaders() — Bearer vs x-api-key
│   └── model-discovery.ts
├── server/          ← server-side orchestration (route handlers consume these)
│   ├── provider-resolution.ts  ← resolveEffectiveProvider()
│   ├── provider-runtime.ts     ← resolves provider + adapter + model in one call
│   ├── chat-execution.ts       ← final @tanstack/ai execution + streaming
│   ├── chat-messages.ts        ← message normalization + context injection
│   └── model-discovery.ts      ← config-based model discovery
├── prompts/
│   └── chat.ts      ← buildChatSystemPrompt(locale) — language-aware system prompt
├── rag/             ← retrieval, embeddings, context injection, sync
├── storage/         ← client-side chat persistence
└── audit/           ← logAudit() → src/modules/ai/data/audit-logs.json
```

## 5 Supported Providers

| ID          | Type   | Auth                            | Base URL                    |
| ----------- | ------ | ------------------------------- | --------------------------- |
| `llama-cpp` | Local  | None                            | `http://localhost:8080`     |
| `ollama`    | Local  | None                            | `http://localhost:11434`    |
| `lm-studio` | Local  | Optional Bearer                 | `http://localhost:1234`     |
| `openai`    | Remote | Bearer `OPENAI_API_KEY`         | `https://api.openai.com`    |
| `anthropic` | Remote | `x-api-key` `ANTHROPIC_API_KEY` | `https://api.anthropic.com` |

## Config Resolution Order

```
ia-config/*.js (base)
  → env vars (VITE_AI_* / AI_*)
    → user session store (/api/ai/config-store)
      → active provider config used at runtime
```

## API Routes

| Route                     | Method   | Purpose                             |
| ------------------------- | -------- | ----------------------------------- |
| `/api/ai/chat`            | POST     | Chat completions + streaming        |
| `/api/ai/search`          | POST     | AI-assisted search                  |
| `/api/ai/models`          | GET      | Model discovery for active provider |
| `/api/ai/status`          | GET      | All provider health statuses        |
| `/api/ai/test-connection` | POST     | Probe a specific provider           |
| `/api/ai/config-store`    | GET/POST | Read/write active provider config   |
| `/api/ai/audit`           | GET/POST | Audit log access                    |

## Adding a New Provider

1. **Create provider folder**: `src/modules/ai/providers/<name>/`

```ts
// providers/<name>/types.ts
export const PROVIDER_ID = '<name>' as const
export const PROVIDER_LABEL = 'My Provider'
export const PROVIDER_DEFAULT_BASE_URL = 'http://localhost:9999'
export const PROVIDER_DEFAULT_CHAT_ENDPOINT = '/v1/chat/completions'
```

```ts
// providers/<name>/adapter.ts
import { OpenaiChat } from '@tanstack/ai' // or AnthropicChat for Anthropic-style
import type { AiProviderConfig } from '../config'
import { getProviderHeaders } from '../headers'

export function buildMyProviderAdapter(config: AiProviderConfig) {
  return new OpenaiChat({
    endpoint: `${config.baseUrl}${config.chatEndpoint}`,
    headers: getProviderHeaders(config),
    model: config.model ?? 'default-model',
  })
}
```

```ts
// providers/<name>/probe.ts
export async function probeMyProvider(config: AiProviderConfig): Promise<boolean> {
  try {
    const resp = await fetch(`${config.baseUrl}/v1/models`, {
      headers: getProviderHeaders(config),
      signal: AbortSignal.timeout(5000),
    })
    return resp.ok
  } catch {
    return false
  }
}
```

```ts
// providers/<name>/models.ts
export async function discoverMyProviderModels(config: AiProviderConfig): Promise<string[]> {
  const resp = await fetch(`${config.baseUrl}/v1/models`, { headers: getProviderHeaders(config) })
  const data = await resp.json()
  return parseStandardModels(data) // from providers/model-discovery.ts
}
```

```ts
// providers/<name>/index.ts
export { buildMyProviderAdapter } from './adapter'
export { probeMyProvider } from './probe'
export { discoverMyProviderModels } from './models'
export { PROVIDER_ID, PROVIDER_LABEL } from './types'
```

2. **Register in `providers/registry.ts`**:

```ts
import { buildMyProviderAdapter, probeMyProvider } from './<name>'

registerProvider({
  id: '<name>',
  label: PROVIDER_LABEL,
  buildAdapter: buildMyProviderAdapter,
  probe: probeMyProvider,
  discoverModels: discoverMyProviderModels,
})
```

3. **Add to `ia-config/<name>-config.js`** with defaults

4. **Update `AiProviderId` enum in config/types** to include new ID

## Streaming Chat Response

The route handler at `/api/ai/chat` uses `chat-execution.ts`:

```ts
// Consumed by src/routes/api.ai.chat.tsx
import { executeChat } from '@/modules/ai/server/chat-execution'

const stream = await executeChat({
  messages: normalizedMessages,
  systemPrompt: buildChatSystemPrompt(locale),
  config: activeConfig,
})

return new Response(stream, {
  headers: { 'Content-Type': 'text/event-stream' },
})
```

## Language-Aware System Prompt

```ts
// src/modules/ai/prompts/chat.ts
export function buildChatSystemPrompt(locale: string): string {
  return `You are a helpful AI assistant.
RULES:
1. LANGUAGE: Always respond in the user's language. Detected locale: ${locale}
2. Answer directly and concisely.
3. If dashboard context is provided, use it accurately.`
}
```

The locale is passed as `?locale=xx-XX` query param from the client (`navigator.language`).

## Config Store (Settings UI)

```ts
// Reading active config (client-side)
import { useAiConfig, useUpdateAiConfig } from '@/modules/settings'

// Writing config (server-side route)
// POST /api/ai/config-store  { activeProvider: 'ollama', providers: {...} }
```

## Audit Logging

```ts
import { logAudit } from '@/modules/ai/audit'

await logAudit({
  timestamp: new Date().toISOString(),
  userLocale: locale,
  intent: 'chat',
  provider: activeProvider,
  model: usedModel,
  responseMetadata: { tokensUsed: 0 },
})
```

## RAG Integration

```ts
import { injectRagContext } from '@/modules/ai/rag'

// Before sending to provider, inject relevant documents
const contextualizedMessages = await injectRagContext(messages, userQuery)
```

## Environment Variables

```bash
# Local providers (no key needed)
VITE_AI_LLAMA_CPP_URL=http://localhost:8080
VITE_AI_OLLAMA_URL=http://localhost:11434
VITE_AI_LMSTUDIO_URL=http://localhost:1234

# Remote providers (keys required)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Active provider (overrides config-store)
VITE_AI_ACTIVE_PROVIDER=ollama
```

## Common Errors

| Code               | Meaning                      | Fix                                  |
| ------------------ | ---------------------------- | ------------------------------------ |
| `CONFIG_INVALID`   | Missing base URL or endpoint | Check `/api/ai/config-store`         |
| `NO_PROVIDER`      | No provider reachable        | Start local runtime or check API key |
| `UNKNOWN_PROVIDER` | Provider ID not in registry  | Register provider in `registry.ts`   |

## Read References

- `references/provider-examples.md` — complete provider implementation examples
- `src/modules/ai/providers/ollama/` — canonical reference implementation
