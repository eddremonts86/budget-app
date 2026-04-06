import type { AiConfigFormData } from '@/modules/ai/config'
import { getProviderHeaders } from './headers'
import type { AiDiscoveredModel, AiProviderStatus, ProviderDiscoveryResult } from './types'

export function normalizeBaseUrl(baseUrl?: string): string {
  if (!baseUrl) return ''

  let url = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
  if (url.endsWith('/api/v1')) {
    url = `${url.slice(0, -'/api/v1'.length)}/v1`
  }

  return url
}

export function normalizeOpenAiCompatibleBaseUrl(baseUrl?: string): string {
  if (!baseUrl) return ''

  let url = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
  if (url.endsWith('/api/v1')) {
    url = url.replace('/api/v1', '/v1')
  }

  return url
}

export function toServiceRootUrl(baseUrl?: string): string {
  const normalized = normalizeBaseUrl(baseUrl)
  if (normalized.endsWith('/v1')) {
    return normalized.slice(0, -'/v1'.length)
  }
  return normalized
}

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

export function normalizeModelId(value: unknown): string | null {
  if (typeof value !== 'string') return null

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function uniqueModels(models: AiDiscoveredModel[]): AiDiscoveredModel[] {
  const seen = new Set<string>()

  return models.filter((model) => {
    if (seen.has(model.id)) return false
    seen.add(model.id)
    return true
  })
}

export async function fetchProviderJson(url: string, config: AiConfigFormData): Promise<unknown> {
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

export function buildProbeUrl(config: AiConfigFormData): string {
  const baseUrl = config.baseUrl?.endsWith('/') ? config.baseUrl.slice(0, -1) : config.baseUrl || ''
  const modelsEndpoint = config.endpoints.models.startsWith('/')
    ? config.endpoints.models
    : `/${config.endpoints.models}`

  return `${baseUrl}${modelsEndpoint}`
}

export async function probeProviderConfig(options: {
  config: AiConfigFormData
  label: string
  discoverModels: (config: AiConfigFormData) => Promise<ProviderDiscoveryResult>
  allowEmptyModelList?: boolean
}): Promise<AiProviderStatus> {
  const { allowEmptyModelList = false, config, discoverModels, label } = options
  const start = Date.now()
  const id = config.provider

  try {
    const response = await withTimeout(
      buildProbeUrl(config),
      {
        method: 'GET',
        headers: getProviderHeaders(config),
      },
      config.timeout || 8000,
    )

    const latencyMs = Date.now() - start
    if (response.ok) {
      let modelCount = 0
      let activeModelId: string | null = null
      let resolvedModelId: string | null = null

      try {
        const data = await response.json()
        if (data && typeof data === 'object' && Array.isArray((data as { data?: unknown }).data)) {
          modelCount = (data as { data: unknown[] }).data.length
        } else if (Array.isArray(data)) {
          modelCount = data.length
        }
      } catch {
        // Ignore JSON parse errors for status-only requests.
      }

      try {
        const discovered = await discoverModels(config)
        activeModelId = discovered.activeModelId
        resolvedModelId =
          discovered.models.find((model) => model.active)?.id || discovered.models[0]?.id || null
      } catch {
        // Ignore model discovery failures in health probes.
      }

      if (modelCount === 0 && !allowEmptyModelList) {
        return {
          id,
          label,
          available: false,
          status: 'error',
          latencyMs,
          modelCount,
          activeModelId,
          resolvedModelId,
          message: 'NO_MODELS_FOUND',
        }
      }

      return {
        id,
        label,
        available: true,
        status: 'available',
        latencyMs,
        modelCount,
        activeModelId,
        resolvedModelId,
      }
    }

    if (response.status === 405) {
      return {
        id,
        label,
        available: true,
        status: 'available',
        latencyMs,
      }
    }

    if (response.status === 401 || response.status === 403) {
      // Auth error: server is reachable but credentials are invalid/missing.
      // Mark as available=false so provider selection skips it and falls back
      // to a working local provider. The auth_required status is kept for UI display.
      return {
        id,
        label,
        available: false,
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
      message: `HTTP_${response.status}`,
    }
  } catch (error) {
    return {
      id,
      label,
      available: false,
      status: 'unreachable',
      latencyMs: Date.now() - start,
      message: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
    }
  }
}
