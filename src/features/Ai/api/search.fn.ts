import type { AiConfigFormData } from '@/features/Settings/model/ai-config.schema'
import appKnowledge from '@/server/data/app-knowledge.json'
import type { AiProviderId } from '@/shared/lib/ai/ai-config'

// --- Helpers ---

export function formatKnowledgeBase(knowledge: typeof appKnowledge): string {
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

export const buildProviderModelOptions = (
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
