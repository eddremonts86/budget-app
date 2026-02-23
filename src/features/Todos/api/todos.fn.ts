import { createServerFn } from '@tanstack/react-start'
import { eq, desc, count } from 'drizzle-orm'
import { z } from 'zod'
// import { requireAuth } from '@/shared/lib/auth/server'
import { todos } from '@/shared/lib/db/schema'
import type { Todo } from '../model/types'

export const todoSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'completed']),
  priority: z.enum(['low', 'medium', 'high']),
  dueDate: z.string().optional(), // ISO string
  projectId: z.string(),
  assignedTo: z.string().optional(),
})

export type CreateTodoInput = z.infer<typeof todoSchema>
export type UpdateTodoInput = Partial<CreateTodoInput>

export const getTodosFn = createServerFn({ method: 'GET' }).handler(
  async ({ data }: { data?: { pageParam?: number; limit?: number } }) => {
    if (process.env.VITE_E2E === 'true') {
      return {
        data: Array.from({ length: 10 }).map((_, i) => ({
          id: i.toString(),
          title: `Task ${i}`,
          description: `Description ${i}`,
          status: 'pending' as const,
          priority: 'medium' as const,
          dueDate: new Date().toISOString(),
          projectId: 'project-1',
          assignedTo: 'user-1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          completedAt: null,
          complexity: 1,
          estimatedTime: 0,
          actualTime: 0,
          dependencies: [],
          acceptanceCriteria: '',
          createdBy: 'user-1',
        })),
        nextPage: undefined,
        totalCount: 10,
      }
    }

    try {
      const { getDb } = await import('@/shared/lib/db')
      const db = getDb()
      // await requireAuth() // Uncomment when auth is ready
      const { pageParam, limit: limitParam } = data || {}
      const page = pageParam || 1
      const limit = limitParam || 10
      const offset = (page - 1) * limit

      const [items, totalResult] = await Promise.all([
        db.select().from(todos).limit(limit).offset(offset).orderBy(desc(todos.createdAt)),
        db.select({ count: count() }).from(todos),
      ])

      const total = totalResult[0]?.count ?? 0

      const totalPages = Math.ceil(total / limit)
      const nextPage = page < totalPages ? page + 1 : undefined

      return {
        data: items.map((item) => ({
          ...item,
          dueDate: item.dueDate ? item.dueDate.toISOString() : '',
          createdAt: item.createdAt.toISOString(),
          updatedAt: item.updatedAt.toISOString(),
        })),
        nextPage,
        totalCount: total,
      }
    } catch (error) {
      console.error('Error in getTodosFn:', error)
      return {
        data: [],
        nextPage: undefined,
        totalCount: 0,
      }
    }
  },
)

