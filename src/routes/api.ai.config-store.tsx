import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/ai/config-store')({
  component: () => null,
  server: {
    handlers: {
      GET: async () => {
        const { promises: fs } = await import('fs')
        const path = await import('path')

        try {
          const configPath = path.resolve(process.cwd(), 'src/server/data/ai-config-store.json')
          const content = await fs.readFile(configPath, 'utf-8')
          const config = JSON.parse(content)

          return new Response(JSON.stringify(config), {
            headers: { 'Content-Type': 'application/json' },
          })
        } catch (error) {
          console.error('Failed to read ai-config-store:', error)
          return new Response(JSON.stringify({ activeProvider: 'lm-studio', providers: {} }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          })
        }
      },
      POST: async ({ request }: { request: Request }) => {
        const { promises: fs } = await import('fs')
        const path = await import('path')

        try {
          const body = await request.json()
          const configPath = path.resolve(process.cwd(), 'src/server/data/ai-config-store.json')

          await fs.writeFile(configPath, JSON.stringify(body, null, 2))

          return new Response(JSON.stringify(body), {
            headers: { 'Content-Type': 'application/json' },
          })
        } catch (error) {
          console.error('Failed to write ai-config-store:', error)
          return new Response(JSON.stringify({ error: 'Failed to save config' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          })
        }
      },
      PUT: async ({ request }: { request: Request }) => {
        // Handle PUT same as POST for compatibility
        const { promises: fs } = await import('fs')
        const path = await import('path')

        try {
          const body = await request.json()
          const configPath = path.resolve(process.cwd(), 'src/server/data/ai-config-store.json')

          await fs.writeFile(configPath, JSON.stringify(body, null, 2))

          return new Response(JSON.stringify(body), {
            headers: { 'Content-Type': 'application/json' },
          })
        } catch (error) {
          console.error('Failed to write ai-config-store:', error)
          return new Response(JSON.stringify({ error: 'Failed to save config' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          })
        }
      },
    },
  },
})
