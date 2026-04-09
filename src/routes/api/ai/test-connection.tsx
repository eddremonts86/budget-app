import { createFileRoute } from '@tanstack/react-router'
import type { AiConfigFormData } from '@/modules/ai/config'

export const Route = createFileRoute('/api/ai/test-connection')({
  component: () => null,
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { createJsonErrorResponse, createJsonResponse, testProviderConnection } =
            await import('@/modules/ai/server')

          const config = (await request.json()) as AiConfigFormData

          if (!config || !config.provider) {
            return createJsonErrorResponse('INVALID_CONFIG', 400)
          }

          return createJsonResponse(await testProviderConnection(config))
        } catch (error) {
          const { createJsonErrorResponse, getErrorMessage } = await import('@/modules/ai/server')
          return createJsonErrorResponse(getErrorMessage(error), 500, { success: false })
        }
      },
    },
  },
})
