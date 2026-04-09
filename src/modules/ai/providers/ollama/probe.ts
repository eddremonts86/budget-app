import type { AiConfigFormData } from '@/modules/ai/config'
import { probeProviderConfig } from '../shared'
import type { AiProviderStatus } from '../types'
import { discoverOllamaModels } from './models'
import { OLLAMA_PROVIDER_LABEL } from './types'

export async function probeOllamaProvider(config: AiConfigFormData): Promise<AiProviderStatus> {
  return await probeProviderConfig({
    config,
    label: OLLAMA_PROVIDER_LABEL,
    discoverModels: discoverOllamaModels,
  })
}
