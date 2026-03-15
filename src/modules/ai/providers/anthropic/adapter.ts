import { createAnthropicChat } from '@tanstack/ai-anthropic'
import type { AiConfigFormData } from '@/modules/ai/config'
import { getProviderHeaders } from '../headers'
import type { ProviderRegistryItem } from '../types'
import { ANTHROPIC_PROVIDER_ID, ANTHROPIC_PROVIDER_LABEL } from './types'

function buildAnthropicAdapter(
  config: AiConfigFormData,
): (model: string) => ReturnType<typeof createAnthropicChat> {
  const apiKey = config.apiKey || config.token || ''
  const baseUrl = config.baseUrl?.endsWith('/') ? config.baseUrl.slice(0, -1) : config.baseUrl || ''

  return (model) =>
    createAnthropicChat(model as Parameters<typeof createAnthropicChat>[0], apiKey, {
      baseURL: baseUrl,
      defaultHeaders: getProviderHeaders(config),
    })
}

export const anthropicProvider: ProviderRegistryItem = {
  id: ANTHROPIC_PROVIDER_ID,
  label: ANTHROPIC_PROVIDER_LABEL,
  buildAdapter: buildAnthropicAdapter,
}
