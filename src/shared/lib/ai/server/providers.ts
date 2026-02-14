import type { AnyTextAdapter } from '@tanstack/ai'
import { createAnthropicChat } from '@tanstack/ai-anthropic'
import { createOpenaiChat } from '@tanstack/ai-openai'
import type { AiConfigFormData } from '@/features/Settings/model/ai-config.schema'
import { type AiProviderId } from '../ai-config'
import { getActiveAiConfig } from './config-store'

export type AiProviderStatus = {
  id: AiProviderId
  label: string
  available: boolean
  status: 'available' | 'auth_required' | 'unreachable' | 'error'
  latencyMs: number
  message?: string
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

registerProvider({
  id: 'lm-studio',
  label: 'LM Studio',
  buildAdapter: (config) => {
    const apiKey = config.apiKey || config.token || 'lm-studio'
    return (model) =>
      createOpenaiChat(model as Parameters<typeof createOpenaiChat>[0], apiKey, {
        baseURL: config.baseUrl,
        defaultHeaders: getProviderHeaders(config),
      })
  },
})

registerProvider({
  id: 'openai',
  label: 'OpenAI',
  buildAdapter: (config) => {
    const apiKey = config.apiKey || config.token || ''
    return (model) =>
      createOpenaiChat(model as Parameters<typeof createOpenaiChat>[0], apiKey, {
        baseURL: config.baseUrl,
        defaultHeaders: getProviderHeaders(config),
      })
  },
})

registerProvider({
  id: 'anthropic',
  label: 'Anthropic',
  buildAdapter: (config) => {
    const apiKey = config.apiKey || config.token || ''
    return (model) =>
      createAnthropicChat(model as Parameters<typeof createAnthropicChat>[0], apiKey, {
        baseURL: config.baseUrl,
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
  try {
    return new URL(config.endpoints.models, config.baseUrl).toString()
  } catch {
    return `${config.baseUrl}${config.endpoints.models}`
  }
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
      return { id, label, available: true, status: 'available', latencyMs }
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

export const detectBestProvider = async () => {
  const config = await getActiveAiConfig()
  const status = await probeProvider(config)
  return { statuses: [status], provider: status.available ? status.id : null }
}
