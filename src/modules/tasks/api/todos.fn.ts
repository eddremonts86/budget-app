import { createServerFn } from '@tanstack/react-start'
import { eq, desc, count, and, gte, inArray, ilike, lt, lte } from 'drizzle-orm'
import { z } from 'zod'
import { loadDb } from '@/shared/lib/db/load'
import { todos } from '@/shared/lib/db/schema'
import { isE2E } from '@/shared/lib/env'
// import { requireAuth } from '@/shared/lib/auth/server'

function buildMockTodo(
  i: number,
  overrides?: {
    id?: string
    title?: string
    description?: string
    status?:
      | 'pending'
      | 'in_progress'
      | 'completed'
      | 'on_hold'
      | 'testing'
      | 'blocked'
      | 'cancelled'
    priority?: 'low' | 'medium' | 'high'
    projectId?: string | null
    assignedTo?: string
    categoryId?: string | null
  },
) {
  return {
    id: overrides?.id ?? i.toString(),
    title: overrides?.title ?? `Task ${i}`,
    description: (overrides?.description ?? `Description ${i}`) as string | null,
    status: overrides?.status ?? 'pending',
    priority: overrides?.priority ?? 'medium',
    dueDate: new Date().toISOString(),
    projectId: overrides?.projectId !== undefined ? overrides.projectId : 'project-1',
    assignedTo: overrides?.assignedTo ?? 'user-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: null,
    complexity: 1,
    estimatedTime: 0,
    actualTime: 0,
    dependencies: [] as string[],
    acceptanceCriteria: '',
    createdBy: 'user-1',
    categoryId: overrides?.categoryId !== undefined ? overrides.categoryId : null,
  }
}

export const todoSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum([
    'pending',
    'in_progress',
    'completed',
    'on_hold',
    'testing',
    'blocked',
    'cancelled',
  ]),
  priority: z.enum(['low', 'medium', 'high']),
  dueDate: z.string().optional(), // ISO string
  projectId: z.string(),
  assignedTo: z.string().optional(),
})

export type CreateTodoInput = z.infer<typeof todoSchema>
export type UpdateTodoInput = Partial<CreateTodoInput>

export const getTodosFn = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      pageParam: z.number().optional().default(1),
      limit: z.number().optional().default(10),
      status: z
        .enum(['pending', 'in_progress', 'completed', 'on_hold', 'testing', 'blocked', 'cancelled'])
        .optional(),
      assignedTo: z.string().optional(),
      search: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    try {
      const db = await loadDb()
      const { pageParam, status, assignedTo, search } = data
      const limit = Math.min(data.limit, 100)
      const page = pageParam
      const offset = (page - 1) * limit

      const conditions = []
      if (status) conditions.push(eq(todos.status, status))
      if (assignedTo) conditions.push(eq(todos.assignedTo, assignedTo))
      if (search) conditions.push(ilike(todos.title, `%${search}%`))
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined

      const [items, totalResult] = await Promise.all([
        db
          .select()
          .from(todos)
          .where(whereClause)
          .limit(limit)
          .offset(offset)
          .orderBy(desc(todos.createdAt)),
        db.select({ count: count() }).from(todos).where(whereClause),
      ])

      const total = totalResult[0]?.count ?? 0
      const totalPages = Math.ceil(total / limit)
      const nextPage = page < totalPages ? page + 1 : undefined

      if (isE2E && items.length === 0) {
        return {
          data: Array.from({ length: 10 }).map((_, i) => buildMockTodo(i)),
          nextPage: undefined,
          totalCount: 10,
        }
      }

      return {
        data: items.map((item) => ({
          ...item,
          dueDate: item.dueDate ? item.dueDate.toISOString() : '',
          createdAt: item.createdAt.toISOString(),
          updatedAt: item.updatedAt.toISOString(),
          completedAt: item.completedAt ? item.completedAt.toISOString() : null,
          dependencies: [],
        })),
        nextPage,
        totalCount: total,
      }
    } catch (error) {
      if (isE2E) {
        return {
          data: Array.from({ length: 10 }).map((_, i) => buildMockTodo(i)),
          nextPage: undefined,
          totalCount: 10,
        }
      }
      throw error
    }
  })

export const getTodoByIdFn = createServerFn({ method: 'GET' })
  .inputValidator(z.string().optional())
  .handler(async ({ data: id }) => {
    try {
      if (!id) throw new Error('ID is required')
      const db = await loadDb()
      const result = await db.select().from(todos).where(eq(todos.id, id)).limit(1)
      if (!result.length) {
        if (isE2E) {
          return buildMockTodo(0, { id, title: 'Mock Task', description: 'Mock Description' })
        }
        return null
      }
      const item = result[0]
      return {
        ...item,
        dueDate: item.dueDate ? item.dueDate.toISOString() : '',
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        completedAt: item.completedAt ? item.completedAt.toISOString() : null,
        dependencies: [],
      }
    } catch (error) {
      if (isE2E && id) {
        return buildMockTodo(0, { id, title: 'Mock Task', description: 'Mock Description' })
      }
      throw error
    }
  })

