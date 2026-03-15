import { createOpenaiChat } from '@tanstack/ai-openai'
import type { AiConfigFormData } from '@/modules/ai/config'
import { getProviderHeaders } from '../headers'
import { normalizeOpenAiCompatibleBaseUrl } from '../shared'
import type { ProviderRegistryItem } from '../types'
import { LLAMA_CPP_PROVIDER_ID, LLAMA_CPP_PROVIDER_LABEL } from './types'

function buildLlamaCppAdapter(
  config: AiConfigFormData,
): (model: string) => ReturnType<typeof createOpenaiChat> {
  const baseUrl = normalizeOpenAiCompatibleBaseUrl(config.baseUrl)

  return (model) =>
    createOpenaiChat(model as Parameters<typeof createOpenaiChat>[0], config.apiKey || '', {
      baseURL: baseUrl,
      defaultHeaders: getProviderHeaders(config),
    })
}

export const llamaCppProvider: ProviderRegistryItem = {
  id: LLAMA_CPP_PROVIDER_ID,
  label: LLAMA_CPP_PROVIDER_LABEL,
  buildAdapter: buildLlamaCppAdapter,
}
