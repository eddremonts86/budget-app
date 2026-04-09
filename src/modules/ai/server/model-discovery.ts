import type { AiConfigFormData, AiProviderId } from '@/modules/ai/config'
import { getAllAiConfigs } from '@/modules/ai/config/store'
import { discoverProviderModels } from '@/modules/ai/providers'

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
