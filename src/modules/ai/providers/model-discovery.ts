import type { AiConfigFormData } from '@/modules/ai/config'
import { discoverAnthropicModels } from './anthropic'
import { discoverLlamaCppModels } from './llama-cpp'
import { discoverLmStudioModels } from './lmstudio'
import { discoverOllamaModels } from './ollama'
import { discoverOpenAiModels } from './openai'
import {
  fetchProviderJson,
  normalizeBaseUrl,
  normalizeModelId,
  toServiceRootUrl,
  uniqueModels,
} from './shared'
import type { AiDiscoveredModel, AiDiscoveredModelsResult, ProviderDiscoveryResult } from './types'

function parseStandardModels(payload: unknown): AiDiscoveredModel[] {
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
        return { id: modelId, label: modelId, active: false }
      })
      .filter((item): item is AiDiscoveredModel => Boolean(item)),
  )
}

function parseOllamaTags(payload: unknown): AiDiscoveredModel[] {
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
        return { id: modelId, label: modelId, active: false }
      })
      .filter((item): item is AiDiscoveredModel => Boolean(item)),
  )
}

function parseOllamaRunningModels(payload: unknown): string[] {
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

export async function discoverStandardProviderModels(
  config: AiConfigFormData,
): Promise<ProviderDiscoveryResult> {
  const baseUrl = normalizeBaseUrl(config.baseUrl)
  const modelsEndpoint = config.endpoints.models.startsWith('/')
    ? config.endpoints.models
    : `/${config.endpoints.models}`
  const payload = await fetchProviderJson(`${baseUrl}${modelsEndpoint}`, config)
  const models = parseStandardModels(payload)

  return {
    models,
    activeModelId: models[0]?.id ?? null,
  }
}

export async function discoverOllamaProviderModels(
  config: AiConfigFormData,
): Promise<ProviderDiscoveryResult> {
  const serviceBaseUrl = toServiceRootUrl(config.baseUrl)
  const [tagsPayload, runningPayload] = await Promise.all([
    fetchProviderJson(`${serviceBaseUrl}/api/tags`, config),
    fetchProviderJson(`${serviceBaseUrl}/api/ps`, config).catch(() => ({ models: [] })),
  ])

  const models = parseOllamaTags(tagsPayload)
  const runningModels = new Set(parseOllamaRunningModels(runningPayload))

  return {
    models: models.map((model) => ({ ...model, active: runningModels.has(model.id) })),
    activeModelId: Array.from(runningModels)[0] ?? null,
  }
}

export const discoverProviderModels = async (
  config: AiConfigFormData,
): Promise<AiDiscoveredModelsResult> => {
  const configuredModelId = normalizeModelId(config.parameters.model)
  let discovery: ProviderDiscoveryResult = { models: [], activeModelId: null }

  try {
    switch (config.provider) {
      case 'anthropic':
        discovery = await discoverAnthropicModels(config)
        break
      case 'llama-cpp':
        discovery = await discoverLlamaCppModels(config)
        break
      case 'lm-studio':
        discovery = await discoverLmStudioModels(config)
        break
      case 'ollama':
        discovery = await discoverOllamaModels(config)
        break
      case 'openai':
        discovery = await discoverOpenAiModels(config)
        break
    }
  } catch {
    discovery = { models: [], activeModelId: null }
  }

  const availableModelIds = new Set(discovery.models.map((model) => model.id))
  const requestedModelId =
    configuredModelId && configuredModelId !== 'auto' ? configuredModelId : null
  const resolvedModelId =
    (requestedModelId && availableModelIds.has(requestedModelId) ? requestedModelId : null) ||
    (discovery.activeModelId && availableModelIds.has(discovery.activeModelId)
      ? discovery.activeModelId
      : null) ||
    discovery.models[0]?.id ||
    requestedModelId ||
    null

  const models = uniqueModels(
    discovery.models.map((model) => ({
      ...model,
      active: model.id === discovery.activeModelId,
    })),
  )

  return {
    provider: config.provider,
    models,
    activeModelId: discovery.activeModelId,
    configuredModelId,
    resolvedModelId,
  }
}
