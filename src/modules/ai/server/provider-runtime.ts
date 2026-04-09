import type { AiConfigFormData, AiProviderId } from '@/modules/ai/config'
import { discoverProviderModels, getProvider } from '@/modules/ai/providers'
import { createJsonErrorResponse } from './http'
import { resolveProviderModel } from './provider-models'
import { resolveAvailableProviderConfig } from './provider-resolution'

export interface ResolvedProviderRuntime {
  providerId: AiProviderId
  config: AiConfigFormData
  provider: NonNullable<ReturnType<typeof getProvider>>
  resolvedModel: string
}

export type ResolvedProviderRuntimeResult =
  | {
      ok: true
      runtime: ResolvedProviderRuntime
    }
  | {
      ok: false
      response: Response
    }

export async function resolveProviderRuntime(options: {
  requestedProviderId?: AiProviderId
  requestedModel?: string
  autoModelFallback?: string
}): Promise<ResolvedProviderRuntimeResult> {
  const resolvedProvider = await resolveAvailableProviderConfig(options.requestedProviderId)
  if (!resolvedProvider) {
    return {
      ok: false,
      response: createJsonErrorResponse('NO_PROVIDER_AVAILABLE', 503),
    }
  }

  const { config, providerId } = resolvedProvider
  const provider = getProvider(providerId)
  if (!provider) {
    return {
      ok: false,
      response: createJsonErrorResponse('UNKNOWN_PROVIDER', 400),
    }
  }

  const requestedModel = options.requestedModel ?? config.parameters.model
  const modelDiscovery = await discoverProviderModels({
    ...config,
    parameters: {
      ...config.parameters,
      model: requestedModel,
    },
  })

  const resolvedModel = resolveProviderModel({
    providerId,
    requestedModel: options.requestedModel,
    configuredModel: config.parameters.model,
    discoveredModel: modelDiscovery.resolvedModelId,
    autoModelFallback: options.autoModelFallback,
  })

  return {
    ok: true,
    runtime: {
      providerId,
      config,
      provider,
      resolvedModel,
    },
  }
}
