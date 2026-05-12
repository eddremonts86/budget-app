import { createFileRoute } from '@tanstack/react-router'
import { eq, and } from 'drizzle-orm'
import { loadDb } from '@/shared/lib/db/load'
import { trackerTasks } from '@/shared/lib/db/schema'

export const Route = createFileRoute('/api/tracker/tasks')({
  component: () => null,
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const url = new URL(request.url)
        const projectId = url.searchParams.get('projectId') ?? undefined
        const status = url.searchParams.get('status') ?? undefined
        const assignee = url.searchParams.get('assignee') ?? undefined

        const db = await loadDb()
        const conditions = []
        if (projectId) conditions.push(eq(trackerTasks.projectId, projectId))
        if (status)
          conditions.push(
            eq(
              trackerTasks.status,
              status as 'todo' | 'in_progress' | 'done' | 'cancelled',
            ),
          )
        if (assignee)
          conditions.push(
            eq(
              trackerTasks.assignee,
              assignee as 'openCode' | 'openClaw' | 'human',
            ),
          )

        const tasks = await db
          .select()
          .from(trackerTasks)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(trackerTasks.priority)
        return Response.json(tasks)
      },
      POST: async ({ request }: { request: Request }) => {
        const body = await request.json().catch(() => null)
        if (!body || !body.projectId || !body.title) {
          return Response.json({ error: 'projectId and title are required' }, { status: 400 })
        }
        const db = await loadDb()
        const id = body.id ?? crypto.randomUUID()
        const [task] = await db
          .insert(trackerTasks)
          .values({
            id,
            projectId: body.projectId,
            title: body.title,
            description: body.description ?? null,
            status: body.status ?? 'todo',
            assignee: body.assignee ?? 'openCode',
            priority: body.priority ?? 3,
            phase: body.phase ?? null,
            dependsOn: body.dependsOn ?? [],
          })
          .onConflictDoUpdate({
            target: trackerTasks.id,
            set: {
              title: body.title,
              description: body.description ?? null,
              status: body.status ?? 'todo',
              assignee: body.assignee ?? 'openCode',
              priority: body.priority ?? 3,
              phase: body.phase ?? null,
              dependsOn: body.dependsOn ?? [],
              updatedAt: new Date(),
            },
          })
          .returning()
        return Response.json(task, { status: 201 })
      },
    },
  },
})
