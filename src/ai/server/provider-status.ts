import type { AiConfigFormData } from '@/ai/config'
import { listProviderStatuses, probeProvider } from '@/ai/providers'

export async function getProviderStatuses() {
  return listProviderStatuses()
}

export async function testProviderConnection(config: AiConfigFormData) {
  const status = await probeProvider(config)
  const success =
    status.status === 'available' ||
    (status.status === 'auth_required' && !config.apiKey && !config.token)

  return {
    success,
    status,
  }
}
