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

const teamListParamsSchema = z
  .object({
    pageParam: z.number().optional(),
    limit: z.number().optional(),
  })
  .optional()

const updateTeamPayloadSchema = z.object({
  id: z.string().min(1),
  data: teamSchema.partial(),
})

export const getTeamsFn = createServerFn({ method: 'GET' })
  .inputValidator(teamListParamsSchema)
  .handler(async ({ data }) => {
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
  })

export const getTeamByIdFn = createServerFn({ method: 'GET' })
  .inputValidator(z.string().optional())
  .handler(async ({ data: id }) => {
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
  })

export const createTeamFn = createServerFn({ method: 'POST' })
  .inputValidator(teamSchema)
  .handler(async ({ data }) => {
    if (process.env.VITE_E2E === 'true') {
      return {
        id: crypto.randomUUID(),
        name: data.name,
        description: data.description,
        members: data.members,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }

    try {
      const { getDb } = await import('@/shared/lib/db')
      const db = getDb()
      const normalizedName = data.name.trim()

      const existingTeam = await db
        .select({ id: teams.id })
        .from(teams)
        .where(eq(teams.name, normalizedName))
        .limit(1)
      if (existingTeam.length > 0) {
        throw new Error('A team with this name already exists')
      }

      const [existingUsers, duplicatedUsers] = await Promise.all([
        data.members.length
          ? db
              .select({ id: users.id })
              .from(users)
              .where(inArray(users.id, Array.from(new Set(data.members))))
          : Promise.resolve([]),
        Promise.resolve(
          data.members.filter((member, index) => data.members.indexOf(member) !== index),
        ),
      ])

      if (duplicatedUsers.length > 0) {
        throw new Error('Team members contain duplicated users')
      }

      if (data.members.length > 0 && existingUsers.length !== data.members.length) {
        throw new Error('Some selected users do not exist')
      }

      const teamId = crypto.randomUUID()
      const [newItem] = await db
        .insert(teams)
        .values({
          id: teamId,
          name: normalizedName,
          description: data.description,
        })
        .returning()

      if (data.members.length > 0) {
        await db.insert(teamMembers).values(
          data.members.map((userId) => ({
            teamId,
            userId,
          })),
        )
      }

      return {
        ...newItem,
        members: data.members,
        createdAt: newItem.createdAt.toISOString(),
        updatedAt: newItem.updatedAt.toISOString(),
      }
    } catch (error) {
      console.error('Error in createTeamFn:', error)
      throw error
    }
  })

export const updateTeamFn = createServerFn({ method: 'POST' })
  .inputValidator(updateTeamPayloadSchema)
  .handler(async ({ data }) => {
    if (process.env.VITE_E2E === 'true') {
      return {
        id: data.id,
        name: data.data.name || 'Team 1',
        description: data.data.description || 'Description',
        members: data.data.members || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }

    try {
      const { getDb } = await import('@/shared/lib/db')
      const db = getDb()
      const { id, data: updateData } = data

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
  })

export const deleteTeamFn = createServerFn({ method: 'POST' })
  .inputValidator(z.string().optional())
  .handler(async ({ data: id }) => {
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
  })
