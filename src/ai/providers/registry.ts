import type { AiProviderId } from '@/ai/config'
import { anthropicProvider } from './anthropic'
import { llamaCppProvider } from './llama-cpp'
import { lmStudioProvider } from './lmstudio'
import { ollamaProvider } from './ollama'
import { openAiProvider } from './openai'
import type { ProviderRegistryItem } from './types'

const providerRegistry = new Map<AiProviderId, ProviderRegistryItem>()

export const registerProvider = (provider: ProviderRegistryItem) => {
  providerRegistry.set(provider.id, provider)
}

registerProvider(llamaCppProvider)
registerProvider(ollamaProvider)
registerProvider(lmStudioProvider)
registerProvider(openAiProvider)
registerProvider(anthropicProvider)

export const getProvider = (id: AiProviderId) => providerRegistry.get(id)
