import { createServerFn } from '@tanstack/react-start'
import type { AiConfigFormData } from '@/features/Settings/model/ai-config.schema'
import appKnowledge from '@/server/data/app-knowledge.json'
import type { AiProviderId } from '@/shared/lib/ai/ai-config'

// --- Helpers ---

function formatKnowledgeBase(knowledge: typeof appKnowledge): string {
  const mainNav = knowledge.navigation.main.map(
    (item) => `- **${item.label}** (${item.url}): ${item.description}`,
  )

  const secondaryNav = knowledge.navigation.secondary.map((item) => {
    const desc = 'description' in item ? ` - ${item.description}` : ''
    return `- **${item.label}** (${item.url})${desc}`
  })

  return [
    `# Application: ${knowledge.application.name}`,
    `Description: ${knowledge.application.description}`,
    `Base URL: ${knowledge.application.baseUrl}`,
    '\n## Navigation (Main)',
    ...mainNav,
    '\n## Navigation (Secondary)',
    ...secondaryNav,
  ].join('\n')
}

function normalizeBaseUrl(baseUrl: string): string {
  let url = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
  if (url.endsWith('/api/v1')) {
    url = url.replace('/api/v1', '/v1')
  }
  return url
}

export type SearchRequestBody = {
  query: string
  providerId?: AiProviderId
  model?: string
  params?: {
    temperature?: number
    maxTokens?: number
    topP?: number
  }
}

const buildProviderModelOptions = (
  providerId: AiProviderId,
  body: SearchRequestBody,
  config: AiConfigFormData,
) => {
  const options: Record<string, number> = {
    temperature: body.params?.temperature ?? config.parameters.temperature,
    top_p: body.params?.topP ?? config.parameters.top_p,
    frequency_penalty: config.parameters.frequency_penalty,
    presence_penalty: config.parameters.presence_penalty,
  }

  const maxTokens = body.params?.maxTokens ?? config.parameters.max_tokens
  if (providerId === 'openai') {
    options.max_output_tokens = maxTokens
  } else {
    options.max_tokens = maxTokens
  }

  return options
}

// --- Server Function ---

export const searchAiFn = createServerFn({ method: 'POST' }).handler(
  async ({ data }: { data: unknown }) => {
    try {
      const { getActiveAiConfig, validateAiConfig } =
        await import('@/shared/lib/ai/server/config-store')
      const { detectBestProvider, getProvider, getProviderHeaders } =
        await import('@/shared/lib/ai/server/providers')

      const { query, providerId: requestedProviderId, model, params } = data as SearchRequestBody

      if (!query) {
        throw new Error('MISSING_QUERY')
      }

      const config = await getActiveAiConfig()
      const validation = validateAiConfig(config)

      if (!validation.valid) {
        throw new Error(`CONFIG_INVALID: ${validation.error}`)
      }

      const detection = await detectBestProvider()
      const providerId = requestedProviderId ?? config.provider ?? detection.provider ?? null

      if (!providerId) {
        throw new Error('NO_PROVIDER')
      }

      const provider = getProvider(providerId)
      if (!provider) {
        throw new Error('UNKNOWN_PROVIDER')
      }

      const adapter = provider.buildAdapter(config)(model ?? config.parameters.model)
      const formattedKnowledge = formatKnowledgeBase(appKnowledge)

      const systemPrompt = [
        'You are a helpful assistant for the "Acme Inc. Dashboard".',
        'Your goal is to help users find information within the application based on the provided knowledge base.',
        '',
        '### Knowledge Base',
        formattedKnowledge,
        '',
        '### Instructions',
        '1. Answer the user query based ONLY on the knowledge base provided above.',
        '2. Provide a concise summary.',
        '3. Use Markdown formatting (bold, lists, etc.) to make it readable.',
        '4. If the user asks about a page, include the URL in your response.',
        '5. Do NOT invent information that is not in the knowledge base.',
      ].join('\n')

      const apiKey = config.apiKey || config.token
      if (!apiKey && (providerId === 'openai' || providerId === 'anthropic')) {
        throw new Error(`MISSING_API_KEY_FOR_${providerId.toUpperCase()}`)
      }

      const baseUrl = normalizeBaseUrl(config.baseUrl)
      const headers = getProviderHeaders(config)

      const requestBody = {
        model: adapter.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query },
        ],
        ...buildProviderModelOptions(providerId, { query, params }, config),
      }

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`PROVIDER_ERROR: ${response.status} - ${errorText}`)
      }

      const result = await response.json()
      return { result, providerId }
    } catch (error) {
      console.error('AI Search Error:', error)
      throw error
    }
  },
)
