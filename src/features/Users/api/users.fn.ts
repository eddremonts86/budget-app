import { createServerFn } from '@tanstack/react-start'
import { desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/shared/lib/db'
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
  async ({ data }: { data: unknown }) => {
    const { pageParam, limit: limitParam } = (data as { pageParam?: number; limit?: number }) || {}
    const page = pageParam || 1
    const limit = limitParam || 10
    const offset = (page - 1) * limit

    const [items, total] = await Promise.all([
      db.select().from(users).limit(limit).offset(offset).orderBy(desc(users.createdAt)),
      db.$count(users),
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
  },
) as unknown as (opts: { data: { pageParam?: number; limit?: number } }) => Promise<{
  data: User[]
  nextPage: number | undefined
  totalCount: number
}>

export const getUserByIdFn = createServerFn({ method: 'GET' }).handler(
  async ({ data: id }: { data: unknown }) => {
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
    await db.delete(users).where(eq(users.id, id as string))
    return { success: true }
  },
) as unknown as (opts: { data: string }) => Promise<{ success: boolean }>

export const upsertUserFn = createServerFn({ method: 'POST' }).handler(
  async ({ data }: { data: unknown }) => {
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
