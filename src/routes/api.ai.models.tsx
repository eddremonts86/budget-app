import { createFileRoute } from '@tanstack/react-router'
import type { AiConfigFormData } from '@/features/Settings/model/ai-config.schema'
import { discoverProviderModels } from '@/shared/lib/ai/server/model-discovery'

export const Route = createFileRoute('/api/ai/models')({
  component: () => null,
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url)
          const provider = url.searchParams.get('provider')

          const { getAllAiConfigs } = await import('@/shared/lib/ai/server/config-store')
          const store = await getAllAiConfigs()
          const targetProvider =
            provider && provider in store.providers
              ? (provider as keyof typeof store.providers)
              : store.activeProvider
          const result = await discoverProviderModels(store.providers[targetProvider])

          return new Response(JSON.stringify(result), {
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
      POST: async ({ request }) => {
        try {
          const config = (await request.json()) as AiConfigFormData
          const result = await discoverProviderModels(config)

          return new Response(JSON.stringify(result), {
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
