// @ts-nocheck
import { createServerFn } from '@tanstack/react-start'
import { eq, desc, ilike } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/shared/lib/db'
import { users } from '@/shared/lib/db/schema'
import { syncRagDocument, deleteRagDocument } from '@/shared/lib/rag/sync'

const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['admin', 'user']),
  avatar: z.string().optional(),
})

export const getUsersFn = createServerFn({ method: 'GET' })
  .validator((d: { pageParam?: number; limit?: number; search?: string } = {}) => d)
  .handler(async ({ data }) => {
    const page = data.pageParam || 1
    const limit = data.limit || 10
    const offset = (page - 1) * limit
    const search = data.search

    const whereClause = search ? ilike(users.name, `%${search}%`) : undefined

    const [items, total] = await Promise.all([
      db
        .select()
        .from(users)
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(users.createdAt)),
      db.$count(users, whereClause),
    ])

    const totalPages = Math.ceil(total / limit)
    const nextPage = page < totalPages ? page + 1 : undefined

    return {
      data: items.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
      })),
      nextPage,
      totalCount: total,
    }
  })

export const getUserByIdFn = createServerFn({ method: 'GET' })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    const result = await db.select().from(users).where(eq(users.id, id))
    if (!result.length) return null
    const item = result[0]
    return {
      ...item,
      createdAt: item.createdAt.toISOString(),
    }
  })

export const createUserFn = createServerFn({ method: 'POST' })
  .validator(userSchema)
  .handler(async ({ data }) => {
    const [newItem] = await db
      .insert(users)
      .values({
        id: crypto.randomUUID(),
        ...data,
      })
      .returning()

    // Sync to RAG
    const doc = `User: ${newItem.name} (${newItem.email}). Role: ${newItem.role}. ID: ${newItem.id}`
    await syncRagDocument('user', newItem.id, doc)

    return {
      ...newItem,
      createdAt: newItem.createdAt.toISOString(),
    }
  })

export const updateUserFn = createServerFn({ method: 'POST' })
  .validator((d: { id: string; data: Partial<z.infer<typeof userSchema>> }) => d)
  .handler(async ({ data }) => {
    const { id, data: updateData } = data

    const [updatedItem] = await db.update(users).set(updateData).where(eq(users.id, id)).returning()

    if (!updatedItem) throw new Error('User not found')

    // Sync to RAG
    const doc = `User: ${updatedItem.name} (${updatedItem.email}). Role: ${updatedItem.role}. ID: ${updatedItem.id}`
    await syncRagDocument('user', updatedItem.id, doc)

    return {
      ...updatedItem,
      createdAt: updatedItem.createdAt.toISOString(),
    }
  })

export const deleteUserFn = createServerFn({ method: 'POST' })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    await db.delete(users).where(eq(users.id, id))
    return { success: true }
  })
