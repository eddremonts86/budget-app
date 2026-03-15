import type { AiConfigFormData } from '@/ai/config'
import { discoverOllamaProviderModels } from '../model-discovery'
import type { ProviderDiscoveryResult } from '../types'

export async function discoverOllamaModels(
  config: AiConfigFormData,
): Promise<ProviderDiscoveryResult> {
  return await discoverOllamaProviderModels(config)
}
