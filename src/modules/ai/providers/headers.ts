import type { AiConfigFormData } from '@/modules/ai/config'

export function getProviderHeaders(config: AiConfigFormData): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  const token = config.token || config.apiKey

  if (config.provider === 'openai') {
    if (token) headers.Authorization = `Bearer ${token}`
    return headers
  }

  if (config.provider === 'anthropic') {
    if (token) headers['x-api-key'] = token
    headers['anthropic-version'] = '2023-06-01'
    return headers
  }

  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}
