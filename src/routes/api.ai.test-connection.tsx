import { createFileRoute } from '@tanstack/react-router'
import type { AiConfigFormData } from '@/features/Settings/model/ai-config.schema'
import { probeProvider } from '@/shared/lib/ai/server/providers'

export const Route = createFileRoute('/api/ai/test-connection')({
  component: () => null,
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const config = (await request.json()) as AiConfigFormData
          
          // Basic validation
          if (!config || !config.provider) {
             return new Response(JSON.stringify({ error: 'INVALID_CONFIG' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            })
          }

          const status = await probeProvider(config)
          
          // If status is 'available' or 'auth_required', we consider it a successful connection
          // (auth_required means we reached the server, even if the key is wrong/missing, 
          // which is better than 'unreachable')
          // However, for a "Test Connection" button, the user probably wants to know if the key works too.
          // But probeProvider returns 'auth_required' for 401/403.
          // If the user provides a key, we should expect 'available'.
          
          const success = status.status === 'available' || 
                          (status.status === 'auth_required' && !config.apiKey && !config.token)

          return new Response(JSON.stringify({ 
            success, 
            status 
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        } catch (error) {
          const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR'
          return new Response(JSON.stringify({ error: message, success: false }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          })
        }
      },
    },
  },
})
