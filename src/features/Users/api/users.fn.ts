import { createServerFn } from '@tanstack/react-start'
import { desc, eq, count } from 'drizzle-orm'
import { z } from 'zod'
// import { db } from '@/shared/lib/db'
import { users, departments } from '@/shared/lib/db/schema'

export const userSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['admin', 'user']).default('user'),
  avatar: z.string().nullable().optional(),
  jobTitle: z.string().nullable().optional(),
  departmentId: z.string().nullable().optional(),
  reportsTo: z.string().nullable().optional(),
})

export type UserInput = z.infer<typeof userSchema>

export const getUsersFn = createServerFn({ method: 'GET' })
  .inputValidator(
    z
      .object({
        pageParam: z.number().optional(),
        limit: z.number().optional(),
      })
      .optional(),
  )
  .handler(async ({ data }) => {
    if (process.env.VITE_E2E === 'true') {
      return {
        data: Array.from({ length: 5 }).map((_, i) => ({
          id: i.toString(),
          name: `User ${i}`,
          email: `user${i}@example.com`,
          role: 'user' as const,
          avatar: null,
          jobTitle: 'Developer',
          departmentId: '1',
          departmentName: 'Engineering',
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
        db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
            role: users.role,
            avatar: users.avatar,
            jobTitle: users.jobTitle,
            departmentId: users.departmentId,
            departmentName: departments.name,
            reportsTo: users.reportsTo,
            createdAt: users.createdAt,
          })
          .from(users)
          .leftJoin(departments, eq(users.departmentId, departments.id))
          .limit(limit)
          .offset(offset)
          .orderBy(desc(users.createdAt)),
        db.select({ count: count() }).from(users),
      ])

      const total = totalResult[0]?.count ?? 0

      console.log(`getUsersFn: Found ${items.length} users, total ${total}`)

      const totalPages = Math.ceil(total / limit)
      const nextPage = page < totalPages ? page + 1 : undefined

      return {
        data: items.map((item) => ({
          ...item,
          createdAt:
            item.createdAt instanceof Date
              ? item.createdAt.toISOString()
              : new Date().toISOString(),
        })),
        nextPage,
        totalCount: total,
      }
    } catch (error) {
      console.error('Error in getUsersFn:', error)
      throw error
    }
  })

export const getUserByIdFn = createServerFn({ method: 'GET' })
  .inputValidator(z.string().optional())
  .handler(async ({ data: id }) => {
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
      createdAt:
        item.createdAt instanceof Date ? item.createdAt.toISOString() : new Date().toISOString(),
    }
  })

export const getUserByEmailFn = createServerFn({ method: 'GET' })
  .inputValidator(z.string())
  .handler(async ({ data: email }) => {
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
      createdAt:
        item.createdAt instanceof Date ? item.createdAt.toISOString() : new Date().toISOString(),
    }
  })

export const createUserFn = createServerFn({ method: 'POST' })
  .inputValidator(userSchema)
  .handler(async ({ data: input }) => {
    if (process.env.VITE_E2E === 'true') {
      return {
        id: crypto.randomUUID(),
        name: input.name,
        email: input.email,
        role: input.role || 'user',
        avatar: input.avatar || null,
        jobTitle: input.jobTitle || null,
        departmentId: input.departmentId || null,
        reportsTo: input.reportsTo || null,
        createdAt: new Date().toISOString(),
      }
    }

    const { getDb } = await import('@/shared/lib/db')
    const db = getDb()

    const [newItem] = await db
      .insert(users)
      .values({
        id: input.id || crypto.randomUUID(),
        name: input.name,
        email: input.email,
        role: input.role,
        avatar: input.avatar,
        jobTitle: input.jobTitle,
        departmentId: input.departmentId,
        reportsTo: input.reportsTo,
      })
      .returning()

    return {
      ...newItem,
      createdAt:
        newItem.createdAt instanceof Date
          ? newItem.createdAt.toISOString()
          : new Date().toISOString(),
    }
  })

export const updateUserFn = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      id: z.string(),
      data: userSchema.partial(),
    }),
  )
  .handler(async ({ data }) => {
    const { id, data: updateData } = data
    if (process.env.VITE_E2E === 'true') {
      return {
        id,
        name: updateData.name || 'User 1',
        email: updateData.email || 'user1@example.com',
        role: updateData.role || 'user',
        avatar: updateData.avatar || null,
        jobTitle: updateData.jobTitle || null,
        departmentId: updateData.departmentId || null,
        reportsTo: updateData.reportsTo || null,
        createdAt: new Date().toISOString(),
      }
    }

    const { getDb } = await import('@/shared/lib/db')
    const db = getDb()

    const [updatedItem] = await db
      .update(users)
      .set({
        name: updateData.name,
        email: updateData.email,
        role: updateData.role,
        avatar: updateData.avatar,
        jobTitle: updateData.jobTitle,
        departmentId: updateData.departmentId,
        reportsTo: updateData.reportsTo,
      })
      .where(eq(users.id, id))
      .returning()

    if (!updatedItem) {
      throw new Error('User not found for update')
    }

    return {
      ...updatedItem,
      createdAt:
        updatedItem.createdAt instanceof Date
          ? updatedItem.createdAt.toISOString()
          : new Date().toISOString(),
    }
  })

export const deleteUserFn = createServerFn({ method: 'POST' })
  .inputValidator(z.string())
  .handler(async ({ data: id }) => {
    if (process.env.VITE_E2E === 'true') {
      return { success: true }
    }

    const { getDb } = await import('@/shared/lib/db')
    const db = getDb()
    await db.delete(users).where(eq(users.id, id as string))
    return { success: true }
  })

export const upsertUserFn = createServerFn({ method: 'POST' })
  .inputValidator(userSchema.extend({ id: z.string() }))
  .handler(async ({ data: input }) => {
    if (process.env.VITE_E2E === 'true') {
      return {
        id: input.id,
        name: input.name,
        email: input.email,
        role: (input.role as 'admin' | 'user') || 'user',
        avatar: input.avatar || null,
        jobTitle: input.jobTitle || null,
        departmentId: input.departmentId || null,
        reportsTo: input.reportsTo || null,
        createdAt: new Date().toISOString(),
      }
    }

    const { getDb } = await import('@/shared/lib/db')
    const db = getDb()

    try {
      const [upserted] = await db
        .insert(users)
        .values({
          id: input.id,
          name: input.name,
          email: input.email,
          role: (input.role as 'admin' | 'user') || 'user',
          avatar: input.avatar,
          jobTitle: input.jobTitle,
          departmentId: input.departmentId,
          reportsTo: input.reportsTo,
        })
        .onConflictDoUpdate({
          target: users.id,
          set: {
            name: input.name,
            email: input.email,
            avatar: input.avatar,
            jobTitle: input.jobTitle,
            departmentId: input.departmentId,
            reportsTo: input.reportsTo,
            // role is intentionally omitted to preserve existing role
          },
        })
        .returning()

      if (!upserted) {
        throw new Error('No user returned from upsert')
      }

      const createdAt =
        upserted.createdAt instanceof Date
          ? upserted.createdAt.toISOString()
          : new Date().toISOString()

      return {
        ...upserted,
        createdAt,
      }
    } catch (error) {
      console.error('Error in upsertUserFn:', error)
      throw error
    }
  })
