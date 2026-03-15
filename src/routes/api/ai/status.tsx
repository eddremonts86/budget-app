import { createFileRoute } from '@tanstack/react-router'
import {
  createJsonErrorResponse,
  createJsonResponse,
  getErrorMessage,
  getProviderStatuses,
} from '@/modules/ai/server'

export const Route = createFileRoute('/api/ai/status')({
  component: () => null,
  server: {
    handlers: {
      GET: async () => {
        try {
          const statuses = await getProviderStatuses()
          return createJsonResponse({ statuses })
        } catch (error) {
          return createJsonErrorResponse(getErrorMessage(error), 500)
        }
      },
    },
  },
})
