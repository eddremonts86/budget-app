# AI Providers — Deep Reference

## Canonical Implementation: Ollama (reference for all providers)

The Ollama provider in `src/modules/ai/providers/ollama/` is the reference implementation.
Copy its structure when creating a new local provider.

### types.ts

```ts
// providers/ollama/types.ts
export const OLLAMA_PROVIDER_ID = 'ollama' as const
export const OLLAMA_PROVIDER_LABEL = 'Ollama'
```

### adapter.ts

```ts
// providers/ollama/adapter.ts
import { createOpenaiChat } from '@tanstack/ai-openai'
import type { AiConfigFormData } from '@/modules/ai/config'
import { getProviderHeaders } from '../headers'
import { normalizeOpenAiCompatibleBaseUrl } from '../shared'
import type { ProviderRegistryItem } from '../types'
import { OLLAMA_PROVIDER_ID, OLLAMA_PROVIDER_LABEL } from './types'

function buildOllamaAdapter(
  config: AiConfigFormData,
): (model: string) => ReturnType<typeof createOpenaiChat> {
  const baseUrl = normalizeOpenAiCompatibleBaseUrl(config.baseUrl)

  return (model) =>
    createOpenaiChat(model as Parameters<typeof createOpenaiChat>[0], config.apiKey || 'ollama', {
      baseURL: baseUrl,
      defaultHeaders: getProviderHeaders(config),
    })
}

export const ollamaProvider: ProviderRegistryItem = {
  id: OLLAMA_PROVIDER_ID,
  label: OLLAMA_PROVIDER_LABEL,
  buildAdapter: buildOllamaAdapter,
}
```

### probe.ts

```ts
// providers/ollama/probe.ts
import type { AiConfigFormData } from '@/modules/ai/config'
import { probeProviderConfig } from '../shared'
import type { AiProviderStatus } from '../types'
import { discoverOllamaModels } from './models'
import { OLLAMA_PROVIDER_LABEL } from './types'

export async function probeOllamaProvider(config: AiConfigFormData): Promise<AiProviderStatus> {
  return await probeProviderConfig({
    config,
    label: OLLAMA_PROVIDER_LABEL,
    discoverModels: discoverOllamaModels,
  })
}
```

### models.ts

```ts
// providers/ollama/models.ts
import type { AiConfigFormData } from '@/modules/ai/config'
import { discoverOllamaProviderModels } from '../model-discovery'
import type { ProviderDiscoveryResult } from '../types'

export async function discoverOllamaModels(
  config: AiConfigFormData,
): Promise<ProviderDiscoveryResult> {
  return await discoverOllamaProviderModels(config)
}
```

### index.ts

```ts
// providers/ollama/index.ts
export * from './adapter'
export * from './config'
export * from './models'
export * from './probe'
export * from './types'
```

---

## ProviderRegistryItem Interface

```ts
// providers/types.ts — the contract every provider must satisfy

export interface ProviderRegistryItem {
  id: AiProviderId
  label: string
  buildAdapter: (config: AiConfigFormData) => (model: string) => AnyTextAdapter
}

export interface AiProviderStatus {
  id: AiProviderId
  label: string
  available: boolean
  status: 'available' | 'auth_required' | 'unreachable' | 'error'
  latencyMs: number
  message?: string
  modelCount?: number
  activeModelId?: string | null
  resolvedModelId?: string | null
}

export interface AiDiscoveredModel {
  id: string
  label: string
  active: boolean
}
```

---

## getProviderHeaders — Real Implementation

```ts
// providers/headers.ts
export function getProviderHeaders(config: AiConfigFormData): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const token = config.token || config.apiKey

  if (config.provider === 'openai') {
    if (token) headers.Authorization = `Bearer ${token}`
    return headers
  }

  if (config.provider === 'anthropic') {
    if (token) headers['x-api-key'] = token
    headers['anthropic-version'] = '2023-06-01'
    return headers
  }

  // local providers (ollama, llama-cpp, lmstudio)
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}
```

---

## Shared Utilities

```ts
// providers/shared.ts — key utilities

// Normalise URLs for OpenAI-compatible providers
export function normalizeOpenAiCompatibleBaseUrl(baseUrl?: string): string {
  if (!baseUrl) return ''
  let url = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
  if (url.endsWith('/api/v1')) url = url.replace('/api/v1', '/v1')
  return url
}

// Fetch with timeout (used in probes)
export async function withTimeout(
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(input, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timeoutId)
  }
}

// Remove duplicate model IDs
export function uniqueModels(models: AiDiscoveredModel[]): AiDiscoveredModel[] {
  const seen = new Set<string>()
  return models.filter((m) => {
    if (seen.has(m.id)) return false
    seen.add(m.id)
    return true
  })
}
```

---

## Registry Registration

After creating a provider folder, register in `providers/registry.ts`:

```ts
// providers/registry.ts (current production state)
import { antropicProvider } from './anthropic'
import { llamaCppProvider } from './llama-cpp'
import { lmStudioProvider } from './lmstudio'
import { ollamaProvider } from './ollama'
import { openAiProvider } from './openai'

registerProvider(llamaCppProvider)
registerProvider(ollamaProvider)
registerProvider(lmStudioProvider)
registerProvider(openAiProvider)
registerProvider(anthropicProvider)
```

---

## Registered Provider IDs

Current `AiProviderId` values (from `src/modules/ai/config/types.ts`):

```ts
type AiProviderId = 'llama-cpp' | 'ollama' | 'lm-studio' | 'openai' | 'anthropic'
```

When adding a new provider: add its id to this union type AND to `ia-config/<name>-config.js`.

---

## Anti-patterns to Avoid

| Don't do this                             | Do this instead                                  |
| ----------------------------------------- | ------------------------------------------------ |
| Import provider code in client components | Use `/api/ai/*` routes as boundary               |
| Expose `OPENAI_API_KEY` to client bundle  | Keep keys server-only, never prefix with `VITE_` |
| Write streaming logic in the provider     | Streaming is in `server/chat-execution.ts`       |
| Hard-code base URLs in adapter            | Always read from `config.baseUrl`                |
| Probe with infinite timeout               | Use `withTimeout(url, init, 5000)`               |
