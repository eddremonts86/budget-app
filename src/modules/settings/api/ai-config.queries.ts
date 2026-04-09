import { i18n } from '@/shared/lib/i18n'
import { useTQuery, useTQMutation } from '@/shared/lib/query'
import { aiConfigApi } from './ai-config.api'

export const aiConfigKeys = {
  all: ['ai-config'] as const,
  detail: () => [...aiConfigKeys.all, 'detail'] as const,
  store: () => [...aiConfigKeys.all, 'store'] as const,
  status: () => [...aiConfigKeys.all, 'status'] as const,
  models: (provider: string, baseUrl: string, modelEndpoint: string) =>
    [...aiConfigKeys.all, 'models', provider, baseUrl, modelEndpoint] as const,
}

export const useAiConfig = () => {
  return useTQuery(aiConfigKeys.detail(), () => aiConfigApi.getConfig())
}

export const useAiConfigStore = () => {
  return useTQuery(aiConfigKeys.store(), () => aiConfigApi.getConfigStore())
}

export const useAiProviderStatuses = () => {
  return useTQuery(aiConfigKeys.status(), () => aiConfigApi.getProviderStatuses(), {
    refetchInterval: 30000, // Check status every 30 seconds
  })
}

export const useAiProviderModels = (
  config: Parameters<typeof aiConfigApi.getProviderModels>[0],
) => {
  return useTQuery(
    aiConfigKeys.models(config.provider, config.baseUrl, config.endpoints.models),
    () => aiConfigApi.getProviderModels(config),
    {
      enabled: Boolean(config.provider && config.baseUrl && config.endpoints.models),
      refetchInterval: 30000,
    },
  )
}

export const useUpdateAiConfig = () => {
  return useTQMutation(['ai-config', 'update'], aiConfigApi.updateConfig, {
    invalidateKeys: [aiConfigKeys.all],
    successMessage: i18n.t('settings.ai.messages.saved'),
  })
}

export const useResetAiConfig = () => {
  return useTQMutation(['ai-config', 'reset'], aiConfigApi.resetConfig, {
    invalidateKeys: [aiConfigKeys.all],
    successMessage: i18n.t('settings.ai.messages.reset'),
  })
}

export const useTestAiConnection = () => {
  return useTQMutation(['ai-config', 'test'], aiConfigApi.testConnection)
}