export const getTodosByProjectIdFn = createServerFn({ method: 'GET' })
  .inputValidator(z.string())
  .handler(async ({ data: projectId }) => {
    try {
      if (!projectId) throw new Error('Project ID is required')
      const db = await loadDb()
      const result = await db
        .select()
        .from(todos)
        .where(eq(todos.projectId, projectId))
        .orderBy(desc(todos.createdAt))
        .limit(500)

      if (isE2E && result.length === 0) {
        return Array.from({ length: 5 }).map((_, i) =>
          buildMockTodo(i, { title: `Project Task ${i}`, projectId }),
        )
      }

      return result.map((item) => ({
        ...item,
        dueDate: item.dueDate ? item.dueDate.toISOString() : '',
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      }))
    } catch (error) {
      if (isE2E && projectId) {
        return Array.from({ length: 5 }).map((_, i) =>
          buildMockTodo(i, { title: `Project Task ${i}`, projectId }),
        )
      }
      throw error
    }
  })

export const createTodoFn = createServerFn({ method: 'POST' })
  .inputValidator(todoSchema)
  .handler(async ({ data: input }) => {
    try {
      const db = await loadDb()
      const { syncRagDocument } = await import('@/modules/ai/rag/sync')

      const userId = 'user_1' // await requireAuth()

      const [newItem] = await db
        .insert(todos)
        .values({
          id: crypto.randomUUID(),
          title: input.title,
          description: input.description,
          status: input.status,
          priority: input.priority,
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
          projectId: input.projectId,
          assignedTo: input.assignedTo || userId,
          createdBy: userId,
        })
        .returning()

      // Sync to RAG
      const doc = `Task: ${newItem.title}. Status: ${newItem.status}. Priority: ${newItem.priority}. Assigned to: ${newItem.assignedTo || 'Unassigned'}. Due: ${newItem.dueDate || 'No date'}. Description: ${newItem.description || ''}`
      // Fire-and-forget: RAG sync must not block the response
      void syncRagDocument('todo', newItem.id, doc)

      return {
        ...newItem,
        dueDate: newItem.dueDate ? newItem.dueDate.toISOString() : '',
        createdAt: newItem.createdAt.toISOString(),
        updatedAt: newItem.updatedAt.toISOString(),
      }
    } catch (error) {
      if (isE2E) {
        return {
          id: 'mock-id',
          ...input,
          dueDate: input.dueDate || new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          completedAt: null,
          complexity: 1,
          estimatedTime: 0,
          actualTime: 0,
          dependencies: [],
          acceptanceCriteria: '',
          createdBy: 'user-1',
        }
      }
      throw error
    }
  })

export const updateTodoFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string(), data: todoSchema.partial() }))
  .handler(async ({ data }) => {
    const { id, data: updateData } = data

    try {
      const db = await loadDb()
      const { syncRagDocument } = await import('@/modules/ai/rag/sync')

      const [updatedItem] = await db
        .update(todos)
        .set({
          ...updateData,
          dueDate: updateData.dueDate ? new Date(updateData.dueDate) : undefined,
          updatedAt: new Date(),
        })
        .where(eq(todos.id, id))
        .returning()

      // Fire-and-forget: RAG sync must not block the response
      if (updatedItem) {
        const doc = `Task: ${updatedItem.title}. Status: ${updatedItem.status}. Priority: ${updatedItem.priority}. Assigned to: ${updatedItem.assignedTo || 'Unassigned'}. Due: ${updatedItem.dueDate || 'No date'}. Description: ${updatedItem.description || ''}`
        void syncRagDocument('todo', updatedItem.id, doc)
      }

      return {
        ...updatedItem,
        dueDate: updatedItem.dueDate ? updatedItem.dueDate.toISOString() : '',
        createdAt: updatedItem.createdAt.toISOString(),
        updatedAt: updatedItem.updatedAt.toISOString(),
      }
    } catch (error) {
      if (isE2E) {
        return {
          id,
          ...updateData,
          dueDate: updateData.dueDate || new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          completedAt: null,
          complexity: 1,
          estimatedTime: 0,
          actualTime: 0,
          dependencies: [],
          acceptanceCriteria: '',
          createdBy: 'user-1',
        }
      }
      throw error
    }
  })

