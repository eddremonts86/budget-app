import type { AiConfigFormData } from '@/modules/ai/config'
import { discoverStandardProviderModels } from '../model-discovery'
import type { ProviderDiscoveryResult } from '../types'

export async function discoverLmStudioModels(
  config: AiConfigFormData,
): Promise<ProviderDiscoveryResult> {
  return await discoverStandardProviderModels(config)
}
