import axios from 'axios'
import { apiClient } from '@/shared/lib/api'
import type { AiConfigFormData, AiConfigAuditLog } from '../model/ai-config.schema'

const AI_CONFIG_ENDPOINT = '/ai-config'
const AUDIT_LOGS_ENDPOINT = '/audit-logs'

export const aiConfigApi = {
  getConfig: async (): Promise<AiConfigFormData | null> => {
    try {
      const { data } = await apiClient.get<AiConfigFormData>(AI_CONFIG_ENDPOINT)
      return data
    } catch {
      return null
    }
  },

  updateConfig: async (config: AiConfigFormData): Promise<AiConfigFormData> => {
    try {
      const { data } = await apiClient.put(AI_CONFIG_ENDPOINT, config)
      await aiConfigApi.addAuditLog('update', config)
      return data
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number } }
      if (axiosError.response?.status === 404) {
        const { data } = await apiClient.post(AI_CONFIG_ENDPOINT, config)
        await aiConfigApi.addAuditLog('update', config)
        return data
      }
      throw error
    }
  },

  resetConfig: async (): Promise<void> => {
    try {
      await apiClient.delete(AI_CONFIG_ENDPOINT)
      await aiConfigApi.addAuditLog('reset')
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number } }
      if (axiosError.response?.status !== 404) throw error
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
