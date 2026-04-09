import type { AiConfigFormData } from '@/modules/ai/config'
import { probeProviderConfig } from '../shared'
import type { AiProviderStatus } from '../types'
import { resolveLlamaCppReachableConfig } from './config'
import { discoverLlamaCppModels } from './models'
import { LLAMA_CPP_PROVIDER_LABEL } from './types'

export async function probeLlamaCppProvider(config: AiConfigFormData): Promise<AiProviderStatus> {
  const resolvedConfig = await resolveLlamaCppReachableConfig(config)
  return await probeProviderConfig({
    config: resolvedConfig,
    label: LLAMA_CPP_PROVIDER_LABEL,
    discoverModels: discoverLlamaCppModels,
  })
}
