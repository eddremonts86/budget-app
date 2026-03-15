import type { AiConfigFormData } from '@/modules/ai/config'
import { probeProviderConfig } from '../shared'
import type { AiProviderStatus } from '../types'
import { discoverLmStudioModels } from './models'
import { LMSTUDIO_PROVIDER_LABEL } from './types'

export async function probeLmStudioProvider(config: AiConfigFormData): Promise<AiProviderStatus> {
  return await probeProviderConfig({
    config,
    label: LMSTUDIO_PROVIDER_LABEL,
    discoverModels: discoverLmStudioModels,
  })
}
