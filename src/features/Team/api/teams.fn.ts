import { createServerFn } from '@tanstack/react-start'
import { desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/shared/lib/db'
import { teams } from '@/shared/lib/db/schema'
import type { Team } from '../model/types'

export const teamSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  members: z.array(z.string()).default([]),
})

export type TeamInput = z.infer<typeof teamSchema>

export const getTeamsFn = createServerFn({ method: 'GET' }).handler(
  async ({ data }: { data: unknown }) => {
    const { pageParam, limit: limitParam } = (data as { pageParam?: number; limit?: number }) || {}
    const page = pageParam || 1
    const limit = limitParam || 10
    const offset = (page - 1) * limit

    const [items, total] = await Promise.all([
      db.select().from(teams).limit(limit).offset(offset).orderBy(desc(teams.createdAt)),
      db.$count(teams),
    ])

    const totalPages = Math.ceil(total / limit)
    const nextPage = page < totalPages ? page + 1 : undefined

    return {
      data: items.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      })),
      nextPage,
      totalCount: total,
    }
  },
) as unknown as (opts: { data: { pageParam?: number; limit?: number } }) => Promise<{
  data: Team[]
  nextPage: number | undefined
  totalCount: number
}>

export const getTeamByIdFn = createServerFn({ method: 'GET' }).handler(
  async ({ data: id }: { data: unknown }) => {
    const result = await db
      .select()
      .from(teams)
      .where(eq(teams.id, id as string))
    if (!result.length) return null
    const item = result[0]
    return {
      ...item,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }
  },
) as unknown as (opts: { data: string }) => Promise<Team | null>

export const createTeamFn = createServerFn({ method: 'POST' }).handler(
  async ({ data }: { data: unknown }) => {
    // Manual validation
    const parsed = teamSchema.safeParse(data)
    if (!parsed.success) {
      throw new Error(`Invalid input: ${parsed.error.message}`)
    }
    const input = parsed.data

    const [newItem] = await db
      .insert(teams)
      .values({
        id: crypto.randomUUID(),
        name: input.name,
        description: input.description,
        members: input.members,
      })
      .returning()

    return {
      ...newItem,
      createdAt: newItem.createdAt.toISOString(),
      updatedAt: newItem.updatedAt.toISOString(),
    }
  },
) as unknown as (opts: { data: z.infer<typeof teamSchema> }) => Promise<Team>

export const updateTeamFn = createServerFn({ method: 'POST' }).handler(
  async ({ data }: { data: unknown }) => {
    const { id, data: updateData } = data as {
      id: string
      data: Partial<z.infer<typeof teamSchema>>
    }

    const [updatedItem] = await db
      .update(teams)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(teams.id, id))
      .returning()

    return {
      ...updatedItem,
      createdAt: updatedItem.createdAt.toISOString(),
      updatedAt: updatedItem.updatedAt.toISOString(),
    }
  },
) as unknown as (opts: {
  data: { id: string; data: Partial<z.infer<typeof teamSchema>> }
}) => Promise<Team>

export const deleteTeamFn = createServerFn({ method: 'POST' }).handler(
  async ({ data: id }: { data: unknown }) => {
    await db.delete(teams).where(eq(teams.id, id as string))
    return { success: true }
  },
) as unknown as (opts: { data: string }) => Promise<{ success: boolean }>
