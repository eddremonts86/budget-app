import { createFileRoute } from '@tanstack/react-router'
import type { SearchRequestBody } from '@/modules/ai'
import { buildSearchSystemPrompt, normalizeSearchMessages } from '@/modules/ai/prompts'
import { retrieveContext } from '@/modules/ai/rag/retrieval'
import {
  createAiChatResponse,
  createJsonErrorResponse,
  createJsonResponse,
  getErrorMessage,
  resolveProviderRuntime,
  streamLmStudioChat,
  streamOllamaChat,
} from '@/modules/ai/server'
import type { ChatMessages } from '@/modules/ai/server'
import { isE2E } from '@/shared/lib/env'

const DEFAULT_OLLAMA_SEARCH_MODEL = process.env.AI_OLLAMA_MODEL || 'qwen3.5:0.8b'

export const handleSearchPost = async ({ request }: { request: Request }) => {
  try {
    const body = (await request.json()) as SearchRequestBody
    const query = body.query

    if (!query) {
      return createJsonErrorResponse('MISSING_QUERY', 400)
    }

    if (isE2E) {
      return createJsonResponse({
        id: 'e2e-search-mock',
        role: 'assistant',
        content: `E2E mock search result for: ${query}`,
      })
    }

    const providerRuntime = await resolveProviderRuntime({
      requestedProviderId: body.providerId,
      requestedModel: body.model,
      autoModelFallback: DEFAULT_OLLAMA_SEARCH_MODEL,
    })
    if (!providerRuntime.ok) {
      return providerRuntime.response
    }

    const {
      runtime: { config: finalConfig, provider, providerId, resolvedModel },
    } = providerRuntime

    let ragContext = ''
    try {
      ragContext = await retrieveContext(query)
    } catch {
      ragContext = ''
    }

    const systemPrompt = buildSearchSystemPrompt(ragContext)
    const messages = normalizeSearchMessages(query, systemPrompt)

    if (providerId === 'ollama') {
      return await streamOllamaChat({
        config: finalConfig,
        params: body.params,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        messages: messages as any,
        resolvedModel,
      })
    }

    if (providerId === 'lm-studio') {
      return await streamLmStudioChat({
        config: finalConfig,
        params: body.params,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        messages: messages as any,
        resolvedModel,
      })
    }

    return createAiChatResponse({
      provider,
      config: finalConfig,
      providerId,
      resolvedModel,
      messages: messages as unknown as ChatMessages,
      params: body.params,
    })
  } catch (error) {
    return createJsonErrorResponse(getErrorMessage(error), 500)
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
