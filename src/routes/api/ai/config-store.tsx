import { createFileRoute } from '@tanstack/react-router'
import {
  createAiConfigReadErrorPayload,
  createJsonErrorResponse,
  createJsonResponse,
  getErrorMessage,
  readPersistedAiConfigOrEmpty,
  writePersistedAiConfig,
} from '@/modules/ai/server'

async function handleConfigStoreWrite(request: Request): Promise<Response> {
  try {
    const body = await request.json()
    return createJsonResponse(await writePersistedAiConfig(body))
  } catch (error) {
    return createJsonErrorResponse('Failed to save config', 500, {
      details: getErrorMessage(error),
    })
  }
}

export const Route = createFileRoute('/api/ai/config-store')({
  component: () => null,
  server: {
    handlers: {
      GET: async () => {
        try {
          return createJsonResponse(await readPersistedAiConfigOrEmpty())
        } catch (error) {
          return createJsonResponse(createAiConfigReadErrorPayload(error), 500)
        }
      },
      POST: async ({ request }: { request: Request }) => handleConfigStoreWrite(request),
      PUT: async ({ request }: { request: Request }) => handleConfigStoreWrite(request),
    },
  },
})
