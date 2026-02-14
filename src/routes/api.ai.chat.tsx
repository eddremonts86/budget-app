import { chat, toServerSentEventsResponse } from '@tanstack/ai'
import { createFileRoute } from '@tanstack/react-router'
import type { AiProviderId } from '@/shared/lib/ai/ai-config'
import { getActiveAiConfig, validateAiConfig } from '@/shared/lib/ai/server/config-store'
import { detectBestProvider, getProvider } from '@/shared/lib/ai/server/providers'

type ChatRequestBody = {
  messages: Array<{
    role: 'user' | 'assistant' | 'tool'
    content?: string
    parts?: Array<{ type: 'text'; content: string }>
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
              let content = ''
              if (typeof msg.content === 'string') {
                content = msg.content
              } else if (Array.isArray(msg.parts)) {
                content = msg.parts
                  .filter((p) => p.type === 'text')
                  .map((p) => p.content)
                  .join('\n')
              }

              return {
                role: msg.role,
                content,
              }
            })
            .filter((msg) => msg.content.length > 0)
          if (messages.length === 0) {
            return new Response(JSON.stringify({ error: 'MISSING_MESSAGES' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            })
          }

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
            return new Response(
              JSON.stringify({ error: 'NO_PROVIDER', statuses: detection.statuses }),
              {
                status: 503,
                headers: { 'Content-Type': 'application/json' },
              },
            )
          }
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
