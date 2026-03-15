import type { AiConfigFormData, AiProviderId } from '@/ai/config'
import { getAllAiConfigs } from '@/ai/config/store'
import { discoverProviderModels } from '@/ai/providers'

export async function discoverConfiguredProviderModels(requestedProviderId?: string | null) {
  const store = await getAllAiConfigs()
  const targetProvider =
    requestedProviderId && requestedProviderId in store.providers
      ? (requestedProviderId as AiProviderId)
      : store.activeProvider

  return discoverProviderModels(store.providers[targetProvider])
}

export async function discoverModelsFromConfig(config: AiConfigFormData) {
  return discoverProviderModels(config)
}