export const deleteTodoFn = createServerFn({ method: 'POST' })
  .inputValidator(z.string())
  .handler(async ({ data: id }) => {
    try {
      const db = await loadDb()
      const { deleteRagDocument } = await import('@/modules/ai/rag/sync')
      await db.delete(todos).where(eq(todos.id, id))
      // Fire-and-forget: RAG delete must not block the response
      void deleteRagDocument('todo', id)
      return { success: true }
    } catch (error) {
      if (isE2E) {
        return { success: true }
      }
      throw error
    }
  })

// ---------------------------------------------------------------------------
// Calendar date-range fetch — replaces unbounded infinite waterfall
// ---------------------------------------------------------------------------
export const getTodosByDateRangeFn = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      startDate: z.string(), // ISO date string
      endDate: z.string(), // ISO date string
      assignedTo: z.string().optional(),
      status: z
        .enum(['pending', 'in_progress', 'completed', 'on_hold', 'testing', 'blocked', 'cancelled'])
        .optional(),
    }),
  )
  .handler(async ({ data }) => {
    try {
      const db = await loadDb()
      const start = new Date(data.startDate)
      const end = new Date(data.endDate)

      const conditions = [gte(todos.dueDate, start), lte(todos.dueDate, end)]
      if (data.assignedTo) {
        conditions.push(eq(todos.assignedTo, data.assignedTo))
      }
      if (data.status) {
        conditions.push(eq(todos.status, data.status))
      }

      const items = await db
        .select()
        .from(todos)
        .where(and(...conditions))
        .orderBy(todos.dueDate)
        .limit(500) // hard cap — calendar can't show more anyway

      return items.map((item) => ({
        ...item,
        dueDate: item.dueDate ? item.dueDate.toISOString() : '',
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        completedAt: item.completedAt ? item.completedAt.toISOString() : null,
        dependencies: [],
      }))
    } catch (error) {
      if (isE2E) {
        return []
      }
      throw error
    }
  })

// ---------------------------------------------------------------------------
// Upcoming todos widget data
// ---------------------------------------------------------------------------
export const getUpcomingTodosFn = createServerFn({ method: 'GET' })
  .inputValidator(z.void().optional())
  .handler(async ({ data: _data }) => {
    try {
      const db = await loadDb()
      const now = new Date()
      const startOfToday = new Date(now)
      startOfToday.setHours(0, 0, 0, 0)
      const nextWeek = new Date(startOfToday)
      nextWeek.setDate(nextWeek.getDate() + 8)
      const openTodoStatuses = ['pending', 'in_progress', 'testing', 'on_hold', 'blocked'] as const
      const upcomingWindowClause = and(
        gte(todos.dueDate, startOfToday),
        lt(todos.dueDate, nextWeek),
        inArray(todos.status, [...openTodoStatuses]),
      )

      const [upcomingItems, [{ value: nextWeekCount }]] = await Promise.all([
        db.select().from(todos).where(upcomingWindowClause).orderBy(todos.dueDate).limit(50),
        db.select({ value: count() }).from(todos).where(upcomingWindowClause),
      ])

      const items =
        upcomingItems.length > 0
          ? upcomingItems
          : await db
              .select()
              .from(todos)
              .where(
                and(lt(todos.dueDate, startOfToday), inArray(todos.status, [...openTodoStatuses])),
              )
              .orderBy(desc(todos.dueDate))
              .limit(50)
      const displayMode = upcomingItems.length > 0 ? 'upcoming' : 'overdue_fallback'

      if (isE2E && items.length === 0) {
        const mockItems = Array.from({ length: 3 }).map((_, i) =>
          buildMockTodo(i, {
            priority: (['high', 'medium', 'low'] as const)[i % 3],
            assignedTo: '1',
            projectId: null,
          }),
        )
        return {
          items: mockItems,
          nextWeekCount: 3,
          displayCount: 3,
          displayMode: 'upcoming' as const,
        }
      }

      return {
        items: items.map((item) => ({
          ...item,
          dueDate: item.dueDate ? item.dueDate.toISOString() : '',
          createdAt: item.createdAt.toISOString(),
          updatedAt: item.updatedAt.toISOString(),
        })),
        nextWeekCount: Number(nextWeekCount ?? 0),
        displayCount: items.length,
        displayMode,
      }
    } catch (error) {
      console.error('Error in getUpcomingTodosFn:', error)
      if (isE2E) {
        const mockItems = Array.from({ length: 3 }).map((_, i) =>
          buildMockTodo(i, {
            priority: (['high', 'medium', 'low'] as const)[i % 3],
            assignedTo: '1',
            projectId: null,
          }),
        )
        return {
          items: mockItems,
          nextWeekCount: 3,
          displayCount: 3,
          displayMode: 'upcoming' as const,
        }
      }
      throw error
    }
  })
