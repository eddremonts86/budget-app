import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/ai/status')({
  component: () => null,
  server: {
    handlers: {
      GET: async () => {
        try {
          const { createJsonResponse, getProviderStatuses } = await import('@/modules/ai/server')
          const statuses = await getProviderStatuses()
          return createJsonResponse({ statuses })
        } catch (error) {
          const { createJsonErrorResponse, getErrorMessage } = await import('@/modules/ai/server')
          return createJsonErrorResponse(getErrorMessage(error), 500)
        }
      },
    },
  },
})
