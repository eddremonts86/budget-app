import type { AiConfigFormData } from '@/features/Settings/model/ai-config.schema'
import type { AnyTextAdapter } from '@tanstack/ai'
import { createAnthropicChat } from '@tanstack/ai-anthropic'
import { createOpenaiChat } from '@tanstack/ai-openai'
import { type AiProviderId, aiConfig } from '../ai-config'
import { getAllAiConfigs } from './config-store'

export type AiProviderStatus = {
  id: AiProviderId
  label: string
  available: boolean
  status: 'available' | 'auth_required' | 'unreachable' | 'error'
  latencyMs: number
  message?: string
  modelCount?: number
}

type ProviderRegistryItem = {
  id: AiProviderId
  label: string
  buildAdapter: (config: AiConfigFormData) => (model: string) => AnyTextAdapter
}

const providerRegistry = new Map<AiProviderId, ProviderRegistryItem>()

export const registerProvider = (provider: ProviderRegistryItem) => {
  providerRegistry.set(provider.id, provider)
}

const normalizeOpenAiBaseUrl = (baseUrl: string) => {
  let url = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
  // Si termina en /api/v1, lo normalizamos a /v1 para compatibilidad con el adaptador de OpenAI
  if (url.endsWith('/api/v1')) {
    url = url.replace('/api/v1', '/v1')
  }
  return url
}

registerProvider({
  id: 'llama-cpp',
  label: 'Llama.cpp',
  buildAdapter: (config) => {
    const baseUrl = normalizeOpenAiBaseUrl(config.baseUrl)
    return (model) =>
      createOpenaiChat(model as Parameters<typeof createOpenaiChat>[0], config.apiKey || '', {
        baseURL: baseUrl,
        defaultHeaders: getProviderHeaders(config),
      })
  },
})

registerProvider({
  id: 'ollama',
  label: 'Ollama',
  buildAdapter: (config) => {
    const baseUrl = normalizeOpenAiBaseUrl(config.baseUrl)
    return (model) =>
      createOpenaiChat(model as Parameters<typeof createOpenaiChat>[0], config.apiKey || 'ollama', {
        baseURL: baseUrl,
        defaultHeaders: getProviderHeaders(config),
      })
  },
})

registerProvider({
  id: 'lm-studio',
  label: 'LM Studio',
  buildAdapter: (config) => {
    const apiKey = config.apiKey || config.token || 'lm-studio'
    const baseUrl = normalizeOpenAiBaseUrl(config.baseUrl)
    return (model) =>
      createOpenaiChat(model as Parameters<typeof createOpenaiChat>[0], apiKey, {
        baseURL: baseUrl,
        defaultHeaders: getProviderHeaders(config),
      })
  },
})

registerProvider({
  id: 'openai',
  label: 'OpenAI',
  buildAdapter: (config) => {
    const apiKey = config.apiKey || config.token || ''
    const baseUrl = normalizeOpenAiBaseUrl(config.baseUrl)
    return (model) =>
      createOpenaiChat(model as Parameters<typeof createOpenaiChat>[0], apiKey, {
        baseURL: baseUrl,
        defaultHeaders: getProviderHeaders(config),
      })
  },
})

registerProvider({
  id: 'anthropic',
  label: 'Anthropic',
  buildAdapter: (config) => {
    const apiKey = config.apiKey || config.token || ''
    const baseUrl = config.baseUrl.endsWith('/') ? config.baseUrl.slice(0, -1) : config.baseUrl
    return (model) =>
      createAnthropicChat(model as Parameters<typeof createAnthropicChat>[0], apiKey, {
        baseURL: baseUrl,
        defaultHeaders: getProviderHeaders(config),
      })
  },
})

export const getProvider = (id: AiProviderId) => providerRegistry.get(id)

export const getProviderHeaders = (config: AiConfigFormData) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  const token = config.token || config.apiKey

  if (config.provider === 'openai') {
    if (token) headers['Authorization'] = `Bearer ${token}`
    return headers
  }

  if (config.provider === 'anthropic') {
    if (token) headers['x-api-key'] = token
    headers['anthropic-version'] = '2023-06-01'
    return headers
  }

  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

const buildProbeUrl = (config: AiConfigFormData) => {
  const baseUrl = config.baseUrl.endsWith('/') ? config.baseUrl.slice(0, -1) : config.baseUrl
  const modelsEndpoint = config.endpoints.models.startsWith('/')
    ? config.endpoints.models
    : `/${config.endpoints.models}`
  return `${baseUrl}${modelsEndpoint}`
}

const withTimeout = async (input: RequestInfo | URL, init: RequestInit, timeoutMs: number) => {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(input, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(id)
  }
}

export const probeProvider = async (config: AiConfigFormData): Promise<AiProviderStatus> => {
  const start = Date.now()
  const id = config.provider
  const label = getProvider(id)?.label ?? id
  try {
    const res = await withTimeout(
      buildProbeUrl(config),
      {
        method: 'GET',
        headers: getProviderHeaders(config),
      },
      config.timeout || 8000,
    )
    const latencyMs = Date.now() - start
    if (res.ok) {
      let modelCount = 0
      try {
        const data = await res.json()
        if (data && Array.isArray(data.data)) {
          modelCount = data.data.length
        } else if (Array.isArray(data)) {
          modelCount = data.length
        }
      } catch {
        // Ignore JSON parse error
      }

      if (modelCount === 0 && id !== 'anthropic') {
        return {
          id,
          label,
          available: false,
          status: 'error',
          latencyMs,
          modelCount,
          message: 'NO_MODELS_FOUND',
        }
      }

      return { id, label, available: true, status: 'available', latencyMs, modelCount }
    }

    // Handle 405 Method Not Allowed (used for Anthropic probe on /v1/messages)
    if (res.status === 405) {
      return {
        id,
        label,
        available: true,
        status: 'available',
        latencyMs,
      }
    }

    if (res.status === 401 || res.status === 403) {
      return {
        id,
        label,
        available: true,
        status: 'auth_required',
        latencyMs,
        message: 'AUTH_REQUIRED',
      }
    }
    return {
      id,
      label,
      available: false,
      status: 'error',
      latencyMs,
      message: `HTTP_${res.status}`,
    }
  } catch (error) {
    const latencyMs = Date.now() - start
    return {
      id,
      label,
      available: false,
      status: 'unreachable',
      latencyMs,
      message: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
    }
  }
}

export const listProviderStatuses = async (): Promise<AiProviderStatus[]> => {
  const allConfigs = await getAllAiConfigs()
  const statuses: AiProviderStatus[] = []

  for (const providerId of aiConfig.providerPriority) {
    const config = allConfigs.providers[providerId]
    if (!config) continue
    statuses.push(await probeProvider(config))
  }

  return statuses
}

export const detectBestProvider = async () => {
  const allConfigs = await getAllAiConfigs()
  const statuses: AiProviderStatus[] = []

  for (const providerId of aiConfig.providerPriority) {
    const config = allConfigs.providers[providerId]
    if (!config) continue

    const status = await probeProvider(config)
    statuses.push(status)

    if (status.available) {
      return { statuses, provider: providerId }
    }
  }

  return { statuses, provider: null }
}
