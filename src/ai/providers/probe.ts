import type { AiConfigFormData, AiProviderId } from '@/ai/config'
import { aiConfig } from '@/ai/config'
import { getAllAiConfigs } from '@/ai/config/store'
import { probeAnthropicProvider } from './anthropic'
import { probeLlamaCppProvider } from './llama-cpp'
import { probeLmStudioProvider } from './lmstudio'
import { probeOllamaProvider } from './ollama'
import { probeOpenAiProvider } from './openai'
import type { AiProviderStatus } from './types'

export async function probeProvider(config: AiConfigFormData): Promise<AiProviderStatus> {
  switch (config.provider) {
    case 'anthropic':
      return await probeAnthropicProvider(config)
    case 'llama-cpp':
      return await probeLlamaCppProvider(config)
    case 'lm-studio':
      return await probeLmStudioProvider(config)
    case 'ollama':
      return await probeOllamaProvider(config)
    case 'openai':
      return await probeOpenAiProvider(config)
  }
}

export async function listProviderStatuses(): Promise<AiProviderStatus[]> {
  const allConfigs = await getAllAiConfigs()
  const statuses: AiProviderStatus[] = []

  for (const providerId of aiConfig.providerPriority) {
    const config = allConfigs.providers[providerId]
    if (!config) continue
    statuses.push(await probeProvider(config))
  }

  return statuses
}

export async function detectBestProvider(): Promise<{
  statuses: AiProviderStatus[]
  provider: AiProviderId | null
}> {
  const allConfigs = await getAllAiConfigs()
  const statuses: AiProviderStatus[] = []

  for (const providerId of aiConfig.providerPriority) {
    const config = allConfigs.providers[providerId]
    if (!config) continue

    const status = await probeProvider(config)
    statuses.push(status)

    if (status.available) {
      return { statuses, provider: providerId }
    }
  }

  return { statuses, provider: null }
}
