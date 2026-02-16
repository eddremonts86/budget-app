import { chat, toServerSentEventsResponse } from '@tanstack/ai'
import { createFileRoute } from '@tanstack/react-router'
import type { AiProviderId } from '@/shared/lib/ai/ai-config'
import { logAudit } from '@/shared/lib/ai/audit'
import { getActiveAiConfig, validateAiConfig } from '@/shared/lib/ai/server/config-store'
import { detectBestProvider, getProvider } from '@/shared/lib/ai/server/providers'
import { injectDynamicContext } from '@/shared/lib/rag/context'
import { retrieveContext } from '@/shared/lib/rag/retrieval'

type ChatRequestBody = {
  messages: Array<{
    role: 'user' | 'assistant' | 'tool' | 'system'
    content?: string
    parts?: Array<
      | { type: 'text'; content: string }
      | { type: 'image'; image: string }
      | { type: 'thinking'; content: string }
    >
  }>
  conversationId?: string
  providerId?: AiProviderId
  model?: string
  params?: {
    temperature?: number
    maxTokens?: number
    topP?: number
  }
}

export const Route = createFileRoute('/api/ai/chat')({
  component: () => null,
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const body = (await request.json()) as ChatRequestBody
          const rawMessages = Array.isArray(body.messages) ? body.messages : []

          const messages = rawMessages
            .map((msg) => {
              const role = (msg.role === 'system' ? 'user' : msg.role) as
                | 'user'
                | 'assistant'
                | 'tool'

              if (Array.isArray(msg.parts)) {
                const hasMultimodal = msg.parts.some((p) => p.type === 'image')

                const content = msg.parts
                  .map((p) => {
                    if (p.type === 'text') return p.content
                    if (p.type === 'image') return `[Image Attached]`
                    return ''
                  })
                  .join('\n')

                // Only include parts for multimodal messages (with images).
                // Text-only messages should use plain string content to avoid
                // compatibility issues with smaller models that don't handle
                // the multimodal content array format well.
                if (hasMultimodal) {
                  const parts = msg.parts.map((p) => {
                    if (p.type === 'text') return { type: 'text' as const, text: p.content }
                    if (p.type === 'image') return { type: 'image' as const, image: p.image }
                    return { type: 'text' as const, text: '' }
                  })
                  return { role, content, parts }
                }

                return { role, content }
              }

              return {
                role,
                content: msg.content || '',
              }
            })
            .filter(
              (msg) =>
                (msg.content?.length ?? 0) > 0 ||
                ('parts' in msg && Array.isArray(msg.parts) && msg.parts.length > 0),
            )
          if (messages.length === 0) {
            return new Response(JSON.stringify({ error: 'MISSING_MESSAGES' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            })
          }

          const url = new URL(request.url)
          const locale = url.searchParams.get('locale') || 'en-US'

          // Resolve locale code to a full language name for clearer LLM instructions
          const localeToLanguage: Record<string, string> = {
            en: 'English',
            'en-US': 'English',
            'en-GB': 'English',
            es: 'Spanish',
            'es-ES': 'Spanish',
            'es-MX': 'Spanish',
            dk: 'Danish',
            'da-DK': 'Danish',
          }
          const languageName =
            localeToLanguage[locale] || localeToLanguage[locale.split('-')[0]] || 'English'

          // Inject Mandatory Language System Prompt
          const systemPrompt = [
            `You are a helpful, knowledgeable AI assistant for the "Acme Inc." dashboard application.`,
            `You have access to application data (users, tasks, transactions, categories) and know the app's navigation structure.`,
            ``,
            `RULES:`,
            `1. LANGUAGE: Always respond in ${languageName}.`,
            `2. Answer the question the user asked. Do NOT say "no question was provided" or give generic greetings.`,
            `3. When application data is provided as context, use it to give specific answers with numbers.`,
            `4. When referring to app sections, ALWAYS include the URL path (e.g., /dashboard/todos, /dashboard/users).`,
            `5. When listing items, be specific with counts, names and details from the provided data.`,
            `6. Use Markdown for formatting when helpful.`,
          ].join('\n')

          // Ensure system message is first
          messages.unshift({
            role: 'system',
            content: systemPrompt,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any)

          const config = await getActiveAiConfig()
          const validation = validateAiConfig(config)

          if (!validation.valid) {
            return new Response(
              JSON.stringify({
                error: 'CONFIG_INVALID',
                message: validation.error,
                provider: config.provider,
              }),
              {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
              },
            )
          }

          const detection = await detectBestProvider()
          const providerId = body.providerId ?? config.provider ?? detection.provider ?? null

          if (!providerId) {
            return new Response(JSON.stringify({ error: 'NO_PROVIDER_CONFIGURED' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            })
          }

          // RAG & Context Injection
          const lastUserMessage = messages
            .slice()
            .reverse()
            .find((m) => m.role === 'user')

          if (lastUserMessage && typeof lastUserMessage.content === 'string') {
            const query = lastUserMessage.content

            // Retrieve RAG Context
            const ragContext = await retrieveContext(query)

            // Inject Dynamic Context
            const dynamicContext = await injectDynamicContext(query, locale)

            // Inject context as a separate system message BEFORE the user message
            // instead of modifying the user message (which confuses smaller models)
            if (ragContext || dynamicContext) {
              const contextParts: string[] = []
              if (ragContext) contextParts.push(`Documentation:\n${ragContext}`)
              if (dynamicContext) contextParts.push(`Application Data:\n${dynamicContext}`)

              const contextMessage = {
                role: 'system' as const,
                content: `Use the following reference information to answer the user's question accurately. Base your answer on this data when relevant:\n\n${contextParts.join('\n\n')}`,
              }

              // Insert context message right before the last user message
              const lastUserIdx = messages.lastIndexOf(lastUserMessage)
              messages.splice(lastUserIdx, 0, contextMessage as (typeof messages)[0])
            }
          }

          // Audit Log
          logAudit({
            timestamp: new Date().toISOString(),
            locale,
            query: lastUserMessage?.content
              ? `${String(lastUserMessage.content).slice(0, 50)}...`
              : 'No content',
            providerId: providerId || 'unknown',
            model: body.model ?? config.parameters.model ?? 'unknown',
            contextLength: 0,
            // eslint-disable-next-line no-console
          }).catch((err) => console.error('Audit log failed:', err))

          const provider = getProvider(providerId)
          if (!provider) {
            return new Response(JSON.stringify({ error: 'UNKNOWN_PROVIDER' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            })
          }

          const adapter = provider.buildAdapter(config)(body.model ?? config.parameters.model)

          interface ExtendedModelOptions {
            temperature?: number
            max_tokens?: number
            top_p?: number
            frequency_penalty?: number
            presence_penalty?: number
            thinking?: {
              type: 'enabled'
              budget_tokens: number
            }
          }

          const modelOptions: ExtendedModelOptions = {
            temperature: body.params?.temperature ?? config.parameters.temperature,
            max_tokens: body.params?.maxTokens ?? config.parameters.max_tokens,
            top_p: body.params?.topP ?? config.parameters.top_p,
            frequency_penalty: config.parameters.frequency_penalty,
            presence_penalty: config.parameters.presence_penalty,
          }

          // Enable reasoning/thinking only for Anthropic models that support it
          // LM Studio uses the OpenAI-compatible API and does NOT support thinking mode
          if (providerId === 'anthropic') {
            modelOptions.thinking = {
              type: 'enabled',
              budget_tokens: Math.floor((modelOptions.max_tokens ?? 2048) / 2),
            }
          }

          const stream = chat({
            adapter,
            messages,
            conversationId: body.conversationId,
            modelOptions: modelOptions as Parameters<typeof chat>[0]['modelOptions'],
          })
          return toServerSentEventsResponse(stream)
        } catch (error) {
          const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR'
          return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          })
        }
      },
    },
  },
})
