export { resolveAiDataDir, resolveAiDataFilePath, type AiDataFileName } from './data-paths'
export { getActiveAiConfig, getAllAiConfigs, validateAiConfig } from '@/modules/ai/config/store'
export {
  detectBestProvider,
  getProvider,
  getProviderHeaders,
  listProviderStatuses,
  probeProvider,
  registerProvider,
} from '@/modules/ai/providers'
export { discoverProviderModels } from '@/modules/ai/providers'
export { buildProviderSpecificOptions, resolveProviderModel } from './provider-models'
export { resolveAvailableProviderConfig } from './provider-resolution'
export { buildChatModelOptions, streamLmStudioChat, streamOllamaChat } from './chat-streaming'
export { createAiChatResponse } from './chat-execution'
export type { ChatMessages } from './chat-execution'
export {
  createAiConfigReadErrorPayload,
  createEmptyAiConfigStore,
  readPersistedAiConfig,
  readPersistedAiConfigOrEmpty,
  writePersistedAiConfig,
} from './config-store'
export { getErrorDetails, getErrorMessage } from './errors'
export { createJsonErrorResponse, createJsonResponse } from './http'
export {
  consolidateChatMessages,
  findLastUserQuery,
  injectReferenceContext,
  isDashboardDomainQuery,
  normalizeIncomingChatMessages,
} from './chat-messages'
export { readAuditData, writeAuditSettings } from './audit-store'
export { discoverConfiguredProviderModels, discoverModelsFromConfig } from './model-discovery'
export { getProviderStatuses, testProviderConnection } from './provider-status'
export { resolveProviderRuntime } from './provider-runtime'
