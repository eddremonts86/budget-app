import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/ai/audit')({
  component: () => null,
  server: {
    handlers: {
      GET: async () => {
        const { createJsonResponse, readAuditData } = await import('@/modules/ai/server')
        return createJsonResponse(await readAuditData())
      },
      POST: async ({ request }: { request: Request }) => {
        try {
          const { createJsonResponse, writeAuditSettings } = await import('@/modules/ai/server')
          const body = (await request.json()) as Record<string, unknown>
          const updated = await writeAuditSettings(body)
          return createJsonResponse(updated)
        } catch {
          const { createJsonErrorResponse } = await import('@/modules/ai/server')
          return createJsonErrorResponse('Failed to save settings', 500)
        }
      },
    },
  },
})
