import { createServerFn } from '@tanstack/react-start'
import { desc, eq, count } from 'drizzle-orm'
import { z } from 'zod'
// import { db } from '@/shared/lib/db'
import { users } from '@/shared/lib/db/schema'
import type { User } from '../model/types'

export const userSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['admin', 'user']).default('user'),
  avatar: z.string().nullable().optional(),
})

export type UserInput = z.infer<typeof userSchema>

export const getUsersFn = createServerFn({ method: 'GET' }).handler(
  async ({ data }: { data?: { pageParam?: number; limit?: number } }) => {
    if (process.env.VITE_E2E === 'true') {
      return {
        data: Array.from({ length: 5 }).map((_, i) => ({
          id: i.toString(),
          name: `User ${i}`,
          email: `user${i}@example.com`,
          role: 'user' as const,
          avatar: null,
          createdAt: new Date().toISOString(),
        })),
        nextPage: undefined,
        totalCount: 5,
      }
    }

    try {
      console.log('getUsersFn: Starting...')
      const { getDb } = await import('@/shared/lib/db')
      const db = getDb()
      const { pageParam, limit: limitParam } = data || {}
      const page = pageParam || 1
      const limit = limitParam || 10
      const offset = (page - 1) * limit

      const [items, totalResult] = await Promise.all([
        db.select().from(users).limit(limit).offset(offset).orderBy(desc(users.createdAt)),
        db.select({ count: count() }).from(users),
      ])

      const total = totalResult[0]?.count ?? 0

      console.log(`getUsersFn: Found ${items.length} users, total ${total}`)

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
    } catch (error) {
      console.error('Error in getUsersFn:', error)
      throw error
    }
  },
)

export const getUserByIdFn = createServerFn({ method: 'GET' }).handler(
  async ({ data: id }: { data: unknown }) => {
    if (process.env.VITE_E2E === 'true') {
      return {
        id: (id as string) || '1',
        name: 'User 1',
        email: 'user1@example.com',
        role: 'user' as const,
        avatar: null,
        createdAt: new Date().toISOString(),
      }
    }

    const { getDb } = await import('@/shared/lib/db')
    const db = getDb()
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, id as string))
    if (!result.length) return null
    const item = result[0]
    return {
      ...item,
      createdAt: item.createdAt.toISOString(),
    }
  },
) as unknown as (opts: { data: string }) => Promise<User | null>

export const getUserByEmailFn = createServerFn({ method: 'GET' }).handler(
  async ({ data: email }: { data: unknown }) => {
    if (process.env.VITE_E2E === 'true') {
      return {
        id: '1',
        name: 'User 1',
        email: (email as string) || 'user1@example.com',
        role: 'user' as const,
        avatar: null,
        createdAt: new Date().toISOString(),
      }
    }

    const { getDb } = await import('@/shared/lib/db')
    const db = getDb()
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email as string))
    if (!result.length) return null
    const item = result[0]
    return {
      ...item,
      createdAt: item.createdAt.toISOString(),
    }
  },
) as unknown as (opts: { data: string }) => Promise<User | null>

export const createUserFn = createServerFn({ method: 'POST' }).handler(
  async ({ data }: { data: unknown }) => {
    if (process.env.VITE_E2E === 'true') {
      const input = data as UserInput
      return {
        id: crypto.randomUUID(),
        name: input.name,
        email: input.email,
        role: input.role || 'user',
        avatar: input.avatar,
        createdAt: new Date().toISOString(),
      }
    }

    const { getDb } = await import('@/shared/lib/db')
    const db = getDb()
    // Manual validation
    const parsed = userSchema.safeParse(data)
    if (!parsed.success) {
      throw new Error(`Invalid input: ${parsed.error.message}`)
    }
    const input = parsed.data

    const [newItem] = await db
      .insert(users)
      .values({
        id: input.id || crypto.randomUUID(),
        name: input.name,
        email: input.email,
        role: input.role,
        avatar: input.avatar,
      })
      .returning()

    return {
      ...newItem,
      createdAt: newItem.createdAt.toISOString(),
    }
  },
) as unknown as (opts: { data: z.infer<typeof userSchema> }) => Promise<User>

export const updateUserFn = createServerFn({ method: 'POST' }).handler(
  async ({ data }: { data: unknown }) => {
    if (process.env.VITE_E2E === 'true') {
      const { id, data: updateData } = data as {
        id: string
        data: Partial<UserInput>
      }
      return {
        id,
        name: updateData.name || 'User 1',
        email: updateData.email || 'user1@example.com',
        role: updateData.role || 'user',
        avatar: updateData.avatar || null,
        createdAt: new Date().toISOString(),
      }
    }

    const { getDb } = await import('@/shared/lib/db')
    const db = getDb()
    const { id, data: updateData } = data as {
      id: string
      data: Partial<z.infer<typeof userSchema>>
    }

    const [updatedItem] = await db
      .update(users)
      .set({
        ...updateData,
      })
      .where(eq(users.id, id))
      .returning()

    return {
      ...updatedItem,
      createdAt: updatedItem.createdAt.toISOString(),
    }
  },
) as unknown as (opts: {
  data: { id: string; data: Partial<z.infer<typeof userSchema>> }
}) => Promise<User>

export const deleteUserFn = createServerFn({ method: 'POST' }).handler(
  async ({ data: id }: { data: unknown }) => {
    if (process.env.VITE_E2E === 'true') {
      return { success: true }
    }

    const { getDb } = await import('@/shared/lib/db')
    const db = getDb()
    await db.delete(users).where(eq(users.id, id as string))
    return { success: true }
  },
) as unknown as (opts: { data: string }) => Promise<{ success: boolean }>

export const upsertUserFn = createServerFn({ method: 'POST' }).handler(
  async ({ data }: { data: unknown }) => {
    if (process.env.VITE_E2E === 'true') {
      const input = data as UserInput & { id: string }
      return {
        id: input.id,
        name: input.name,
        email: input.email,
        role: (input.role as 'admin' | 'user') || 'user',
        avatar: input.avatar,
        createdAt: new Date().toISOString(),
      }
    }

    const { getDb } = await import('@/shared/lib/db')
    const db = getDb()
    const input = data as UserInput & { id: string }

    const [upserted] = await db
      .insert(users)
      .values({
        id: input.id,
        name: input.name,
        email: input.email,
        role: input.role as 'admin' | 'user',
        avatar: input.avatar,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          name: input.name,
          email: input.email,
          avatar: input.avatar,
          // role is intentionally omitted to preserve existing role
        },
      })
      .returning()

    return {
      ...upserted,
      createdAt: upserted.createdAt.toISOString(),
    }
  },
) as unknown as (opts: { data: UserInput & { id: string } }) => Promise<User>
