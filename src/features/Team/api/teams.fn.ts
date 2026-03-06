import { createServerFn } from '@tanstack/react-start'
import { desc, eq, inArray } from 'drizzle-orm'
import { z } from 'zod'
import { teamMembers, teams, users } from '@/shared/lib/db/schema'

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

      const teamIds = items.map((item) => item.id)
      const membersByTeamId: Record<string, string[]> = {}

      if (teamIds.length > 0) {
        const memberRows = await db
          .select({
            teamId: teamMembers.teamId,
            userId: teamMembers.userId,
          })
          .from(teamMembers)
          .where(inArray(teamMembers.teamId, teamIds))

        for (const row of memberRows) {
          if (!membersByTeamId[row.teamId]) {
            membersByTeamId[row.teamId] = []
          }
          membersByTeamId[row.teamId].push(row.userId)
        }
      }

      const totalPages = Math.ceil(total / limit)
      const nextPage = page < totalPages ? page + 1 : undefined

      return {
        data: items.map((item) => ({
          ...item,
          members: membersByTeamId[item.id] || [],
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
      const memberRows = await db
        .select({ userId: teamMembers.userId })
        .from(teamMembers)
        .where(eq(teamMembers.teamId, id))

      return {
        ...item,
        members: memberRows.map((row) => row.userId),
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
      const normalizedName = input.name.trim()

      const existingTeam = await db
        .select({ id: teams.id })
        .from(teams)
        .where(eq(teams.name, normalizedName))
        .limit(1)
      if (existingTeam.length > 0) {
        throw new Error('A team with this name already exists')
      }

      const [existingUsers, duplicatedUsers] = await Promise.all([
        input.members.length
          ? db
              .select({ id: users.id })
              .from(users)
              .where(inArray(users.id, Array.from(new Set(input.members))))
          : Promise.resolve([]),
        Promise.resolve(input.members.filter((member, index) => input.members.indexOf(member) !== index)),
      ])

      if (duplicatedUsers.length > 0) {
        throw new Error('Team members contain duplicated users')
      }

      if (input.members.length > 0 && existingUsers.length !== input.members.length) {
        throw new Error('Some selected users do not exist')
      }

      const teamId = crypto.randomUUID()
      const [newItem] = await db
        .insert(teams)
        .values({
          id: teamId,
          name: normalizedName,
          description: input.description,
        })
        .returning()

      if (input.members.length > 0) {
        await db.insert(teamMembers).values(
          input.members.map((userId) => ({
            teamId,
            userId,
          })),
        )
      }

      return {
        ...newItem,
        members: input.members,
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
      const updatePayloadSchema = z.object({
        id: z.string().min(1),
        data: teamSchema.partial(),
      })
      const parsed = updatePayloadSchema.safeParse(data)
      if (!parsed.success) {
        throw new Error(`Invalid input: ${parsed.error.message}`)
      }

      const { id, data: updateData } = parsed.data as {
        id: string
        data: Partial<z.infer<typeof teamSchema>>
      }

      if (updateData.members) {
        const uniqueMembers = Array.from(new Set(updateData.members))
        if (uniqueMembers.length !== updateData.members.length) {
          throw new Error('Team members contain duplicated users')
        }

        if (uniqueMembers.length > 0) {
          const existingUsers = await db
            .select({ id: users.id })
            .from(users)
            .where(inArray(users.id, uniqueMembers))
          if (existingUsers.length !== uniqueMembers.length) {
            throw new Error('Some selected users do not exist')
          }
        }
      }

      if (updateData.name !== undefined) {
        const normalizedName = updateData.name.trim()
        if (!normalizedName) {
          throw new Error('Team name is required')
        }
        const existingTeam = await db
          .select({ id: teams.id })
          .from(teams)
          .where(eq(teams.name, normalizedName))
          .limit(1)
        if (existingTeam.length > 0 && existingTeam[0].id !== id) {
          throw new Error('A team with this name already exists')
        }
        updateData.name = normalizedName
      }

      const [updatedItem] = await db
        .update(teams)
        .set({
          ...(updateData.name !== undefined ? { name: updateData.name } : {}),
          ...(updateData.description !== undefined ? { description: updateData.description } : {}),
          updatedAt: new Date(),
        })
        .where(eq(teams.id, id))
        .returning()

      if (!updatedItem) {
        throw new Error('Team not found')
      }

      let members: string[] = []
      if (updateData.members !== undefined) {
        await db.delete(teamMembers).where(eq(teamMembers.teamId, id))
        if (updateData.members.length > 0) {
          await db.insert(teamMembers).values(
            updateData.members.map((userId) => ({
              teamId: id,
              userId,
            })),
          )
        }
        members = updateData.members
      } else {
        const memberRows = await db
          .select({ userId: teamMembers.userId })
          .from(teamMembers)
          .where(eq(teamMembers.teamId, id))
        members = memberRows.map((row) => row.userId)
      }

      return {
        ...updatedItem,
        members,
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
      await db.delete(teamMembers).where(eq(teamMembers.teamId, id))
      await db.delete(teams).where(eq(teams.id, id))
      return { success: true }
    } catch (error) {
      console.error('Error in deleteTeamFn:', error)
      throw error
    }
  },
)
