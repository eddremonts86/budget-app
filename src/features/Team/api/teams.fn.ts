import { createServerFn } from '@tanstack/react-start'
import { desc, eq } from 'drizzle-orm'
import { z } from 'zod'
// import { db } from '@/shared/lib/db'
import { teams } from '@/shared/lib/db/schema'
// import type { Team } from '../model/types'

export const teamSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  members: z.array(z.string()).default([]),
})

export type TeamInput = z.infer<typeof teamSchema>

export const getTeamsFn = createServerFn({ method: 'GET' }).handler(
  async ({ data }: { data?: { pageParam?: number; limit?: number } }) => {
    if (process.env.VITE_E2E === 'true') {
      return {
        data: Array.from({ length: 5 }).map((_, i) => ({
          id: i.toString(),
          name: `Team ${i}`,
          description: `Description for Team ${i}`,
          members: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })),
        nextPage: undefined,
        totalCount: 5,
      }
    }

    try {
      const { getDb } = await import('@/shared/lib/db')
      const db = getDb()
      const { pageParam, limit: limitParam } = data || {}
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
    } catch (error) {
      console.error('Error in getTeamsFn:', error)
      return {
        data: [],
        nextPage: undefined,
        totalCount: 0,
      }
    }
  },
)

export const getTeamByIdFn = createServerFn({ method: 'GET' }).handler(
  async ({ data: id }: { data: string | undefined }) => {
    if (process.env.VITE_E2E === 'true') {
      return {
        id: id || '1',
        name: 'Team 1',
        description: 'Description for Team 1',
        members: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }

    try {
      if (!id) throw new Error('ID is required')
      const { getDb } = await import('@/shared/lib/db')
      const db = getDb()
      const result = await db.select().from(teams).where(eq(teams.id, id))
      if (!result.length) return null
      const item = result[0]
      return {
        ...item,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      }
    } catch (error) {
      console.error('Error in getTeamByIdFn:', error)
      return null
    }
  },
)

export const createTeamFn = createServerFn({ method: 'POST' }).handler(
  async ({ data }: { data: unknown }) => {
    if (process.env.VITE_E2E === 'true') {
      const input = data as TeamInput
      return {
        id: crypto.randomUUID(),
        name: input.name,
        description: input.description,
        members: input.members,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }

    try {
      const { getDb } = await import('@/shared/lib/db')
      const db = getDb()
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
    } catch (error) {
      console.error('Error in createTeamFn:', error)
      throw error
    }
  },
)

export const updateTeamFn = createServerFn({ method: 'POST' }).handler(
  async ({ data }: { data: unknown }) => {
    if (process.env.VITE_E2E === 'true') {
      const { id, data: updateData } = data as {
        id: string
        data: Partial<TeamInput>
      }
      return {
        id,
        name: updateData.name || 'Team 1',
        description: updateData.description || 'Description',
        members: updateData.members || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }

    try {
      const { getDb } = await import('@/shared/lib/db')
      const db = getDb()
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
    } catch (error) {
      console.error('Error in updateTeamFn:', error)
      throw error
    }
  },
)

export const deleteTeamFn = createServerFn({ method: 'POST' }).handler(
  async ({ data: id }: { data: string | undefined }) => {
    if (process.env.VITE_E2E === 'true') {
      return { success: true }
    }

    try {
      if (!id) throw new Error('ID is required')
      const { getDb } = await import('@/shared/lib/db')
      const db = getDb()
      await db.delete(teams).where(eq(teams.id, id))
      return { success: true }
    } catch (error) {
      console.error('Error in deleteTeamFn:', error)
      throw error
    }
  },
)
