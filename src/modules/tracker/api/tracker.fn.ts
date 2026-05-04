import { createServerFn } from '@tanstack/react-start'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'
import { loadDb } from '@/shared/lib/db/load'
import { trackerProjects, trackerTasks } from '@/shared/lib/db/schema'

// --- Schemas ---

const trackerProjectSchema = z.object({
  id: z.string().optional(),
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['active', 'archived']).optional().default('active'),
  priority: z.number().int().min(1).max(5).optional().default(1),
  repo: z.string().optional(),
  domain: z.string().optional(),
})

const trackerTaskSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'done', 'cancelled']).optional().default('todo'),
  assignee: z.enum(['openCode', 'openClaw', 'human']).optional().default('openCode'),
  priority: z.number().int().min(1).max(5).optional().default(3),
  phase: z.string().optional(),
  dependsOn: z.array(z.string()).optional(),
})

// --- Project Server Functions ---

export const listTrackerProjects = createServerFn({ method: 'GET' }).handler(async () => {
  const db = await loadDb()
  return db.select().from(trackerProjects).orderBy(trackerProjects.priority)
})

export const createTrackerProject = createServerFn({ method: 'POST' })
  .inputValidator(trackerProjectSchema)
  .handler(async ({ data }) => {
    const db = await loadDb()
    const id = data.id ?? crypto.randomUUID()
    const [project] = await db
      .insert(trackerProjects)
      .values({
        id,
        slug: data.slug,
        title: data.title,
        description: data.description ?? null,
        status: data.status,
        priority: data.priority,
        repo: data.repo ?? null,
        domain: data.domain ?? null,
      })
      .onConflictDoUpdate({
        target: trackerProjects.slug,
        set: {
          title: data.title,
          description: data.description ?? null,
          status: data.status,
          priority: data.priority,
          repo: data.repo ?? null,
          domain: data.domain ?? null,
          updatedAt: new Date(),
        },
      })
      .returning()
    return project
  })

export const getTrackerProjectBySlug = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ slug: z.string() }))
  .handler(async ({ data }) => {
    const db = await loadDb()
    const [project] = await db
      .select()
      .from(trackerProjects)
      .where(eq(trackerProjects.slug, data.slug))
      .limit(1)
    return project ?? null
  })

// --- Task Server Functions ---

export const listTrackerTasks = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      projectId: z.string().optional(),
      status: z.enum(['todo', 'in_progress', 'done', 'cancelled']).optional(),
      assignee: z.enum(['openCode', 'openClaw', 'human']).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const db = await loadDb()
    const conditions = []
    if (data.projectId) conditions.push(eq(trackerTasks.projectId, data.projectId))
    if (data.status) conditions.push(eq(trackerTasks.status, data.status))
    if (data.assignee) conditions.push(eq(trackerTasks.assignee, data.assignee))

    return db
      .select()
      .from(trackerTasks)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(trackerTasks.priority)
  })

export const createTrackerTask = createServerFn({ method: 'POST' })
  .inputValidator(trackerTaskSchema)
  .handler(async ({ data }) => {
    const db = await loadDb()
    const [task] = await db
      .insert(trackerTasks)
      .values({
        id: data.id,
        projectId: data.projectId,
        title: data.title,
        description: data.description ?? null,
        status: data.status,
        assignee: data.assignee,
        priority: data.priority,
        phase: data.phase ?? null,
        dependsOn: data.dependsOn ?? [],
      })
      .onConflictDoUpdate({
        target: trackerTasks.id,
        set: {
          title: data.title,
          description: data.description ?? null,
          status: data.status,
          assignee: data.assignee,
          priority: data.priority,
          phase: data.phase ?? null,
          dependsOn: data.dependsOn ?? [],
          updatedAt: new Date(),
        },
      })
      .returning()
    return task
  })

export const updateTrackerTaskStatus = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      id: z.string(),
      status: z.enum(['todo', 'in_progress', 'done', 'cancelled']),
    }),
  )
  .handler(async ({ data }) => {
    const db = await loadDb()
    const [updated] = await db
      .update(trackerTasks)
      .set({ status: data.status, updatedAt: new Date() })
      .where(eq(trackerTasks.id, data.id))
      .returning()
    return updated
  })