export const getTodoByIdFn = createServerFn({ method: 'GET' }).handler(
  async ({ data: id }: { data: string | undefined }) => {
    if (process.env.VITE_E2E === 'true') {
      if (!id) return null
      return {
        id,
        title: 'Mock Task',
        description: 'Mock Description',
        status: 'pending' as const,
        priority: 'medium' as const,
        dueDate: new Date().toISOString(),
        projectId: 'project-1',
        assignedTo: 'user-1',
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

    try {
      if (!id) throw new Error('ID is required')
      const { getDb } = await import('@/shared/lib/db')
      const db = getDb()
      // await requireAuth()
      const result = await db.select().from(todos).where(eq(todos.id, id))
      if (!result.length) return null
      const item = result[0]
      return {
        ...item,
        dueDate: item.dueDate ? item.dueDate.toISOString() : '',
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      }
    } catch (error) {
      console.error('Error in getTodoByIdFn:', error)
      return null
    }
  },
)

export const getTodosByProjectIdFn = createServerFn({ method: 'GET' }).handler(
  async ({ data: projectId }: { data: string | undefined }) => {
    if (process.env.VITE_E2E === 'true') {
      return Array.from({ length: 5 }).map((_, i) => ({
        id: i.toString(),
        title: `Project Task ${i}`,
        description: `Description ${i}`,
        status: 'pending' as const,
        priority: 'medium' as const,
        dueDate: new Date().toISOString(),
        projectId: projectId || 'project-1',
        assignedTo: 'user-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: null,
        complexity: 1,
        estimatedTime: 0,
        actualTime: 0,
        dependencies: [],
        acceptanceCriteria: '',
        createdBy: 'user-1',
      }))
    }

    try {
      if (!projectId) throw new Error('Project ID is required')
      const { getDb } = await import('@/shared/lib/db')
      const db = getDb()
      // await requireAuth()
      const result = await db.select().from(todos).where(eq(todos.projectId, projectId))
      return result.map((item) => ({
        ...item,
        dueDate: item.dueDate ? item.dueDate.toISOString() : '',
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      }))
    } catch (error) {
      console.error('Error in getTodosByProjectIdFn:', error)
      return []
    }
  },
)

export const createTodoFn = createServerFn({ method: 'POST' }).handler(
  async ({ data }: { data: unknown }) => {
    if (process.env.VITE_E2E === 'true') {
      const input = data as any
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

    try {
      const { getDb } = await import('@/shared/lib/db')
      const db = getDb()
      const { syncRagDocument } = await import('@/shared/lib/rag/sync')
      // Manual validation
      const parsed = todoSchema.safeParse(data)
      if (!parsed.success) {
        throw new Error(`Invalid input: ${parsed.error.message}`)
      }
      const input = parsed.data

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
      await syncRagDocument('todo', newItem.id, doc)

      return {
        ...newItem,
        dueDate: newItem.dueDate ? newItem.dueDate.toISOString() : '',
        createdAt: newItem.createdAt.toISOString(),
        updatedAt: newItem.updatedAt.toISOString(),
      }
    } catch (error) {
      console.error('Error in createTodoFn:', error)
      throw error
    }
  },
)

export const updateTodoFn = createServerFn({ method: 'POST' }).handler(
  async ({ data }: { data: unknown }) => {
    if (process.env.VITE_E2E === 'true') {
      const { id, data: updateData } = data as any
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

    try {
      const { getDb } = await import('@/shared/lib/db')
      const db = getDb()
      const { syncRagDocument } = await import('@/shared/lib/rag/sync')
      const { id, data: updateData } = data as {
        id: string
        data: Partial<z.infer<typeof todoSchema>>
      }

      const [updatedItem] = await db
        .update(todos)
        .set({
          ...updateData,
          dueDate: updateData.dueDate ? new Date(updateData.dueDate) : undefined,
          updatedAt: new Date(),
        })
        .where(eq(todos.id, id))
        .returning()

      // Sync to RAG
      if (updatedItem) {
        const doc = `Task: ${updatedItem.title}. Status: ${updatedItem.status}. Priority: ${updatedItem.priority}. Assigned to: ${updatedItem.assignedTo || 'Unassigned'}. Due: ${updatedItem.dueDate || 'No date'}. Description: ${updatedItem.description || ''}`
        await syncRagDocument('todo', updatedItem.id, doc)
      }

      return {
        ...updatedItem,
        dueDate: updatedItem.dueDate ? updatedItem.dueDate.toISOString() : '',
        createdAt: updatedItem.createdAt.toISOString(),
        updatedAt: updatedItem.updatedAt.toISOString(),
      }
    } catch (error) {
      console.error('Error in updateTodoFn:', error)
      throw error
    }
  },
)

export const deleteTodoFn = createServerFn({ method: 'POST' }).handler(
  async ({ data: id }: { data: string | undefined }) => {
    if (process.env.VITE_E2E === 'true') {
      return { success: true }
    }

    try {
      if (!id) throw new Error('ID is required')
      const { getDb } = await import('@/shared/lib/db')
      const db = getDb()
      const { deleteRagDocument } = await import('@/shared/lib/rag/sync')
      await db.delete(todos).where(eq(todos.id, id))
      await deleteRagDocument('todo', id)
      return { success: true }
    } catch (error) {
      console.error('Error in deleteTodoFn:', error)
      throw error
    }
  },
)
