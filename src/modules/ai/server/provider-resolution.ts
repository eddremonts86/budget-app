import type { AiConfigFormData, AiProviderId } from '@/modules/ai/config'
import { getActiveAiConfig, getAllAiConfigs } from '@/modules/ai/config/store'
import { detectBestProvider, probeProvider } from '@/modules/ai/providers'
import { resolveLlamaCppReachableConfig } from '@/modules/ai/providers/llama-cpp'

export interface ResolvedProviderConfig {
  providerId: AiProviderId
  config: AiConfigFormData
}

export async function resolveAvailableProviderConfig(
  requestedProviderId?: AiProviderId,
): Promise<ResolvedProviderConfig | null> {
  const activeConfig = await getActiveAiConfig()
  const allConfigs = await getAllAiConfigs()

  const preferredProviderId = requestedProviderId ?? activeConfig.provider
  const preferredConfig = allConfigs.providers[preferredProviderId]
  const resolvedPreferredConfig = preferredConfig
    ? preferredProviderId === 'llama-cpp'
      ? await resolveLlamaCppReachableConfig(preferredConfig)
      : preferredConfig
    : null

  if (resolvedPreferredConfig) {
    const status = await probeProvider(resolvedPreferredConfig)
    if (status.available) {
      return {
        providerId: preferredProviderId,
        config: resolvedPreferredConfig,
      }
    }
  }

  const detection = await detectBestProvider()
  if (!detection.provider) {
    return null
  }

  const detectedConfig = allConfigs.providers[detection.provider]
  if (!detectedConfig) {
    return null
  }

  const resolvedDetectedConfig =
    detection.provider === 'llama-cpp'
      ? await resolveLlamaCppReachableConfig(detectedConfig)
      : detectedConfig

  return {
    providerId: detection.provider,
    config: resolvedDetectedConfig,
  }
}
