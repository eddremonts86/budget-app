import { createFileRoute } from '@tanstack/react-router'
import type { AiProviderId } from '@/modules/ai/config'
import { buildChatSystemPrompt, resolveLanguageName } from '@/modules/ai/prompts'
import type { ChatMessages } from '@/modules/ai/server'
import {
  consolidateChatMessages,
  createAiChatResponse,
  createJsonErrorResponse,
  createJsonResponse,
  findLastUserQuery,
  getErrorDetails,
  injectReferenceContext,
  isDashboardDomainQuery,
  normalizeIncomingChatMessages,
  resolveProviderRuntime,
  streamLmStudioChat,
  streamOllamaChat,
} from '@/modules/ai/server'
import type { IncomingChatMessage } from '@/modules/ai/server/chat-messages'

const DEFAULT_OLLAMA_CHAT_MODEL = process.env.AI_CHAT_OLLAMA_MODEL || 'qwen3.5:0.8b'

type ChatRequestBody = {
  messages: IncomingChatMessage[]
  conversationId?: string
  providerId?: AiProviderId
  model?: string
  params?: {
    temperature?: number
    maxTokens?: number
    topP?: number
  }
}

export const handleChatPost = async ({ request }: { request: Request }) => {
  try {
    const isE2E = process.env.VITE_E2E === 'true'

    const [{ logAudit }] = await Promise.all([import('@/modules/ai/audit')])

    const body = (await request.json()) as ChatRequestBody
    const rawMessages = Array.isArray(body.messages) ? body.messages : []

    const messages = normalizeIncomingChatMessages(rawMessages)
    if (messages.length === 0) {
      return createJsonErrorResponse('MISSING_MESSAGES', 400)
    }

    if (isE2E) {
      return createJsonResponse({
        id: 'e2e-chat-mock',
        role: 'assistant',
        content: 'E2E mock response',
      })
    }

    const url = new URL(request.url)
    const locale = url.searchParams.get('locale') || 'en-US'

    const lastUserQuery = findLastUserQuery(messages)
    const isDashboardQuery = await isDashboardDomainQuery(lastUserQuery)
    const systemPrompt = buildChatSystemPrompt(
      resolveLanguageName(locale),
      isDashboardQuery ? 'dashboard' : 'general',
    )

    messages.unshift({
      role: 'system',
      content: systemPrompt,
    })

    const providerRuntime = await resolveProviderRuntime({
      requestedProviderId: body.providerId,
      requestedModel: body.model,
      autoModelFallback: DEFAULT_OLLAMA_CHAT_MODEL,
    })
    if (!providerRuntime.ok) {
      return providerRuntime.response
    }

    const {
      runtime: { config: finalConfig, provider, providerId, resolvedModel },
    } = providerRuntime

    const contextualQuery = await injectReferenceContext(messages, locale)

    const consolidatedMessages = consolidateChatMessages(messages)

    logAudit({
      timestamp: new Date().toISOString(),
      locale,
      query: contextualQuery ? `${String(contextualQuery).slice(0, 50)}...` : 'No content',
      providerId: providerId || 'unknown',
      model: resolvedModel ?? 'unknown',
      contextLength: 0,
    }).catch(() => undefined)

    if (providerId === 'ollama') {
      return await streamOllamaChat({
        config: finalConfig,
        params: body.params,
        messages: consolidatedMessages,
        resolvedModel,
      })
    }

    if (providerId === 'lm-studio') {
      return await streamLmStudioChat({
        config: finalConfig,
        params: body.params,
        messages: consolidatedMessages,
        resolvedModel,
      })
    }

    return createAiChatResponse({
      provider,
      config: finalConfig,
      providerId,
      resolvedModel,
      messages: consolidatedMessages as ChatMessages,
      conversationId: body.conversationId,
      params: body.params,
    })
  } catch (error) {
    const { message, stack } = getErrorDetails(error)
    return createJsonErrorResponse(message, 500, { stack })
  }
}

export const Route = createFileRoute('/api/ai/chat')({
  component: () => null,
  server: {
    handlers: {
      POST: handleChatPost,
    },
  },
})
