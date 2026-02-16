import axios from 'axios'
import type { AiConfigFormData } from '@/features/Settings/model/ai-config.schema'

const API_URL = process.env.API_URL_INTERNAL || process.env.VITE_API_URL || 'http://localhost:3001'
const LMSTUDIO_BASE_URL =
  process.env.AI_BASE_URL_INTERNAL ||
  process.env.VITE_AI_LMSTUDIO_BASE_URL ||
  process.env.VITE_AI_BASE_URL
const LMSTUDIO_MODEL = process.env.AI_LMSTUDIO_MODEL || process.env.LMSTUDIO_IDENTIFIER

/**
 * Fetches the active AI configuration from the database/mock API.
 * This is intended for server-side use.
 */
export async function getActiveAiConfig(): Promise<AiConfigFormData> {
  try {
    const { data } = await axios.get<AiConfigFormData>(`${API_URL}/ai-config`)

    if (!data?.provider) {
      throw new Error('AI_CONFIG_NOT_FOUND')
    }

    if (data.provider !== 'lm-studio') {
      return data
    }

    return {
      ...data,
      baseUrl: LMSTUDIO_BASE_URL || data.baseUrl,
      parameters: {
        ...data.parameters,
        model: LMSTUDIO_MODEL || data.parameters.model,
      },
    }
  } catch {
    // Return a default LM Studio config if fetch fails as a fallback
    return {
      provider: 'lm-studio',
      baseUrl: LMSTUDIO_BASE_URL || 'http://localhost:1234/v1',
      port: 1234,
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
    }
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
