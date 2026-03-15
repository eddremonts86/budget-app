import AI_CONFIG from '../../../ia-config/index.js'
import type { AiConfigFormData, AiProviderId } from './schema'

interface IaConfigModel {
  id: string
  [key: string]: unknown
}

interface IaConfigProvider {
  models?: Record<string, IaConfigModel>
  connection?: {
    baseUrl?: string
    base_url?: string
    apiKey?: string
    timeout?: number
    [key: string]: unknown
  }
  server?: {
    base_url?: string
    baseUrl?: string
    timeout?: number
    [key: string]: unknown
  }
  integration?: {
    timeout?: number
    [key: string]: unknown
  }
  defaults?: Record<string, unknown>
  [key: string]: unknown
}

export const resolveAiConfig = (
  providerId: AiProviderId,
  userConfig?: Partial<AiConfigFormData>,
): AiConfigFormData => {
  const configKey = providerId as keyof typeof AI_CONFIG
  const baseConfig = AI_CONFIG[configKey] as IaConfigProvider | undefined
  const baseUrlFromConfig =
    baseConfig?.connection?.baseUrl ||
    baseConfig?.connection?.base_url ||
    baseConfig?.server?.baseUrl ||
    baseConfig?.server?.base_url ||
    ''

  const envBaseUrlByProvider: Record<AiProviderId, string | undefined> = {
    'llama-cpp': process.env.AI_LLAMA_CPP_BASE_URL || process.env.VITE_AI_LLAMA_CPP_BASE_URL,
    ollama: process.env.AI_OLLAMA_BASE_URL || process.env.VITE_AI_OLLAMA_BASE_URL,
    'lm-studio':
      process.env.AI_BASE_URL_INTERNAL ||
      process.env.VITE_AI_LMSTUDIO_BASE_URL ||
      process.env.VITE_AI_BASE_URL,
    openai: process.env.OPENAI_BASE_URL || process.env.VITE_AI_OPENAI_BASE_URL,
    anthropic: process.env.ANTHROPIC_BASE_URL || process.env.VITE_AI_ANTHROPIC_BASE_URL,
  }

  const resolvedBaseUrl = envBaseUrlByProvider[providerId] || baseUrlFromConfig
  const resolvedTimeout =
    baseConfig?.connection?.timeout ||
    baseConfig?.server?.timeout ||
    baseConfig?.integration?.timeout ||
    60000

  if (!baseConfig) {
    return {
      provider: providerId,
      baseUrl: '',
      parameters: {
        model: 'auto',
        temperature: 0.7,
        max_tokens: 2048,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      },
      endpoints: { chat: '/chat/completions', models: '/models' },
      port: 80,
      timeout: resolvedTimeout,
      ...userConfig,
    } as AiConfigFormData
  }

  const mappedBaseConfig: Partial<AiConfigFormData> = {
    provider: providerId,
    baseUrl: resolvedBaseUrl,
    apiKey: baseConfig.connection?.apiKey || '',
    parameters: {
      temperature: 0.7,
      max_tokens: 2048,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      ...(baseConfig.defaults as Partial<AiConfigFormData['parameters']> | undefined),
      model: userConfig?.parameters?.model || 'auto',
    },
    endpoints: {
      chat: '/chat/completions',
      models: '/models',
    },
    timeout: resolvedTimeout,
    port: resolvedBaseUrl ? parseInt(new URL(resolvedBaseUrl).port || '80', 10) : 80,
  }

  const mergedConfig = {
    ...mappedBaseConfig,
    ...userConfig,
    parameters: {
      ...mappedBaseConfig.parameters,
      ...userConfig?.parameters,
    },
    endpoints: {
      ...mappedBaseConfig.endpoints,
      ...userConfig?.endpoints,
    },
  } as AiConfigFormData

  if (mergedConfig.baseUrl) {
    try {
      const url = new URL(mergedConfig.baseUrl)
      const port = parseInt(url.port, 10)
      if (!Number.isNaN(port)) {
        mergedConfig.port = port
      } else if (url.protocol === 'http:') {
        mergedConfig.port = 80
      } else if (url.protocol === 'https:') {
        mergedConfig.port = 443
      }
    } catch {
      // Ignore invalid URL and keep existing port
    }
  }

  return mergedConfig
}

export const validateHardwareCompatibility = async (_config: AiConfigFormData) => true
