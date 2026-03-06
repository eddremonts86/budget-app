import type {
  AiConfigFormData,
  AiConfigStore,
  AiProvider,
} from '@/features/Settings/model/ai-config.schema'
const LMSTUDIO_BASE_URL =
  process.env.AI_BASE_URL_INTERNAL ||
  process.env.VITE_AI_LMSTUDIO_BASE_URL ||
  process.env.VITE_AI_BASE_URL

const LLAMA_CPP_BASE_URL =
  process.env.AI_LLAMA_CPP_BASE_URL ||
  process.env.VITE_AI_LLAMA_CPP_BASE_URL ||
  'http://localhost:8080/v1'

const OLLAMA_BASE_URL =
  process.env.AI_OLLAMA_BASE_URL ||
  process.env.VITE_AI_OLLAMA_BASE_URL ||
  'http://localhost:11434/v1'

const PROVIDERS = new Set<AiProvider>(['llama-cpp', 'ollama', 'lm-studio', 'openai', 'anthropic'])

const PROVIDER_DEFAULTS: Record<AiProvider, AiConfigFormData> = {
  'llama-cpp': {
    provider: 'llama-cpp',
    baseUrl: LLAMA_CPP_BASE_URL,
    port: 8080,
    token: '',
    apiKey: '',
    parameters: {
      model: 'auto',
      temperature: 0.7,
      max_tokens: 2048,
      top_p: 0.9,
      frequency_penalty: 0,
      presence_penalty: 0,
    },
    endpoints: {
      chat: '/chat/completions',
      models: '/models',
      load: '',
      download: '',
      status: '',
    },
    timeout: 30000,
    additionalParams: '',
  },
  ollama: {
    provider: 'ollama',
    baseUrl: OLLAMA_BASE_URL,
    port: 11434,
    token: '',
    apiKey: '',
    parameters: {
      model: 'auto',
      temperature: 0.7,
      max_tokens: 2048,
      top_p: 0.9,
      frequency_penalty: 0,
      presence_penalty: 0,
    },
    endpoints: {
      chat: '/chat/completions',
      models: '/models',
      load: '/api/pull',
      download: '/api/pull',
      status: '',
    },
    timeout: 30000,
    additionalParams: '',
  },
  openai: {
    provider: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    port: 443,
    token: '',
    apiKey: '',
    parameters: {
      model: 'auto',
      temperature: 0.7,
      max_tokens: 2048,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    },
    endpoints: {
      chat: '/chat/completions',
      models: '/models',
      load: '',
      download: '',
      status: '',
    },
    timeout: 30000,
    additionalParams: '',
  },
  anthropic: {
    provider: 'anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    port: 443,
    token: '',
    apiKey: '',
    parameters: {
      model: 'auto',
      temperature: 0.7,
      max_tokens: 2048,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    },
    endpoints: {
      chat: '/messages',
      models: '/models',
      load: '',
      download: '',
      status: '',
    },
    timeout: 30000,
    additionalParams: '',
  },
  'lm-studio': {
    provider: 'lm-studio',
    baseUrl: 'http://localhost:1234/v1',
    port: 1234,
    token: '',
    apiKey: '',
    parameters: {
      model: 'auto',
      temperature: 0.7,
      max_tokens: 2048,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    },
    endpoints: {
      chat: '/chat/completions',
      models: '/models',
      load: '/models/load',
      download: '/models/download',
      status: '/models/download/status/:job_id',
    },
    timeout: 30000,
    additionalParams: '',
  },
}

const buildDefaultConfig = (provider: AiProvider): AiConfigFormData => ({
  ...PROVIDER_DEFAULTS[provider],
  parameters: { ...PROVIDER_DEFAULTS[provider].parameters },
  endpoints: { ...PROVIDER_DEFAULTS[provider].endpoints },
})

const normalizeConfig = (
  config: Partial<AiConfigFormData> | null | undefined,
  provider: AiProvider,
): AiConfigFormData => {
  const fallback = buildDefaultConfig(provider)
  const mergedParameters = config?.parameters
    ? { ...fallback.parameters, ...config.parameters }
    : fallback.parameters
  const mergedEndpoints = config?.endpoints
    ? { ...fallback.endpoints, ...config.endpoints }
    : fallback.endpoints

  return {
    ...fallback,
    ...config,
    provider,
    token: config?.token ?? config?.apiKey ?? '',
    apiKey: config?.apiKey ?? '',
    parameters: mergedParameters,
    endpoints: mergedEndpoints,
    additionalParams: config?.additionalParams ?? '',
  }
}

const normalizeStore = (store?: Partial<AiConfigStore> | null): AiConfigStore => {
  const activeProvider =
    store?.activeProvider && PROVIDERS.has(store.activeProvider)
      ? store.activeProvider
      : 'llama-cpp'

  return {
    activeProvider,
    providers: {
      'llama-cpp': normalizeConfig(store?.providers?.['llama-cpp'], 'llama-cpp'),
      ollama: normalizeConfig(store?.providers?.ollama, 'ollama'),
      openai: normalizeConfig(store?.providers?.openai, 'openai'),
      anthropic: normalizeConfig(store?.providers?.anthropic, 'anthropic'),
      'lm-studio': normalizeConfig(store?.providers?.['lm-studio'], 'lm-studio'),
    },
  }
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

/**
 * Fetches the active AI configuration from the database/mock API.
 * This is intended for server-side use.
 */
export async function getActiveAiConfig(): Promise<AiConfigFormData> {
  try {
    const { readAiConfig } = await import('@/server/utils/ai-config-helper')
    const store = normalizeStore(await readAiConfig())
    return withLmStudioRuntimeOverrides(store.providers[store.activeProvider])
  } catch {
    return buildDefaultConfig('llama-cpp')
  }
}

export async function getAllAiConfigs(): Promise<AiConfigStore> {
  try {
    const { readAiConfig } = await import('@/server/utils/ai-config-helper')
    return normalizeStore(await readAiConfig())
  } catch {
    return normalizeStore(null)
  }
}

/**
 * Validates if the configuration is complete for the active provider.
 */
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
