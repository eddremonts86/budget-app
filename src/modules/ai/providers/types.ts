import type { AnyTextAdapter } from '@tanstack/ai'
import type { AiConfigFormData, AiProviderId } from '@/modules/ai/config'

export interface AiProviderStatus {
  id: AiProviderId
  label: string
  available: boolean
  status: 'available' | 'auth_required' | 'unreachable' | 'error'
  latencyMs: number
  message?: string
  modelCount?: number
  activeModelId?: string | null
  resolvedModelId?: string | null
}

export interface ProviderRegistryItem {
  id: AiProviderId
  label: string
  buildAdapter: (config: AiConfigFormData) => (model: string) => AnyTextAdapter
}

export interface AiDiscoveredModel {
  id: string
  label: string
  active: boolean
}

export interface AiDiscoveredModelsResult {
  provider: AiProviderId
  models: AiDiscoveredModel[]
  activeModelId: string | null
  configuredModelId: string | null
  resolvedModelId: string | null
}

export interface ProviderDiscoveryResult {
  models: AiDiscoveredModel[]
  activeModelId: string | null
}
