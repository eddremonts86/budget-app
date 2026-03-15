import { createFileRoute } from '@tanstack/react-router'
import {
  createJsonErrorResponse,
  createJsonResponse,
  readAuditData,
  writeAuditSettings,
} from '@/ai/server'

export const Route = createFileRoute('/api/ai/audit')({
  component: () => null,
  server: {
    handlers: {
      GET: async () => {
        return createJsonResponse(await readAuditData())
      },
      POST: async ({ request }: { request: Request }) => {
        try {
          const body = (await request.json()) as Record<string, unknown>
          const updated = await writeAuditSettings(body)
          return createJsonResponse(updated)
        } catch {
          return createJsonErrorResponse('Failed to save settings', 500)
        }
      },
    },
  },
})
