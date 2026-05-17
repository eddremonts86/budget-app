import type { AiConfigFormData, AiConfigStore, AiProvider, AiRuntimeConfig } from './schema'
import { AI_PROVIDER_IDS } from './schema'

const getEnv = (key: string, defaultValue = '') => {
  if (typeof import.meta !== 'undefined' && import.meta.env?.[key as keyof ImportMetaEnv]) {
    return (import.meta.env[key as keyof ImportMetaEnv] as string | undefined) || defaultValue
  }
  if (typeof process !== 'undefined' && process.env?.[key]) {
    return process.env[key] || defaultValue
  }
  return defaultValue
}

const parseHeaderJson = (value?: string) => {
  if (!value) return {}
  try {
    const parsed = JSON.parse(value) as Record<string, string>
    return parsed ?? {}
  } catch {
    return {}
  }
}

const parsePort = (baseUrl: string, fallback: number) => {
  try {
    const url = new URL(baseUrl)
    const port = Number(url.port)
    if (!Number.isNaN(port) && port > 0) {
      return port
    }
    if (url.protocol === 'https:') return 443
    if (url.protocol === 'http:') return 80
  } catch {
    // Ignore URL parse errors and keep fallback
  }

  return fallback
}

export const AI_PROVIDER_PRIORITY = [...AI_PROVIDER_IDS]
export const AI_PROVIDER_SET = new Set<AiProvider>(AI_PROVIDER_IDS)

// AI_API_BASE_URL is the unified dev variable — provider-specific vars take priority.
export const AI_API_BASE_URL = getEnv('AI_API_BASE_URL') || getEnv('VITE_AI_BASE_URL') || ''

export const LMSTUDIO_BASE_URL =
  getEnv('AI_LMSTUDIO_BASE_URL') ||
  getEnv('AI_BASE_URL_INTERNAL') ||
  getEnv('VITE_AI_LMSTUDIO_BASE_URL') ||
  AI_API_BASE_URL ||
  'http://localhost:1234/v1'

export const LLAMA_CPP_BASE_URL =
  getEnv('AI_LLAMA_CPP_BASE_URL') ||
  getEnv('VITE_AI_LLAMA_CPP_BASE_URL') ||
  AI_API_BASE_URL ||
  'http://localhost:8080/v1'

export const OLLAMA_BASE_URL =
  getEnv('AI_OLLAMA_BASE_URL') ||
  getEnv('VITE_AI_OLLAMA_BASE_URL') ||
  AI_API_BASE_URL ||
  'http://localhost:11435/v1'

export const OPENAI_BASE_URL =
  getEnv('OPENAI_BASE_URL') || getEnv('VITE_AI_OPENAI_BASE_URL') || 'https://api.openai.com/v1'

export const ANTHROPIC_BASE_URL =
  getEnv('ANTHROPIC_BASE_URL') ||
  getEnv('VITE_AI_ANTHROPIC_BASE_URL') ||
  'https://api.anthropic.com/v1'

