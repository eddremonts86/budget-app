import { createFileRoute } from '@tanstack/react-router'

async function handleConfigStoreWrite(request: Request): Promise<Response> {
  try {
    const { createJsonResponse, writePersistedAiConfig } = await import('@/modules/ai/server')
    const body = await request.json()
    return createJsonResponse(await writePersistedAiConfig(body))
  } catch (error) {
    const { createJsonErrorResponse, getErrorMessage } = await import('@/modules/ai/server')
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
          const { createJsonResponse, readPersistedAiConfigOrEmpty } =
            await import('@/modules/ai/server')
          return createJsonResponse(await readPersistedAiConfigOrEmpty())
        } catch (error) {
          const { createAiConfigReadErrorPayload, createJsonResponse } =
            await import('@/modules/ai/server')
          return createJsonResponse(createAiConfigReadErrorPayload(error), 500)
        }
      },
      POST: async ({ request }: { request: Request }) => handleConfigStoreWrite(request),
      PUT: async ({ request }: { request: Request }) => handleConfigStoreWrite(request),
    },
  },
})
