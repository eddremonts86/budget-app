import type { AiProviderId } from '@/modules/ai/config'

export type ProviderSpecificModelOptions = {
  think?: boolean
  chat_template_kwargs?: {
    enable_thinking: boolean
  }
  reasoning_format?: 'none'
}

export function buildProviderSpecificOptions(
  providerId: AiProviderId,
  model?: string,
): ProviderSpecificModelOptions {
  const normalizedModel = (model || '').toLowerCase()
  const isQwenReasoningModel = /qwen(?:3|3\.5|35)/.test(normalizedModel)

  if (!isQwenReasoningModel) {
    return {}
  }

  if (providerId === 'ollama') {
    return {
      think: false,
    }
  }

  if (providerId === 'llama-cpp') {
    return {
      chat_template_kwargs: {
        enable_thinking: false,
      },
      reasoning_format: 'none',
    }
  }

  return {}
}

export function resolveProviderModel(options: {
  providerId: AiProviderId
  requestedModel?: string
  configuredModel?: string
  discoveredModel?: string | null
  autoModelFallback?: string
}): string {
  const { autoModelFallback, configuredModel, discoveredModel, providerId, requestedModel } =
    options

  const normalizedRequestedModel = requestedModel?.trim()
  if (normalizedRequestedModel) {
    return normalizedRequestedModel
  }

  const normalizedConfiguredModel = configuredModel?.trim()
  if (providerId === 'ollama') {
    if ((!normalizedConfiguredModel || normalizedConfiguredModel === 'auto') && autoModelFallback) {
      return autoModelFallback
    }
  }

  return discoveredModel || normalizedConfiguredModel || autoModelFallback || 'auto'
}
