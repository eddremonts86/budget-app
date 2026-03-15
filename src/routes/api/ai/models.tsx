import { createFileRoute } from '@tanstack/react-router'
import type { AiConfigFormData } from '@/modules/ai/config'
import {
  createJsonErrorResponse,
  createJsonResponse,
  discoverConfiguredProviderModels,
  discoverModelsFromConfig,
  getErrorMessage,
} from '@/modules/ai/server'

export const Route = createFileRoute('/api/ai/models')({
  component: () => null,
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url)
          const provider = url.searchParams.get('provider')
          const result = await discoverConfiguredProviderModels(provider)

          return createJsonResponse(result)
        } catch (error) {
          return createJsonErrorResponse(getErrorMessage(error), 500)
        }
      },
      POST: async ({ request }) => {
        try {
          const config = (await request.json()) as AiConfigFormData
          const result = await discoverModelsFromConfig(config)

          return createJsonResponse(result)
        } catch (error) {
          return createJsonErrorResponse(getErrorMessage(error), 500)
        }
      },
    },
  },
})
