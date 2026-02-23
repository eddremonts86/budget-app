import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/ai/config-store')({
  component: () => null,
  server: {
    handlers: {
      GET: async () => {
        try {
          console.log('[ConfigStore] GET request received')
          const { readAiConfig } = await import('@/server/utils/ai-config-helper')

          try {
            const config = await readAiConfig()
            return new Response(JSON.stringify(config), {
              headers: { 'Content-Type': 'application/json' },
            })
          } catch (readError) {
             console.error('[ConfigStore] File read error:', readError)
             // Fallback
             return new Response(JSON.stringify({ activeProvider: 'llama-cpp', providers: {} }), {
               headers: { 'Content-Type': 'application/json' },
             })
          }
        } catch (error) {
          console.error('Failed to read ai-config-store:', error)
          const errorMessage = error instanceof Error ? error.message : String(error)
          const errorStack = error instanceof Error ? error.stack : ''
          return new Response(JSON.stringify({
            activeProvider: 'lm-studio',
            providers: {},
            _debug_error: errorMessage,
            _debug_stack: errorStack
          }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          })
        }
      },
      POST: async ({ request }: { request: Request }) => {
        try {
          const { writeAiConfig } = await import('@/server/utils/ai-config-helper')
          const body = await request.json()
          await writeAiConfig(body)

          return new Response(JSON.stringify(body), {
            headers: { 'Content-Type': 'application/json' },
          })
        } catch (error) {
          console.error('Failed to write ai-config-store:', error)
          const errorMessage = error instanceof Error ? error.message : String(error)
          return new Response(JSON.stringify({ error: 'Failed to save config', details: errorMessage }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          })
        }
      },
      PUT: async ({ request }: { request: Request }) => {
        // Handle PUT same as POST for compatibility
        try {
          const { writeAiConfig } = await import('@/server/utils/ai-config-helper')
          const body = await request.json()
          await writeAiConfig(body)

          return new Response(JSON.stringify(body), {
            headers: { 'Content-Type': 'application/json' },
          })
        } catch (error) {
          console.error('Failed to write ai-config-store:', error)
          const errorMessage = error instanceof Error ? error.message : String(error)
          return new Response(JSON.stringify({ error: 'Failed to save config', details: errorMessage }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          })
        }
      },
    },
  },
})
