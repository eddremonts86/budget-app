import { formatKnowledgeBase, type SearchRequestBody } from '@/features/Ai/api/search.fn'
import appKnowledge from '@/server/data/app-knowledge.json'
import type { AiProviderId } from '@/shared/lib/ai/ai-config'
import { retrieveContext } from '@/shared/lib/rag/retrieval'
import { chat, toServerSentEventsResponse } from '@tanstack/ai'
import { createFileRoute } from '@tanstack/react-router'

const normalizeIncomingMessages = (query: string, systemPrompt: string): any[] => {
  const content = `${systemPrompt}\n\nQuery: ${query}`
  return [
    {
      role: 'user',
      content,
      parts: [{ type: 'text' as const, text: content }],
    },
  ]
}

const buildSystemPrompt = (ragContext: string = '') => {
  const formattedKnowledge = formatKnowledgeBase(appKnowledge)
  return [
    'You are a helpful assistant for the "Acme Inc. Dashboard".',
    'Your goal is to help users find information within the application based on the provided knowledge base.',
    '',
    '### Knowledge Base',
    formattedKnowledge,
    '',
    ragContext ? '### Retrieved Context (RAG)' : '',
    ragContext,
    '',
    '### Instructions',
    '1. Answer the user query based ONLY on the knowledge base provided above.',
    '2. Provide a concise summary.',
    '3. Use Markdown formatting (bold, lists, etc.) to make it readable.',
    '4. If the user asks about a page, include the URL in your response.',
    '5. Do NOT invent information that is not in the knowledge base.',
  ].join('\n')
}

export const handleSearchPost = async ({ request }: { request: Request }) => {
  try {
    const isE2E = process.env.VITE_E2E === 'true'

    const [
      { getActiveAiConfig, getAllAiConfigs, validateAiConfig },
      { detectBestProvider, getProvider, probeProvider },
    ] = await Promise.all([
      import('@/shared/lib/ai/server/config-store'),
      import('@/shared/lib/ai/server/providers'),
    ])

    const body = (await request.json()) as SearchRequestBody
    const query = body.query

    if (!query) {
      return new Response(JSON.stringify({ error: 'MISSING_QUERY' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (isE2E) {
      return new Response(
        JSON.stringify({
          id: 'e2e-search-mock',
          role: 'assistant',
          content: `E2E mock search result for: ${query}`,
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    const config = await getActiveAiConfig()
    const validation = validateAiConfig(config)

    // Fallback logic
    let providerId: AiProviderId | undefined = body.providerId ?? config.provider
    let finalConfig = config

    if (providerId) {
      // Check if the requested provider is actually available
      const allConfigs = await getAllAiConfigs()
      const targetConfig = allConfigs.providers[providerId]

      if (targetConfig) {
        const status = await probeProvider(targetConfig)
        if (!status.available) {
          console.warn(
            `[AI] Provider ${providerId} is unavailable (${status.message}). Attempting fallback...`,
          )
          providerId = undefined // Trigger fallback
        } else {
          finalConfig = targetConfig
        }
      }
    }

    if (!providerId) {
      const detection = await detectBestProvider()
      providerId = detection.provider ?? undefined

      if (providerId) {
        const allConfigs = await getAllAiConfigs()
        finalConfig = allConfigs.providers[providerId]
      }
    }

    if (!providerId) {
      return new Response(JSON.stringify({ error: 'NO_PROVIDER_AVAILABLE' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const provider = getProvider(providerId)
    if (!provider) {
      return new Response(JSON.stringify({ error: 'UNKNOWN_PROVIDER' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Retrieve RAG context
    let ragContext = ''
    try {
      ragContext = await retrieveContext(query)
    } catch (error) {
      console.warn('Failed to retrieve RAG context:', error)
    }

    const systemPrompt = buildSystemPrompt(ragContext)
    const messages = normalizeIncomingMessages(query, systemPrompt)

    const adapter = provider.buildAdapter(finalConfig)(body.model ?? finalConfig.parameters.model)

    // We reuse the buildProviderModelOptions helper but need to adapt it
    // because chat expects specific options format
    // For now, we'll manually construct basic options to ensure compatibility
    const maxTokens = body.params?.maxTokens ?? finalConfig.parameters.max_tokens
    const temperature = body.params?.temperature ?? finalConfig.parameters.temperature

    const modelOptions = {
      temperature,
      max_tokens: maxTokens,
      // Some providers use max_output_tokens
      ...(providerId === 'openai' ? { max_output_tokens: maxTokens } : {}),
      // Anthropic thinking
      ...(providerId === 'anthropic'
        ? {
            thinking: {
              type: 'enabled',
              budget_tokens: Math.floor((maxTokens ?? 2048) / 2),
            },
          }
        : {}),
    }

    const stream = chat({
      adapter,
      messages: messages as any,
      modelOptions,
    })

    return toServerSentEventsResponse(stream)
  } catch (error) {
    console.error('[AI Search Error]', error)
    const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export const Route = createFileRoute('/api/ai/search')({
  component: () => null,
  server: {
    handlers: {
      POST: handleSearchPost,
    },
  },
})
