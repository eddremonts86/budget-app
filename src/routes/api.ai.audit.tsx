import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/ai/audit')({
  component: () => null,
  server: {
    handlers: {
      GET: async () => {
        const { promises: fs } = await import('fs')
        const path = await import('path')

        try {
          const logPath = path.resolve(process.cwd(), 'src/server/data/audit-logs.json')
          const content = await fs.readFile(logPath, 'utf-8')
          const logs = JSON.parse(content)

          // Also read settings
          let settings = {}
          try {
            const settingsPath = path.resolve(process.cwd(), 'src/server/data/ai-settings.json')
            const settingsContent = await fs.readFile(settingsPath, 'utf-8')
            settings = JSON.parse(settingsContent)
          } catch {
            // ignore
          }

          return new Response(JSON.stringify({ logs, settings }), {
            headers: { 'Content-Type': 'application/json' },
          })
        } catch {
          return new Response(JSON.stringify({ logs: [], settings: {} }), {
            headers: { 'Content-Type': 'application/json' },
          })
        }
      },
      POST: async ({ request }: { request: Request }) => {
        const { promises: fs } = await import('fs')
        const path = await import('path')

        try {
          const body = await request.json()
          const settingsPath = path.resolve(process.cwd(), 'src/server/data/ai-settings.json')

          // Merge with existing
          let current = {}
          try {
            const content = await fs.readFile(settingsPath, 'utf-8')
            current = JSON.parse(content)
          } catch {
            // ignore
          }

          const updated = { ...current, ...body }
          await fs.writeFile(settingsPath, JSON.stringify(updated, null, 2))

          return new Response(JSON.stringify(updated), {
            headers: { 'Content-Type': 'application/json' },
          })
        } catch {
          return new Response(JSON.stringify({ error: 'Failed to save settings' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          })
        }
      },
    },
  },
})
