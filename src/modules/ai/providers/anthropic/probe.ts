import type { AiConfigFormData } from '@/modules/ai/config'
import { probeProviderConfig } from '../shared'
import type { AiProviderStatus } from '../types'
import { discoverAnthropicModels } from './models'
import { ANTHROPIC_PROVIDER_LABEL } from './types'

export async function probeAnthropicProvider(config: AiConfigFormData): Promise<AiProviderStatus> {
  return await probeProviderConfig({
    config,
    label: ANTHROPIC_PROVIDER_LABEL,
    discoverModels: discoverAnthropicModels,
    allowEmptyModelList: true,
  })
}
