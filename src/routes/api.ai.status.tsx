import { createFileRoute } from '@tanstack/react-router'
import { listProviderStatuses } from '@/shared/lib/ai/server/providers'

export const Route = createFileRoute('/api/ai/status')({
  component: () => null,
  server: {
    handlers: {
      GET: async () => {
        try {
          const statuses = await listProviderStatuses()
          return new Response(JSON.stringify({ statuses }), {
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
