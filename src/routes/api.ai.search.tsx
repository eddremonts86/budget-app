import { chat } from '@tanstack/ai'
import { createFileRoute } from '@tanstack/react-router'
import type { AiProviderId } from '@/shared/lib/ai/ai-config'
import { getActiveAiConfig, validateAiConfig } from '@/shared/lib/ai/server/config-store'
import { detectBestProvider, getProvider } from '@/shared/lib/ai/server/providers'
import appKnowledge from '../../mocks/app-knowledge.json'

type SearchRequestBody = {
  query: string
  providerId?: AiProviderId
  model?: string
  params?: {
    temperature?: number
    maxTokens?: number
    topP?: number
  }
}

export const Route = createFileRoute('/api/ai/search')({
  component: () => null,
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const body = (await request.json()) as SearchRequestBody
          if (!body.query) {
            return new Response(JSON.stringify({ error: 'MISSING_QUERY' }), {
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
          const prompt = [
            'You are a helpful assistant for the "Acme Inc. Dashboard".',
            'Here is the application knowledge base:',
            JSON.stringify(appKnowledge, null, 2),
            '-------------------',
            `User Query: ${body.query}`,
            '-------------------',
            'Instructions:',
            '1. Answer the user query based on the knowledge base.',
            '2. Provide a concise summary.',
            '3. Use Markdown formatting (bold, lists, etc.) to make it readable.',
            '4. If the user asks about navigation, suggest where to go.',
            "5. If the information is not in the knowledge base, say you don't know but offer to search for general terms.",
          ].join('\n')
          const result = await chat({
            adapter,
            stream: false,
            messages: [
              {
                role: 'user',
                content: prompt,
              },
            ],
            modelOptions: {
              temperature: body.params?.temperature ?? config.parameters.temperature,
              max_tokens: body.params?.maxTokens ?? config.parameters.max_tokens,
              top_p: body.params?.topP ?? config.parameters.top_p,
              frequency_penalty: config.parameters.frequency_penalty,
              presence_penalty: config.parameters.presence_penalty,
            },
          })
          return new Response(JSON.stringify({ result, providerId }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
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
