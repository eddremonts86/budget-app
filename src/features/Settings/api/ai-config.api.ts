import axios from 'axios'
import { apiClient } from '@/shared/lib/api'
import type {
  AiConfigFormData,
  AiConfigAuditLog,
  AiConfigStore,
  AiProvider,
} from '../model/ai-config.schema'

const AI_CONFIG_STORE_ENDPOINT = '/ai-config-store'
const AUDIT_LOGS_ENDPOINT = '/audit-logs'

const PROVIDERS = new Set<AiProvider>(['openai', 'anthropic', 'lm-studio'])

const PROVIDER_DEFAULTS: Record<AiProvider, AiConfigFormData> = {
  openai: {
    provider: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    port: 443,
    token: '',
    apiKey: '',
    parameters: {
      model: 'gpt-4o',
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
      model: 'claude-3-5-sonnet-20240620',
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
      model: 'local-model',
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
      : 'lm-studio'

  return {
    activeProvider,
    providers: {
      openai: normalizeConfig(store?.providers?.openai, 'openai'),
      anthropic: normalizeConfig(store?.providers?.anthropic, 'anthropic'),
      'lm-studio': normalizeConfig(store?.providers?.['lm-studio'], 'lm-studio'),
    },
  }
}

export const aiConfigApi = {
  getConfigStore: async (): Promise<AiConfigStore> => {
    const { data } = await apiClient.get<AiConfigStore>(AI_CONFIG_STORE_ENDPOINT)
    return normalizeStore(data)
  },

  getConfig: async (): Promise<AiConfigFormData | null> => {
    try {
      const store = await aiConfigApi.getConfigStore()
      return store.providers[store.activeProvider]
    } catch {
      return null
    }
  },

  updateConfig: async (config: AiConfigFormData): Promise<AiConfigFormData> => {
    const nextConfig = normalizeConfig(config, config.provider)
    const store = await aiConfigApi.getConfigStore()

    const nextStore: AiConfigStore = {
      ...store,
      activeProvider: nextConfig.provider,
      providers: {
        ...store.providers,
        [nextConfig.provider]: nextConfig,
      },
    }

    await aiConfigApi.persistStore(nextStore)
    await aiConfigApi.addAuditLog('update', nextConfig)
    return nextConfig
  },

  setActiveProvider: async (provider: AiProvider): Promise<AiConfigFormData> => {
    const store = await aiConfigApi.getConfigStore()
    const nextStore: AiConfigStore = {
      ...store,
      activeProvider: provider,
      providers: {
        ...store.providers,
        [provider]: normalizeConfig(store.providers[provider], provider),
      },
    }

    await aiConfigApi.persistStore(nextStore)
    return nextStore.providers[provider]
  },

  resetConfig: async (): Promise<void> => {
    const store = await aiConfigApi.getConfigStore()
    const provider = store.activeProvider
    const nextConfig = buildDefaultConfig(provider)

    const nextStore: AiConfigStore = {
      ...store,
      providers: {
        ...store.providers,
        [provider]: nextConfig,
      },
    }

    await aiConfigApi.persistStore(nextStore)
    await aiConfigApi.addAuditLog('reset', { provider })
  },

  persistStore: async (store: AiConfigStore): Promise<void> => {
    try {
      await apiClient.put(AI_CONFIG_STORE_ENDPOINT, store)
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number } }
      if (axiosError.response?.status === 404) {
        await apiClient.post(AI_CONFIG_STORE_ENDPOINT, store)
        return
      }
      throw error
    }
  },

  /**
   * Unifies the connection to AI agents.
   * Based on the provider, it handles headers, endpoints, and request format.
   */
  testConnection: async (config: AiConfigFormData): Promise<boolean> => {
    try {
      const headers = aiConfigApi.getHeaders(config)
      const baseUrl = config.baseUrl.endsWith('/') ? config.baseUrl.slice(0, -1) : config.baseUrl
      const modelsEndpoint = config.endpoints.models.startsWith('/')
        ? config.endpoints.models
        : `/${config.endpoints.models}`
      const url = `${baseUrl}${modelsEndpoint}`

      await axios.get(url, {
        headers,
        timeout: 10000, // A bit more for connection test
      })
      return true
    } catch {
      return false
    }
  },

  getHeaders: (config: AiConfigFormData): Record<string, string> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    const token = config.token || config.apiKey

    switch (config.provider) {
      case 'openai':
        if (token) headers['Authorization'] = `Bearer ${token}`
        break
      case 'anthropic':
        if (token) headers['x-api-key'] = token
        headers['anthropic-version'] = '2023-06-01'
        break
      case 'lm-studio':
        // LM Studio usually doesn't require auth by default
        break
    }

    return headers
  },

  // LM Studio Specific Methods
  loadModel: async (modelId: string, config: AiConfigFormData): Promise<void> => {
    if (config.provider !== 'lm-studio' || !config.endpoints.load) return
    const url = `${config.baseUrl}${config.endpoints.load}`
    await axios.post(url, { modelId }, { headers: aiConfigApi.getHeaders(config) })
  },

  downloadModel: async (modelId: string, config: AiConfigFormData): Promise<void> => {
    if (config.provider !== 'lm-studio' || !config.endpoints.download) return
    const url = `${config.baseUrl}${config.endpoints.download}`
    await axios.post(url, { modelId }, { headers: aiConfigApi.getHeaders(config) })
  },

  getDownloadStatus: async (jobId: string, config: AiConfigFormData): Promise<unknown> => {
    if (config.provider !== 'lm-studio' || !config.endpoints.status) return null
    const url = `${config.baseUrl}${config.endpoints.status}/${jobId}`
    const { data } = await axios.get(url, { headers: aiConfigApi.getHeaders(config) })
    return data
  },

  addAuditLog: async (
    action: AiConfigAuditLog['action'],
    changes?: Partial<AiConfigFormData>,
  ): Promise<void> => {
    const log: AiConfigAuditLog = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      action,
      changes,
    }
    await apiClient.post(AUDIT_LOGS_ENDPOINT, log)
  },
}
