import { createFileRoute } from '@tanstack/react-router'
import { eq } from 'drizzle-orm'
import { loadDb } from '@/shared/lib/db/index'
import { trackerTasks } from '@/shared/lib/db/schema'

export const Route = createFileRoute('/api/tracker/tasks/$taskId/status')({
  component: () => null,
  server: {
    handlers: {
      PATCH: async ({ request, params }: { request: Request; params: { taskId: string } }) => {
        const body = await request.json().catch(() => null)
        if (!body || !body.status) {
          return Response.json({ error: 'status is required' }, { status: 400 })
        }
        const validStatuses = ['todo', 'in_progress', 'done', 'cancelled']
        if (!validStatuses.includes(body.status)) {
          return Response.json(
            { error: `status must be one of: ${validStatuses.join(', ')}` },
            { status: 400 },
          )
        }
        const db = await loadDb()
        const [task] = await db
          .update(trackerTasks)
          .set({
            status: body.status as 'todo' | 'in_progress' | 'done' | 'cancelled',
            updatedAt: new Date(),
          })
          .where(eq(trackerTasks.id, params.taskId))
          .returning()
        if (!task) {
          return Response.json({ error: 'task not found' }, { status: 404 })
        }
        return Response.json(task)
      },
    },
  },
})
