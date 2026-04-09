import { createOpenaiChat } from '@tanstack/ai-openai'
import type { AiConfigFormData } from '@/modules/ai/config'
import { getProviderHeaders } from '../headers'
import { normalizeOpenAiCompatibleBaseUrl } from '../shared'
import type { ProviderRegistryItem } from '../types'
import { OLLAMA_PROVIDER_ID, OLLAMA_PROVIDER_LABEL } from './types'

function buildOllamaAdapter(
  config: AiConfigFormData,
): (model: string) => ReturnType<typeof createOpenaiChat> {
  const baseUrl = normalizeOpenAiCompatibleBaseUrl(config.baseUrl)

  return (model) =>
    createOpenaiChat(model as Parameters<typeof createOpenaiChat>[0], config.apiKey || 'ollama', {
      baseURL: baseUrl,
      defaultHeaders: getProviderHeaders(config),
    })
}

export const ollamaProvider: ProviderRegistryItem = {
  id: OLLAMA_PROVIDER_ID,
  label: OLLAMA_PROVIDER_LABEL,
  buildAdapter: buildOllamaAdapter,
}
