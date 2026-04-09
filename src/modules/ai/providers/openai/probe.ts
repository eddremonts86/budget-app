import type { AiConfigFormData } from '@/modules/ai/config'
import { probeProviderConfig } from '../shared'
import type { AiProviderStatus } from '../types'
import { discoverOpenAiModels } from './models'
import { OPENAI_PROVIDER_LABEL } from './types'

export async function probeOpenAiProvider(config: AiConfigFormData): Promise<AiProviderStatus> {
  return await probeProviderConfig({
    config,
    label: OPENAI_PROVIDER_LABEL,
    discoverModels: discoverOpenAiModels,
  })
}
