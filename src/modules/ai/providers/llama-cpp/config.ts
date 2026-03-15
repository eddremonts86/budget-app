import type { AiConfigFormData } from '@/modules/ai/config'
import { buildDefaultConfig } from '@/modules/ai/config'
import { getProviderHeaders } from '../headers'
import { buildProbeUrl, withTimeout } from '../shared'
import { LLAMA_CPP_PROVIDER_ID } from './types'

export const getLlamaCppDefaultConfig = () => buildDefaultConfig(LLAMA_CPP_PROVIDER_ID)

function toLocalhostFallbackBaseUrl(baseUrl: string): string | null {
  try {
    const parsed = new URL(baseUrl)
    if (parsed.hostname !== 'llama-cpp') return null
    parsed.hostname = 'localhost'
    return parsed.toString().replace(/\/$/, '')
  } catch {
    return null
  }
}

async function canReachLlamaCpp(config: AiConfigFormData): Promise<boolean> {
  try {
    const response = await withTimeout(
      buildProbeUrl(config),
      {
        method: 'GET',
        headers: getProviderHeaders(config),
      },
      Math.min(config.timeout || 8000, 2000),
    )

    return response.ok
  } catch {
    return false
  }
}

export async function resolveLlamaCppReachableConfig(
  config: AiConfigFormData,
): Promise<AiConfigFormData> {
  if (config.provider !== LLAMA_CPP_PROVIDER_ID) return config

  const localhostBaseUrl = toLocalhostFallbackBaseUrl(config.baseUrl)
  if (!localhostBaseUrl) return config

  if (await canReachLlamaCpp(config)) {
    return config
  }

  const fallbackConfig: AiConfigFormData = {
    ...config,
    baseUrl: localhostBaseUrl,
  }

  if (await canReachLlamaCpp(fallbackConfig)) {
    return fallbackConfig
  }

  return config
}
