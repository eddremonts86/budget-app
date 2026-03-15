import { createFileRoute } from '@tanstack/react-router'
import type { AiConfigFormData } from '@/modules/ai/config'

export const Route = createFileRoute('/api/ai/models')({
  component: () => null,
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const { createJsonResponse, discoverConfiguredProviderModels } =
            await import('@/modules/ai/server')
          const url = new URL(request.url)
          const provider = url.searchParams.get('provider')
          const result = await discoverConfiguredProviderModels(provider)

          return createJsonResponse(result)
        } catch (error) {
          const { createJsonErrorResponse, getErrorMessage } = await import('@/modules/ai/server')
          return createJsonErrorResponse(getErrorMessage(error), 500)
        }
      },
      POST: async ({ request }) => {
        try {
          const { createJsonResponse, discoverModelsFromConfig } =
            await import('@/modules/ai/server')
          const config = (await request.json()) as AiConfigFormData
          const result = await discoverModelsFromConfig(config)

          return createJsonResponse(result)
        } catch (error) {
          const { createJsonErrorResponse, getErrorMessage } = await import('@/modules/ai/server')
          return createJsonErrorResponse(getErrorMessage(error), 500)
        }
      },
    },
  },
})
