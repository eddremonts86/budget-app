import { createServerFn } from '@tanstack/react-start'
import { and, desc, eq, count, like, or, inArray, sql } from 'drizzle-orm'
import { z } from 'zod'
import {
  departments,
  experienceLevels,
  externalIdentities,
  jobTitles,
  roles,
  skills,
  userSkills,
  users,
} from '@/shared/lib/db/schema'
import type { User as UserType } from '../model/types'

export const userSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  email: z.string().email(),
  roleId: z.string(),
  avatar: z.string().nullable().optional(),
  jobTitleId: z.string().nullable().optional(),
  experienceLevelId: z.string().nullable().optional(),
  departmentId: z.string().nullable().optional(),
  reportsTo: z.string().nullable().optional(),
  salary: z.number().nullable().optional(),
  skills: z.array(z.string()).optional(), // Skill names
})

export type UserInput = z.infer<typeof userSchema>

export interface UserListResponse {
  data: UserType[]
  nextPage?: number
  totalCount: number
}

const userIdsSchema = z.array(z.string().min(1)).max(5000)

export const getUsersFn = createServerFn({ method: 'GET' })
  .inputValidator(
    z
      .object({
        pageParam: z.number().optional(),
        limit: z.number().optional(),
        search: z.string().optional(),
      })
      .optional(),
  )
  .handler(async ({ data }): Promise<UserListResponse> => {
    if (process.env.VITE_E2E === 'true') {
      return {
        data: Array.from({ length: 5 }).map((_, i) => ({
          id: i.toString(),
          name: `User ${i}`,
          email: `user${i}@example.com`,
          roleId: 'role_1',
          roleName: 'Admin',
          avatar: null,
          jobTitleId: 'job_1',
          jobTitleName: 'Developer',
          departmentId: '1',
          departmentName: 'Engineering',
          reportsTo: null,
          createdAt: new Date().toISOString(),
        })),
        nextPage: undefined,
        totalCount: 5,
      }
    }

    try {
      const { getDb } = await import('@/shared/lib/db')
      const db = getDb()
      const { pageParam, limit: limitParam, search } = data || {}
      const page = pageParam || 1
      const limit = limitParam || 10
      const offset = (page - 1) * limit

      const whereClause = search
        ? or(like(users.name, `%${search}%`), like(users.email, `%${search}%`))
        : undefined

      const [items, totalResult] = await Promise.all([
        db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
            roleId: users.roleId,
            roleName: roles.name,
            avatar: users.avatar,
            jobTitleId: users.jobTitleId,
            jobTitleName: jobTitles.name,
            experienceLevelId: users.experienceLevelId,
            experienceLevelName: experienceLevels.name,
            departmentId: users.departmentId,
            departmentName: departments.name,
            reportsTo: users.reportsTo,
            reportsToName: sql<string>`(SELECT name FROM ${users} as u2 WHERE u2.id = ${users.reportsTo})`,
            salary: users.salary,
            createdAt: users.createdAt,
            updatedAt: users.updatedAt,
          })
          .from(users)
          .leftJoin(roles, eq(users.roleId, roles.id))
          .leftJoin(jobTitles, eq(users.jobTitleId, jobTitles.id))
          .leftJoin(experienceLevels, eq(users.experienceLevelId, experienceLevels.id))
          .leftJoin(departments, eq(users.departmentId, departments.id))
          .where(whereClause)
          .limit(limit)
          .offset(offset)
          .orderBy(desc(users.createdAt)),
        db.select({ count: count() }).from(users).where(whereClause),
      ])

      const total = totalResult[0]?.count ?? 0

      // Fetch skills for these users
      const userIds = items.map((u) => u.id)
      const allSkills =
        userIds.length > 0
          ? await db
              .select({
                userId: userSkills.userId,
                skillName: skills.name,
              })
              .from(userSkills)
              .innerJoin(skills, eq(userSkills.skillId, skills.id))
              .where(inArray(userSkills.userId, userIds))
          : []

      const skillsMap = allSkills.reduce(
        (acc, curr) => {
          if (!acc[curr.userId]) acc[curr.userId] = []
          acc[curr.userId].push(curr.skillName)
          return acc
        },
        {} as Record<string, string[]>,
      )

      const totalPages = Math.ceil(total / limit)
      const nextPage = page < totalPages ? page + 1 : undefined

      return {
        data: items.map((item) => ({
          ...item,
          skills: skillsMap[item.id] || [],
          createdAt: item.createdAt.toISOString(),
          updatedAt: item.updatedAt.toISOString(),
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
    if (!id) return null

    const { getDb } = await import('@/shared/lib/db')
    const db = getDb()

    const result = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        roleId: users.roleId,
        roleName: roles.name,
        avatar: users.avatar,
        jobTitleId: users.jobTitleId,
        jobTitleName: jobTitles.name,
        experienceLevelId: users.experienceLevelId,
        experienceLevelName: experienceLevels.name,
        departmentId: users.departmentId,
        departmentName: departments.name,
        reportsTo: users.reportsTo,
        salary: users.salary,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .leftJoin(jobTitles, eq(users.jobTitleId, jobTitles.id))
      .leftJoin(experienceLevels, eq(users.experienceLevelId, experienceLevels.id))
      .leftJoin(departments, eq(users.departmentId, departments.id))
      .where(eq(users.id, id))

    if (!result.length) return null
    const item = result[0]

    const userSkillsData = await db
      .select({ skillName: skills.name })
      .from(userSkills)
      .innerJoin(skills, eq(userSkills.skillId, skills.id))
      .where(eq(userSkills.userId, id))

    return {
      ...item,
      skills: userSkillsData.map((s) => s.skillName),
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }
  })

export const getUsersByIdsFn = createServerFn({ method: 'POST' })
  .inputValidator(userIdsSchema)
  .handler(async ({ data: ids }): Promise<UserType[]> => {
    const uniqueIds = Array.from(new Set(ids))

    if (process.env.VITE_E2E === 'true') {
      return uniqueIds.map((id, index) => ({
        id,
        name: `User ${index + 1}`,
        email: `user${index + 1}@example.com`,
        roleId: 'role_user',
        roleName: 'User',
        avatar: null,
        jobTitleId: null,
        jobTitleName: 'Developer',
        experienceLevelId: null,
        experienceLevelName: null,
        departmentId: null,
        departmentName: 'Engineering',
        reportsTo: null,
        reportsToName: null,
        salary: null,
        skills: [] as string[],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }))
    }

    if (uniqueIds.length === 0) {
      return []
    }

    const { getDb } = await import('@/shared/lib/db')
    const db = getDb()

    const result = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        roleId: users.roleId,
        roleName: roles.name,
        avatar: users.avatar,
        jobTitleId: users.jobTitleId,
        jobTitleName: jobTitles.name,
        experienceLevelId: users.experienceLevelId,
        experienceLevelName: experienceLevels.name,
        departmentId: users.departmentId,
        departmentName: departments.name,
        reportsTo: users.reportsTo,
        reportsToName: sql<string>`(SELECT name FROM ${users} as u2 WHERE u2.id = ${users.reportsTo})`,
        salary: users.salary,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .leftJoin(jobTitles, eq(users.jobTitleId, jobTitles.id))
      .leftJoin(experienceLevels, eq(users.experienceLevelId, experienceLevels.id))
      .leftJoin(departments, eq(users.departmentId, departments.id))
      .where(inArray(users.id, uniqueIds))

    const usersById = new Map(
      result.map((item) => [
        item.id,
        {
          ...item,
          skills: [] as string[],
          createdAt: item.createdAt.toISOString(),
          updatedAt: item.updatedAt.toISOString(),
        },
      ]),
    )

    const hydratedUsers: UserType[] = []

    for (const id of uniqueIds) {
      const user = usersById.get(id)
      if (user) {
        hydratedUsers.push(user)
      }
    }

    return hydratedUsers
  })

export const getUserByEmailFn = createServerFn({ method: 'GET' })
  .inputValidator(z.string())
  .handler(async ({ data: email }) => {
    const { getDb } = await import('@/shared/lib/db')
    const db = getDb()
    const result = await db.select().from(users).where(eq(users.email, email))
    if (!result.length) return null
    const item = result[0]
    return {
      ...item,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }
  })

export const createUserFn = createServerFn({ method: 'POST' })
  .inputValidator(userSchema)
  .handler(async ({ data: input }) => {
    const { getDb } = await import('@/shared/lib/db')
    const db = getDb()

    const userId = input.id || crypto.randomUUID()

    const [newItem] = await db
      .insert(users)
      .values({
        id: userId,
        name: input.name,
        email: input.email,
        roleId: input.roleId,
        avatar: input.avatar,
        jobTitleId: input.jobTitleId,
        experienceLevelId: input.experienceLevelId,
        departmentId: input.departmentId,
        reportsTo: input.reportsTo,
      })
      .returning()

    if (input.skills && input.skills.length > 0) {
      // Find or create skills
      for (const skillName of input.skills) {
        let [skill] = await db.select().from(skills).where(eq(skills.name, skillName))
        if (!skill) {
          ;[skill] = await db
            .insert(skills)
            .values({ id: crypto.randomUUID(), name: skillName })
            .returning()
        }
        await db.insert(userSkills).values({ userId: newItem.id, skillId: skill.id })
      }
    }

    return {
      ...newItem,
      createdAt: newItem.createdAt.toISOString(),
      updatedAt: newItem.updatedAt.toISOString(),
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
    const { getDb } = await import('@/shared/lib/db')
    const db = getDb()

    const [updatedItem] = await db
      .update(users)
      .set({
        name: updateData.name,
        email: updateData.email,
        roleId: updateData.roleId,
        avatar: updateData.avatar,
        jobTitleId: updateData.jobTitleId,
        experienceLevelId: updateData.experienceLevelId,
        departmentId: updateData.departmentId,
        reportsTo: updateData.reportsTo,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning()

    if (!updatedItem) {
      throw new Error('User not found for update')
    }

    if (updateData.skills) {
      // Sync skills
      await db.delete(userSkills).where(eq(userSkills.userId, id))
      for (const skillName of updateData.skills) {
        let [skill] = await db.select().from(skills).where(eq(skills.name, skillName))
        if (!skill) {
          ;[skill] = await db
            .insert(skills)
            .values({ id: crypto.randomUUID(), name: skillName })
            .returning()
        }
        await db.insert(userSkills).values({ userId: id, skillId: skill.id })
      }
    }

    return {
      ...updatedItem,
      createdAt: updatedItem.createdAt.toISOString(),
      updatedAt: updatedItem.updatedAt.toISOString(),
    }
  })

export const deleteUserFn = createServerFn({ method: 'POST' })
  .inputValidator(z.string())
  .handler(async ({ data: id }) => {
    const { getDb } = await import('@/shared/lib/db')
    const db = getDb()
    await db.delete(users).where(eq(users.id, id))
    return { success: true }
  })

export const upsertUserFn = createServerFn({ method: 'POST' })
  .inputValidator(userSchema.extend({ id: z.string() }))
  .handler(async ({ data: input }) => {
    const { getDb } = await import('@/shared/lib/db')
    const db = getDb()

    try {
      const [upserted] = await db
        .insert(users)
        .values({
          id: input.id,
          name: input.name,
          email: input.email,
          roleId: input.roleId,
          avatar: input.avatar,
          jobTitleId: input.jobTitleId,
          experienceLevelId: input.experienceLevelId,
          departmentId: input.departmentId,
          reportsTo: input.reportsTo,
        })
        .onConflictDoUpdate({
          target: users.id,
          set: {
            name: input.name,
            email: input.email,
            avatar: input.avatar,
            roleId: input.roleId,
            jobTitleId: input.jobTitleId,
            experienceLevelId: input.experienceLevelId,
            departmentId: input.departmentId,
            reportsTo: input.reportsTo,
            salary: input.salary,
            updatedAt: new Date(),
          },
        })
        .returning()

      if (!upserted) {
        throw new Error('No user returned from upsert')
      }

      if (input.skills) {
        // Sync skills
        await db.delete(userSkills).where(eq(userSkills.userId, upserted.id))
        for (const skillName of input.skills) {
          let [skill] = await db.select().from(skills).where(eq(skills.name, skillName))
          if (!skill) {
            ;[skill] = await db
              .insert(skills)
              .values({ id: crypto.randomUUID(), name: skillName })
              .returning()
          }
          await db.insert(userSkills).values({ userId: upserted.id, skillId: skill.id })
        }
      }

      return {
        ...upserted,
        createdAt: upserted.createdAt.toISOString(),
        updatedAt: upserted.updatedAt.toISOString(),
      }
    } catch (error) {
      console.error('Error in upsertUserFn:', error)
      throw error
    }
  })

const syncedAuthUserSchema = z.object({
  provider: z.enum(['clerk', 'better-auth']),
  providerUserId: z.string().min(1),
  email: z.string().email(),
  name: z.string().min(1),
  avatar: z.string().nullable().optional(),
})

export const syncAuthenticatedUserFn = createServerFn({ method: 'POST' })
  .inputValidator(syncedAuthUserSchema)
  .handler(async ({ data: input }) => {
    const { getDb } = await import('@/shared/lib/db')
    const db = getDb()
    const now = new Date()
    const defaultRoleId = 'role_user'

    try {
      if (input.provider === 'better-auth') {
        const [linkedUser] = await db
          .select()
          .from(users)
          .where(eq(users.authUserId, input.providerUserId))
          .limit(1)

        const [sameEmailUser] = linkedUser
          ? [undefined]
          : await db.select().from(users).where(eq(users.email, input.email)).limit(1)

        const targetUser = linkedUser ?? sameEmailUser

        if (targetUser) {
          const [updatedUser] = await db
            .update(users)
            .set({
              name: input.name,
              email: input.email,
              avatar: input.avatar,
              authUserId: input.providerUserId,
              updatedAt: now,
            })
            .where(eq(users.id, targetUser.id))
            .returning()

          return {
            ...updatedUser,
            createdAt: updatedUser.createdAt.toISOString(),
            updatedAt: updatedUser.updatedAt.toISOString(),
          }
        }

        const [createdUser] = await db
          .insert(users)
          .values({
            id: crypto.randomUUID(),
            name: input.name,
            email: input.email,
            avatar: input.avatar,
            roleId: defaultRoleId,
            authUserId: input.providerUserId,
          })
          .returning()

        return {
          ...createdUser,
          createdAt: createdUser.createdAt.toISOString(),
          updatedAt: createdUser.updatedAt.toISOString(),
        }
      }

      const [identity] = await db
        .select()
        .from(externalIdentities)
        .where(
          and(
            eq(externalIdentities.provider, input.provider),
            eq(externalIdentities.externalUserId, input.providerUserId),
          ),
        )
        .limit(1)

      const [linkedUser] = identity
        ? await db.select().from(users).where(eq(users.id, identity.userId)).limit(1)
        : [undefined]

      const [sameEmailUser] = linkedUser
        ? [undefined]
        : await db.select().from(users).where(eq(users.email, input.email)).limit(1)

      let targetUser = linkedUser ?? sameEmailUser

      if (targetUser) {
        const [updatedUser] = await db
          .update(users)
          .set({
            name: input.name,
            email: input.email,
            avatar: input.avatar,
            updatedAt: now,
          })
          .where(eq(users.id, targetUser.id))
          .returning()

        targetUser = updatedUser
      } else {
        const [createdUser] = await db
          .insert(users)
          .values({
            id: crypto.randomUUID(),
            name: input.name,
            email: input.email,
            avatar: input.avatar,
            roleId: defaultRoleId,
          })
          .returning()

        targetUser = createdUser
      }

      if (identity) {
        await db
          .update(externalIdentities)
          .set({
            userId: targetUser.id,
            email: input.email,
            updatedAt: now,
            lastLoginAt: now,
          })
          .where(eq(externalIdentities.id, identity.id))
      } else {
        const [existingProviderLink] = await db
          .select()
          .from(externalIdentities)
          .where(
            and(
              eq(externalIdentities.userId, targetUser.id),
              eq(externalIdentities.provider, input.provider),
            ),
          )
          .limit(1)

        if (existingProviderLink) {
          await db
            .update(externalIdentities)
            .set({
              externalUserId: input.providerUserId,
              email: input.email,
              updatedAt: now,
              lastLoginAt: now,
            })
            .where(eq(externalIdentities.id, existingProviderLink.id))
        } else {
          await db.insert(externalIdentities).values({
            id: crypto.randomUUID(),
            userId: targetUser.id,
            provider: input.provider,
            externalUserId: input.providerUserId,
            email: input.email,
            lastLoginAt: now,
          })
        }
      }

      return {
        ...targetUser,
        createdAt: targetUser.createdAt.toISOString(),
        updatedAt: targetUser.updatedAt.toISOString(),
      }
    } catch (error) {
      console.error('Error in syncAuthenticatedUserFn:', error)
      throw error
    }
  })
