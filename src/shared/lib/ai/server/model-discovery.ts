import type { AiConfigFormData } from '@/features/Settings/model/ai-config.schema'
import type { AiProviderId } from '../ai-config'
import { getProviderHeaders } from './providers'

export interface AiDiscoveredModel {
  id: string
  label: string
  active: boolean
}

export interface AiDiscoveredModelsResult {
  provider: AiProviderId
  models: AiDiscoveredModel[]
  activeModelId: string | null
  configuredModelId: string | null
  resolvedModelId: string | null
}

const normalizeBaseUrl = (baseUrl?: string) => {
  if (!baseUrl) return ''
  let url = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
  if (url.endsWith('/api/v1')) {
    url = `${url.slice(0, -'/api/v1'.length)}/v1`
  }
  return url
}

const toServiceRootUrl = (baseUrl?: string) => {
  const normalized = normalizeBaseUrl(baseUrl)
  if (normalized.endsWith('/v1')) {
    return normalized.slice(0, -'/v1'.length)
  }
  return normalized
}

const withTimeout = async (input: RequestInfo | URL, init: RequestInit, timeoutMs: number) => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(input, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timeoutId)
  }
}

const normalizeModelId = (value: unknown): string | null => {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

const uniqueModels = (models: AiDiscoveredModel[]) => {
  const seen = new Set<string>()
  return models.filter((model) => {
    if (seen.has(model.id)) return false
    seen.add(model.id)
    return true
  })
}

const parseStandardModels = (payload: unknown): AiDiscoveredModel[] => {
  if (!payload || typeof payload !== 'object') return []

  const data = (payload as { data?: unknown }).data
  if (!Array.isArray(data)) return []

  return uniqueModels(
    data
      .map((item) => {
        if (!item || typeof item !== 'object') return null
        const modelId =
          normalizeModelId((item as { id?: unknown }).id) ||
          normalizeModelId((item as { name?: unknown }).name)
        if (!modelId) return null
        return {
          id: modelId,
          label: modelId,
          active: false,
        }
      })
      .filter((item): item is AiDiscoveredModel => Boolean(item)),
  )
}

const parseOllamaTags = (payload: unknown): AiDiscoveredModel[] => {
  if (!payload || typeof payload !== 'object') return []

  const models = (payload as { models?: unknown }).models
  if (!Array.isArray(models)) return []

  return uniqueModels(
    models
      .map((item) => {
        if (!item || typeof item !== 'object') return null
        const modelId =
          normalizeModelId((item as { model?: unknown }).model) ||
          normalizeModelId((item as { name?: unknown }).name)
        if (!modelId) return null
        return {
          id: modelId,
          label: modelId,
          active: false,
        }
      })
      .filter((item): item is AiDiscoveredModel => Boolean(item)),
  )
}

const parseOllamaRunningModels = (payload: unknown): string[] => {
  if (!payload || typeof payload !== 'object') return []

  const models = (payload as { models?: unknown }).models
  if (!Array.isArray(models)) return []

  return models
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      return (
        normalizeModelId((item as { model?: unknown }).model) ||
        normalizeModelId((item as { name?: unknown }).name)
      )
    })
    .filter((item): item is string => Boolean(item))
}

const fetchJson = async (url: string, config: AiConfigFormData) => {
  const response = await withTimeout(
    url,
    {
      method: 'GET',
      headers: getProviderHeaders(config),
    },
    config.timeout || 15000,
  )

  if (!response.ok) {
    throw new Error(`HTTP_${response.status}`)
  }

  return await response.json()
}

const discoverStandardProviderModels = async (config: AiConfigFormData) => {
  const baseUrl = normalizeBaseUrl(config.baseUrl)
  const modelsEndpoint = config.endpoints.models.startsWith('/')
    ? config.endpoints.models
    : `/${config.endpoints.models}`
  const payload = await fetchJson(`${baseUrl}${modelsEndpoint}`, config)
  const models = parseStandardModels(payload)
  const activeModelId = models[0]?.id ?? null
  return { models, activeModelId }
}

const discoverOllamaModels = async (config: AiConfigFormData) => {
  const serviceBaseUrl = toServiceRootUrl(config.baseUrl)
  const [tagsPayload, runningPayload] = await Promise.all([
    fetchJson(`${serviceBaseUrl}/api/tags`, config),
    fetchJson(`${serviceBaseUrl}/api/ps`, config).catch(() => ({ models: [] })),
  ])

  const models = parseOllamaTags(tagsPayload)
  const runningModels = new Set(parseOllamaRunningModels(runningPayload))
  const activeModelId = Array.from(runningModels)[0] ?? null

  return {
    models: models.map((model) => ({
      ...model,
      active: runningModels.has(model.id),
    })),
    activeModelId,
  }
}

export const discoverProviderModels = async (
  config: AiConfigFormData,
): Promise<AiDiscoveredModelsResult> => {
  const configuredModelId = normalizeModelId(config.parameters.model)
  let discoveredModels: AiDiscoveredModel[] = []
  let activeModelId: string | null = null

  try {
    if (config.provider === 'ollama') {
      const result = await discoverOllamaModels(config)
      discoveredModels = result.models
      activeModelId = result.activeModelId
    } else {
      const result = await discoverStandardProviderModels(config)
      discoveredModels = result.models
      activeModelId = result.activeModelId
    }
  } catch {
    discoveredModels = []
    activeModelId = null
  }

  const availableModelIds = new Set(discoveredModels.map((model) => model.id))
  const requestedModelId =
    configuredModelId && configuredModelId !== 'auto' ? configuredModelId : null
  const resolvedModelId =
    (requestedModelId && availableModelIds.has(requestedModelId) ? requestedModelId : null) ||
    (activeModelId && availableModelIds.has(activeModelId) ? activeModelId : null) ||
    discoveredModels[0]?.id ||
    requestedModelId ||
    null

  const models = uniqueModels(
    discoveredModels.map((model) => ({
      ...model,
      active: model.id === activeModelId,
    })),
  )

  return {
    provider: config.provider,
    models,
    activeModelId,
    configuredModelId,
    resolvedModelId,
  }
}
