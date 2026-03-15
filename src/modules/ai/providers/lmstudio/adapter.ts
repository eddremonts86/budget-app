import { createOpenaiChat } from '@tanstack/ai-openai'
import type { AiConfigFormData } from '@/modules/ai/config'
import { getProviderHeaders } from '../headers'
import { normalizeOpenAiCompatibleBaseUrl } from '../shared'
import type { ProviderRegistryItem } from '../types'
import { LMSTUDIO_PROVIDER_ID, LMSTUDIO_PROVIDER_LABEL } from './types'

function buildLmStudioAdapter(
  config: AiConfigFormData,
): (model: string) => ReturnType<typeof createOpenaiChat> {
  const apiKey = config.apiKey || config.token || 'lm-studio'
  const baseUrl = normalizeOpenAiCompatibleBaseUrl(config.baseUrl)

  return (model) =>
    createOpenaiChat(model as Parameters<typeof createOpenaiChat>[0], apiKey, {
      baseURL: baseUrl,
      defaultHeaders: getProviderHeaders(config),
    })
}

export const lmStudioProvider: ProviderRegistryItem = {
  id: LMSTUDIO_PROVIDER_ID,
  label: LMSTUDIO_PROVIDER_LABEL,
  buildAdapter: buildLmStudioAdapter,
}
