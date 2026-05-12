import { createFileRoute } from '@tanstack/react-router'
import { eq, and } from 'drizzle-orm'
import { loadDb } from '@/shared/lib/db/load'
import { trackerProjects } from '@/shared/lib/db/schema'

export const Route = createFileRoute('/api/tracker/projects')({
  component: () => null,
  server: {
    handlers: {
      GET: async () => {
        const db = await loadDb()
        const projects = await db
          .select()
          .from(trackerProjects)
          .orderBy(trackerProjects.priority)
        return Response.json(projects)
      },
      POST: async ({ request }: { request: Request }) => {
        const body = await request.json().catch(() => null)
        if (!body || !body.slug || !body.title) {
          return Response.json({ error: 'slug and title are required' }, { status: 400 })
        }
        const db = await loadDb()
        const id = body.id ?? crypto.randomUUID()
        const [project] = await db
          .insert(trackerProjects)
          .values({
            id,
            slug: body.slug,
            title: body.title,
            description: body.description ?? null,
            status: body.status ?? 'active',
            priority: body.priority ?? 1,
            repo: body.repo ?? null,
            domain: body.domain ?? null,
          })
          .onConflictDoUpdate({
            target: trackerProjects.slug,
            set: {
              title: body.title,
              description: body.description ?? null,
              status: body.status ?? 'active',
              priority: body.priority ?? 1,
              repo: body.repo ?? null,
              domain: body.domain ?? null,
              updatedAt: new Date(),
            },
          })
          .returning()
        return Response.json(project, { status: 201 })
      },
    },
  },
})
