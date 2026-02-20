// @ts-nocheck
import { createServerFn } from '@tanstack/react-start'
import { eq, desc, and } from 'drizzle-orm'
import { z } from 'zod'
import { requireAuth } from '@/shared/lib/auth/server'
import { db } from '@/shared/lib/db'
import { todos } from '@/shared/lib/db/schema'
import { syncRagDocument, deleteRagDocument } from '@/shared/lib/rag/sync'

const todoSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'completed']),
  priority: z.enum(['low', 'medium', 'high']),
  dueDate: z.string().optional(), // ISO string
  projectId: z.string(),
  assignedTo: z.string().optional(),
})

export const getTodosFn = createServerFn({ method: 'GET' })
  .validator((d: { pageParam?: number; limit?: number } = {}) => d)
  .handler(async ({ data }) => {
    // await requireAuth() // Uncomment when auth is ready
    const page = data.pageParam || 1
    const limit = data.limit || 10
    const offset = (page - 1) * limit

    const [items, total] = await Promise.all([
      db.select().from(todos).limit(limit).offset(offset).orderBy(desc(todos.createdAt)),
      db.$count(todos),
    ])

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
  })

export const getTodoByIdFn = createServerFn({ method: 'GET' })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
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
  })

export const createTodoFn = createServerFn({ method: 'POST' })
  .validator(todoSchema)
  .handler(async ({ data }) => {
    const userId = 'user_1' // await requireAuth()

    const [newItem] = await db
      .insert(todos)
      .values({
        id: crypto.randomUUID(),
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        projectId: data.projectId,
        assignedTo: data.assignedTo || userId,
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
  })

export const updateTodoFn = createServerFn({ method: 'POST' })
  .validator((d: { id: string; data: Partial<z.infer<typeof todoSchema>> }) => d)
  .handler(async ({ data }) => {
    // await requireAuth()
    const { id, data: updateData } = data

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
    const doc = `Task: ${updatedItem.title}. Status: ${updatedItem.status}. Priority: ${updatedItem.priority}. Assigned to: ${updatedItem.assignedTo || 'Unassigned'}. Due: ${updatedItem.dueDate || 'No date'}. Description: ${updatedItem.description || ''}`
    await syncRagDocument('todo', updatedItem.id, doc)

    return {
      ...updatedItem,
      dueDate: updatedItem.dueDate ? updatedItem.dueDate.toISOString() : '',
      createdAt: updatedItem.createdAt.toISOString(),
      updatedAt: updatedItem.updatedAt.toISOString(),
    }
  })

export const deleteTodoFn = createServerFn({ method: 'POST' })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    // await requireAuth()
    await db.delete(todos).where(eq(todos.id, id))
    
    // Remove from RAG
    await deleteRagDocument('todo', id)
    
    return { success: true }
  })
