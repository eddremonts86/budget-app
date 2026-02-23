import type { AiConfigFormData } from '@/features/Settings/model/ai-config.schema'
// @ts-ignore
import AI_CONFIG from '../../../ia-config/index.js'

// Define types for ia-config structure to avoid 'any'
interface IaConfigModel {
  id: string
  [key: string]: any
}

interface IaConfigProvider {
  models?: Record<string, IaConfigModel>
  connection?: {
    baseUrl?: string
    apiKey?: string
    [key: string]: any
  }
  defaults?: Record<string, any>
  [key: string]: any
}

/**
 * Resolves the AI configuration for a given provider, merging defaults with overrides.
 * @param providerId The ID of the AI provider.
 * @param userConfig Optional user-provided configuration overrides.
 * @returns The resolved configuration.
 */
export const resolveAiConfig = (
  providerId: string,
  userConfig?: Partial<AiConfigFormData>
): AiConfigFormData => {
  // 1. Get base config from ia-config
  const configKey = providerId as keyof typeof AI_CONFIG
  const baseConfig = AI_CONFIG[configKey] as IaConfigProvider | undefined

  if (!baseConfig) {
    console.warn(`[ConfigResolver] No base configuration found for provider: ${providerId}`)
    // Return minimal valid config if base is missing
    return {
      provider: providerId as any,
      baseUrl: '',
      parameters: {},
      endpoints: { chat: '/chat/completions', models: '/models' },
      ...userConfig
    } as AiConfigFormData
  }

  // 2. Map ia-config structure to AiConfigFormData structure
  // ia-config has models, connection, defaults, etc.
  // AiConfigFormData has provider, baseUrl, parameters, endpoints, etc.

  const mappedBaseConfig: Partial<AiConfigFormData> = {
    provider: providerId as any,
    baseUrl: baseConfig.connection?.baseUrl || '',
    apiKey: baseConfig.connection?.apiKey || '',
    parameters: {
      temperature: 0.7,
      max_tokens: 2048,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      ...baseConfig.defaults,
      // Select model based on environment or hardware if implemented
      // For now, default to the first model in the list or a specific default
      model: baseConfig.models ? Object.values(baseConfig.models)[0]?.id : 'default-model',
    },
    endpoints: {
      chat: '/chat/completions',
      models: '/models',
    },
    timeout: baseConfig.connection?.timeout || 60000,
    port: baseConfig.connection?.baseUrl ? parseInt(new URL(baseConfig.connection.baseUrl).port) : 80,
  }

  // 3. Merge with user config
  // User config takes precedence
  const mergedConfig: AiConfigFormData = {
    ...mappedBaseConfig,
    ...userConfig,
    parameters: {
      ...mappedBaseConfig.parameters,
      ...userConfig?.parameters,
    },
    endpoints: {
      ...mappedBaseConfig.endpoints,
      ...userConfig?.endpoints,
    }
  } as AiConfigFormData

  // 4. Recalculate port if baseUrl is present in merged config
  if (mergedConfig.baseUrl) {
    try {
      const url = new URL(mergedConfig.baseUrl)
      const port = parseInt(url.port)
      if (!isNaN(port)) {
        mergedConfig.port = port
      } else if (url.protocol === 'http:') {
        mergedConfig.port = 80
      } else if (url.protocol === 'https:') {
        mergedConfig.port = 443
      }
    } catch (e) {
      // Invalid URL, keep existing port or default
    }
  }

  return mergedConfig
}

/**
 * Validates the configuration against hardware capabilities.
 * (Placeholder for future implementation)
 */
export const validateHardwareCompatibility = async (config: AiConfigFormData) => {
  // Check if model fits in GPU memory, etc.
  return true
}
