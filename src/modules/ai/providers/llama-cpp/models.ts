import type { AiConfigFormData } from '@/modules/ai/config'
import { discoverStandardProviderModels } from '../model-discovery'
import type { ProviderDiscoveryResult } from '../types'
import { resolveLlamaCppReachableConfig } from './config'

export async function discoverLlamaCppModels(
  config: AiConfigFormData,
): Promise<ProviderDiscoveryResult> {
  const resolvedConfig = await resolveLlamaCppReachableConfig(config)
  return await discoverStandardProviderModels(resolvedConfig)
}