export const PROVIDER_DEFAULTS: Record<AiProvider, AiConfigFormData> = {
  'llama-cpp': {
    provider: 'llama-cpp',
    baseUrl: LLAMA_CPP_BASE_URL,
    port: parsePort(LLAMA_CPP_BASE_URL, 8080),
    token: '',
    apiKey: '',
    parameters: {
      model: getEnv('AI_LLAMA_CPP_MODEL', 'auto'),
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
    port: parsePort(OLLAMA_BASE_URL, 11434),
    token: '',
    apiKey: '',
    parameters: {
      model: getEnv('AI_OLLAMA_MODEL', 'auto'),
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
    baseUrl: OPENAI_BASE_URL,
    port: parsePort(OPENAI_BASE_URL, 443),
    token: '',
    apiKey: '',
    parameters: {
      model: getEnv('AI_OPENAI_MODEL', 'auto'),
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
    baseUrl: ANTHROPIC_BASE_URL,
    port: parsePort(ANTHROPIC_BASE_URL, 443),
    token: '',
    apiKey: '',
    parameters: {
      model: getEnv('AI_ANTHROPIC_MODEL', 'auto'),
      temperature: 0.7,
      max_tokens: 2048,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    },
    endpoints: {
      chat: '/messages',
      models: '/messages',
      load: '',
      download: '',
      status: '',
    },
    timeout: 30000,
    additionalParams: '',
  },
  'lm-studio': {
    provider: 'lm-studio',
    baseUrl: LMSTUDIO_BASE_URL,
    port: parsePort(LMSTUDIO_BASE_URL, 1234),
    token: '',
    apiKey: '',
    parameters: {
      model: getEnv('AI_LMSTUDIO_MODEL', 'auto'),
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

export const buildDefaultConfig = (provider: AiProvider): AiConfigFormData => ({
  ...PROVIDER_DEFAULTS[provider],
  parameters: { ...PROVIDER_DEFAULTS[provider].parameters },
  endpoints: { ...PROVIDER_DEFAULTS[provider].endpoints },
})

export const normalizeConfig = (
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
    port: parsePort(config?.baseUrl ?? fallback.baseUrl, fallback.port),
    additionalParams: config?.additionalParams ?? '',
  }
}

export const normalizeStore = (store?: Partial<AiConfigStore> | null): AiConfigStore => {
  const activeProvider =
    store?.activeProvider && AI_PROVIDER_SET.has(store.activeProvider)
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

export const aiConfig: AiRuntimeConfig = {
  baseUrl: getEnv('VITE_AI_BASE_URL', OLLAMA_BASE_URL),
  providerPriority: [...AI_PROVIDER_PRIORITY],
  requestTimeoutMs: 8000,
  providers: {
    'llama-cpp': {
      id: 'llama-cpp',
      baseUrl: LLAMA_CPP_BASE_URL,
      endpoints: { chat: '/chat/completions', models: '/models' },
      headers: parseHeaderJson(getEnv('AI_LLAMA_CPP_HEADERS')),
      defaultModel: getEnv('AI_LLAMA_CPP_MODEL', 'auto'),
      generation: { temperature: 0.7, maxTokens: 2048, topP: 0.9 },
    },
    ollama: {
      id: 'ollama',
      baseUrl: OLLAMA_BASE_URL,
      endpoints: { chat: '/chat/completions', models: '/models' },
      headers: parseHeaderJson(getEnv('AI_OLLAMA_HEADERS')),
      defaultModel: getEnv('AI_OLLAMA_MODEL', 'auto'),
      generation: { temperature: 0.7, maxTokens: 2048, topP: 0.9 },
    },
    'lm-studio': {
      id: 'lm-studio',
      baseUrl: LMSTUDIO_BASE_URL,
      endpoints: { chat: '/chat/completions', models: '/models' },
      headers: parseHeaderJson(getEnv('AI_LMSTUDIO_HEADERS')),
      defaultModel: getEnv('AI_LMSTUDIO_MODEL', 'auto'),
      generation: { temperature: 0.4, maxTokens: 1024, topP: 0.9 },
    },
    openai: {
      id: 'openai',
      baseUrl: OPENAI_BASE_URL,
      endpoints: { chat: '/v1/chat/completions', models: '/v1/models' },
      headers: parseHeaderJson(getEnv('AI_OPENAI_HEADERS')),
      defaultModel: getEnv('AI_OPENAI_MODEL', 'auto'),
      generation: { temperature: 0.4, maxTokens: 1024, topP: 0.9 },
    },
    anthropic: {
      id: 'anthropic',
      baseUrl: ANTHROPIC_BASE_URL,
      endpoints: { chat: '/v1/messages', models: '/v1/messages' },
      headers: parseHeaderJson(getEnv('AI_ANTHROPIC_HEADERS')),
      defaultModel: getEnv('AI_ANTHROPIC_MODEL', 'auto'),
      generation: { temperature: 0.4, maxTokens: 1024, topP: 0.9 },
    },
  },
}
