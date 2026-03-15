import { createFileRoute } from '@tanstack/react-router'
import type { AiConfigFormData } from '@/modules/ai/config'
import {
  createJsonErrorResponse,
  createJsonResponse,
  getErrorMessage,
  testProviderConnection,
} from '@/modules/ai/server'

export const Route = createFileRoute('/api/ai/test-connection')({
  component: () => null,
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const config = (await request.json()) as AiConfigFormData

          if (!config || !config.provider) {
            return createJsonErrorResponse('INVALID_CONFIG', 400)
          }

          return createJsonResponse(await testProviderConnection(config))
        } catch (error) {
          return createJsonErrorResponse(getErrorMessage(error), 500, { success: false })
        }
      },
    },
  },
})
