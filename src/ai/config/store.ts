import { buildDefaultConfig, LMSTUDIO_BASE_URL, normalizeStore } from './defaults'
import type { AiConfigFormData, AiConfigStore } from './schema'

async function loadFileStoreModule() {
  const modulePath = './file-store'
  return await import(/* @vite-ignore */ modulePath)
}

async function loadAiConfigStore() {
  const { readAiConfig } = await loadFileStoreModule()
  return readAiConfig()
}

const withLmStudioRuntimeOverrides = (config: AiConfigFormData): AiConfigFormData => {
  if (config.provider !== 'lm-studio') {
    return config
  }

  return {
    ...config,
    baseUrl: LMSTUDIO_BASE_URL || config.baseUrl,
  }
}

export async function getActiveAiConfig(): Promise<AiConfigFormData> {
  try {
    const store = normalizeStore(await loadAiConfigStore())
    return withLmStudioRuntimeOverrides(store.providers[store.activeProvider])
  } catch {
    return buildDefaultConfig('llama-cpp')
  }
}

export async function getAllAiConfigs(): Promise<AiConfigStore> {
  try {
    return normalizeStore(await loadAiConfigStore())
  } catch {
    return normalizeStore(null)
  }
}

export function validateAiConfig(config: AiConfigFormData): { valid: boolean; error?: string } {
  if (!config.baseUrl) return { valid: false, error: 'MISSING_BASE_URL' }
  if (!config.endpoints.chat) return { valid: false, error: 'MISSING_CHAT_ENDPOINT' }

  if (config.provider === 'openai' || config.provider === 'anthropic') {
    if (!config.apiKey && !config.token) {
      return { valid: false, error: 'MISSING_API_KEY' }
    }
  }

  return { valid: true }
}
