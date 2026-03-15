import type { AiConfigFormData } from '@/modules/ai/config'
import { discoverOllamaProviderModels } from '../model-discovery'
import type { ProviderDiscoveryResult } from '../types'

export async function discoverOllamaModels(
  config: AiConfigFormData,
): Promise<ProviderDiscoveryResult> {
  return await discoverOllamaProviderModels(config)
}
