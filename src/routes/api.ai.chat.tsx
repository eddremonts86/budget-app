import { promises as fs } from 'fs'
import path from 'path'
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
                const parts = msg.parts.map((p) => {
                  if (p.type === 'text') return { type: 'text' as const, text: p.content }
                  if (p.type === 'image') return { type: 'image' as const, image: p.image }
                  return { type: 'text' as const, text: '' }
                })

                return {
                  role,
                  content: msg.parts
                    .map((p) => {
                      if (p.type === 'text') return p.content
                      if (p.type === 'image') return `[Image Attached]`
                      return ''
                    })
                    .join('\n'),
                  parts,
                }
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
          let locale = url.searchParams.get('locale') || 'en-US'

          // Check for language override
          try {
            const settingsPath = path.resolve(process.cwd(), 'mocks/ai-settings.json')
            const content = await fs.readFile(settingsPath, 'utf-8')
            const settings = JSON.parse(content)
            if (settings.forceLocale) {
              locale = settings.forceLocale
            }
          } catch {
            // ignore
          }

          // Inject Mandatory Language System Prompt
          const systemPrompt = `You are a helpful AI assistant.

          Configuration:
          - Language: ${locale}
          - Current Time: ${new Date().toISOString()}

          Instructions:
          1. Respond ONLY in ${locale}.
          2. Use Markdown for formatting (bold, italics, code blocks).
          3. Be helpful and direct.`

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
            const dynamicContext = await injectDynamicContext(query)

            let contextBlock = ''
            if (ragContext || dynamicContext) {
              contextBlock = `\n\n--- TECHNICAL CONTEXT ---\n${ragContext}\n\n--- REAL-TIME DATA ---\n${dynamicContext}\n`
            }

            // Enhance the LAST user message directly instead of adding a new one
            // This is more robust for instruction-following models
            const newContent = contextBlock
              ? `Context:\n${contextBlock}\n\nQuestion:\n${query}`
              : query

            lastUserMessage.content = newContent

            // Also update parts if they exist to ensure consistency for adapters that prefer parts
            if (
              'parts' in lastUserMessage &&
              Array.isArray(lastUserMessage.parts) &&
              lastUserMessage.parts.length > 0 &&
              contextBlock // Only update parts if context was added
            ) {
              const textPart = lastUserMessage.parts.find((p) => p.type === 'text')
              if (textPart && 'text' in textPart) {
                textPart.text = newContent
              } else {
                // If no text part found (unlikely for a user message with content), add one
                lastUserMessage.parts.push({ type: 'text', text: newContent })
              }
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

          // Enable reasoning/thinking for compatible models if supported
          if (providerId === 'anthropic' || providerId === 'lm-studio') {
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
