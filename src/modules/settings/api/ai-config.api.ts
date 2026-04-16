import axios from 'axios'
import { buildDefaultConfig, normalizeConfig, normalizeStore } from '@/modules/ai/config'
import type {
  AiConfigAuditLog,
  AiConfigFormData,
  AiConfigStore,
  AiProvider,
} from '@/modules/ai/config'
import { getProviderHeaders } from '@/modules/ai/providers'
import type { AiProviderStatus } from '@/modules/ai/providers/types'
import { apiClient } from '@/shared/lib/api'

const AI_CONFIG_STORE_ENDPOINT = '/api/ai/config-store'
const AUDIT_LOGS_ENDPOINT = '/api/ai/audit'

export interface AiProviderModelInfo {
  id: string
  label: string
  active: boolean
}

export interface AiProviderModelsResponse {
  provider: AiProvider
  models: AiProviderModelInfo[]
  activeModelId: string | null
  configuredModelId: string | null
  resolvedModelId: string | null
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

    await Promise.all([
      aiConfigApi.persistStore(nextStore),
      aiConfigApi.addAuditLog('update', nextConfig),
    ])
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

    await Promise.all([
      aiConfigApi.persistStore(nextStore),
      aiConfigApi.addAuditLog('reset', { provider }),
    ])
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
   * Calls a server-side endpoint to avoid CORS issues and reuse probe logic.
   */
  testConnection: async (config: AiConfigFormData): Promise<boolean> => {
    try {
      const { data } = await apiClient.post<{ success: boolean }>('/api/ai/test-connection', config)
      return data.success
    } catch {
      return false
    }
  },

  getProviderStatuses: async (): Promise<AiProviderStatus[]> => {
    try {
      const { data } = await apiClient.get<{ statuses: AiProviderStatus[] }>('/api/ai/status')
      return data.statuses
    } catch {
      return []
    }
  },

  getProviderModels: async (config: AiConfigFormData): Promise<AiProviderModelsResponse> => {
    const { data } = await apiClient.post<AiProviderModelsResponse>('/api/ai/models', config)
    return data
  },

  getHeaders: (config: AiConfigFormData) => {
    return getProviderHeaders(config)
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
