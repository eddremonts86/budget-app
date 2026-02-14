import { i18n } from '@/shared/lib/i18n'
import { useTQuery, useTQMutation } from '@/shared/lib/query'
import { aiConfigApi } from './ai-config.api'

export const aiConfigKeys = {
  all: ['ai-config'] as const,
  detail: () => [...aiConfigKeys.all, 'detail'] as const,
}

export const useAiConfig = () => {
  return useTQuery(aiConfigKeys.detail(), () => aiConfigApi.getConfig())
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
