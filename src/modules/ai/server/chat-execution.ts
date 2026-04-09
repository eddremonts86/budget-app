import { chat, toServerSentEventsResponse } from '@tanstack/ai'
import type { AiConfigFormData, AiProviderId } from '@/modules/ai/config'
import type { ProviderRegistryItem } from '@/modules/ai/providers/types'
import { buildChatModelOptions } from './chat-streaming'
import { buildProviderSpecificOptions } from './provider-models'

export type ChatMessages = Parameters<typeof chat>[0]['messages']

interface ChatStreamOptions {
  provider: ProviderRegistryItem
  config: AiConfigFormData
  providerId: AiProviderId
  resolvedModel: string
  messages: ChatMessages
  params?: {
    temperature?: number
    maxTokens?: number
    topP?: number
  }
  conversationId?: string
}

export function createAiChatResponse(options: ChatStreamOptions): Response {
  const { config, conversationId, messages, params, provider, providerId, resolvedModel } = options

  const adapter = provider.buildAdapter(config)(resolvedModel)
  const modelOptions = {
    ...buildChatModelOptions({ providerId, params, config }),
    ...buildProviderSpecificOptions(providerId, resolvedModel),
  }

  const stream = chat({
    adapter,
    messages,
    conversationId,
    modelOptions: modelOptions as Parameters<typeof chat>[0]['modelOptions'],
  })

  return toServerSentEventsResponse(stream)
}
