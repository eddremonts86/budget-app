import { createServerFn } from '@tanstack/react-start'
import { desc, eq, and, inArray, count, ilike } from 'drizzle-orm'
import { z } from 'zod'
import {
  projects,
  departments,
  projectMembers,
  users,
  projectSkills,
  skills,
} from '@/shared/lib/db/schema'

/**
 * Batch find-or-create skills by name. Returns a Map<skillName, skillId>.
 */
async function findOrCreateProjectSkills(
  db: ReturnType<typeof import('@/shared/lib/db').getDb>,
  skillNames: string[],
): Promise<Map<string, string>> {
  if (skillNames.length === 0) return new Map()

  const uniqueNames = [...new Set(skillNames)]
  const existing = await db
    .select({ id: skills.id, name: skills.name })
    .from(skills)
    .where(inArray(skills.name, uniqueNames))

  const nameToId = new Map(existing.map((s) => [s.name, s.id]))

  const missing = uniqueNames.filter((n) => !nameToId.has(n))
  if (missing.length > 0) {
    const newSkills = await db
      .insert(skills)
      .values(missing.map((name) => ({ id: crypto.randomUUID(), name })))
      .onConflictDoNothing()
      .returning()

    for (const s of newSkills) {
      nameToId.set(s.name, s.id)
    }

    const stillMissing = missing.filter((n) => !nameToId.has(n))
    if (stillMissing.length > 0) {
      const refetched = await db
        .select({ id: skills.id, name: skills.name })
        .from(skills)
        .where(inArray(skills.name, stillMissing))
      for (const s of refetched) {
        nameToId.set(s.name, s.id)
      }
    }
  }

  return nameToId
}

export const projectSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable(),
  startDate: z.string(),
  endDate: z.string(),
  skills: z.array(z.string()),
  status: z.enum(['active', 'completed', 'on_hold', 'planning', 'cancelled']),
  type: z.enum(['internal', 'external', 'research', 'maintenance']),
  priority: z.string().nullable(),
  budget: z.number().min(0),
  departmentId: z.string().nullable(),
  team: z.array(
    z.object({
      userId: z.string(),
      role: z.enum(['owner', 'manager', 'contributor', 'viewer']),
    }),
  ),
})

export type ProjectInput = z.infer<typeof projectSchema>

export interface Project {
  id: string
  name: string
  description: string | null
  startDate: string
  endDate: string
  skills: string[]
  status: 'active' | 'completed' | 'on_hold' | 'planning' | 'cancelled'
  type: 'internal' | 'external' | 'research' | 'maintenance'
  priority: string
  budget: number
  departmentId: string | null
  team: { userId: string; role: ProjectMemberRole }[]
  createdAt: string
  updatedAt: string
}

export type ProjectMemberRole = 'owner' | 'manager' | 'contributor' | 'viewer'

export interface ProjectMember {
  id: string
  projectId: string
  userId: string
  userName: string | null
  userEmail: string | null
  role: ProjectMemberRole
  joinedAt: string
}

export const projectMemberSchema = z.object({
  projectId: z.string(),
  userId: z.string(),
  role: z.enum(['owner', 'manager', 'contributor', 'viewer']),
})

export type ProjectMemberInput = z.infer<typeof projectMemberSchema>

export interface ProjectListResponse {
  data: Project[]
  nextPage?: number
  totalCount: number
}

export const getProjectsFn = createServerFn({ method: 'GET' })
  .inputValidator(
    z
      .object({
        pageParam: z.number().optional(),
        limit: z.number().optional(),
        search: z.string().optional(),
        status: z.string().optional(),
      })
      .optional(),
  )
  .handler(async ({ data }): Promise<ProjectListResponse> => {
    try {
      const { pageParam, limit: limitParam, search, status } = data || {}
      const page = pageParam || 1
      const limit = limitParam || 25
      const offset = (page - 1) * limit

      const { getDb } = await import('@/shared/lib/db')
      const db = getDb()

      const conditions: ReturnType<typeof ilike>[] = []
      if (search) conditions.push(ilike(projects.name, `%${search}%`))
      if (status) conditions.push(eq(projects.status, status))
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined

      const [items, totalResult] = await Promise.all([
        db
          .select({
            id: projects.id,
            name: projects.name,
            description: projects.description,
            startDate: projects.startDate,
            endDate: projects.endDate,
            status: projects.status,
            type: projects.type,
            priority: projects.priority,
            budget: projects.budget,
            departmentId: projects.departmentId,
            createdAt: projects.createdAt,
            updatedAt: projects.updatedAt,
          })
          .from(projects)
          .where(whereClause)
          .limit(limit)
          .offset(offset)
          .orderBy(desc(projects.createdAt)),
        db.select({ count: count() }).from(projects).where(whereClause),
      ])

      const total = totalResult[0]?.count ?? 0

      if (!items || items.length === 0) {
        return { data: [], totalCount: total }
      }

      const projectIds = items.map((i) => i.id)

      // Fetch skills and members for these projects
      const [allSkills, allMembers] = await Promise.all([
        db
          .select({
            projectId: projectSkills.projectId,
            skillName: skills.name,
          })
          .from(projectSkills)
          .innerJoin(skills, eq(projectSkills.skillId, skills.id))
          .where(inArray(projectSkills.projectId, projectIds)),
        db
          .select({
            projectId: projectMembers.projectId,
            userId: projectMembers.userId,
            role: projectMembers.role,
          })
          .from(projectMembers)
          .where(inArray(projectMembers.projectId, projectIds)),
      ])

      const skillsMap = allSkills.reduce(
        (acc, curr) => {
          if (!acc[curr.projectId]) acc[curr.projectId] = []
          acc[curr.projectId].push(curr.skillName)
          return acc
        },
        {} as Record<string, string[]>,
      )

      const projectsData: Project[] = items.map((item) => {
        const team = (allMembers || [])
          .filter((m) => m && m.projectId === item.id)
          .map((m) => ({
            userId: m.userId?.toString() || '',
            role: (m.role as ProjectInput['team'][number]['role']) || 'viewer',
          }))

        return {
          id: item.id?.toString() || '',
          name: item.name || 'Untitled Project',
          description: item.description,
          startDate: item.startDate ? item.startDate.toISOString() : new Date().toISOString(),
          endDate: item.endDate ? item.endDate.toISOString() : new Date().toISOString(),
          skills: skillsMap[item.id] || [],
          status: (item.status as ProjectInput['status']) || 'active',
          type: (item.type as ProjectInput['type']) || 'internal',
          priority: (item.priority as string) || 'medium',
          budget: item.budget ? Number(item.budget) : 0,
          departmentId: item.departmentId,
          team,
          createdAt:
            item.createdAt instanceof Date
              ? item.createdAt.toISOString()
              : new Date().toISOString(),
          updatedAt:
            item.updatedAt instanceof Date
              ? item.updatedAt.toISOString()
              : new Date().toISOString(),
        }
      })

      const totalPages = Math.ceil(total / limit)
      const nextPage = page < totalPages ? page + 1 : undefined

      return {
        data: projectsData,
        nextPage,
        totalCount: total,
      }
    } catch (error) {
      console.error('getProjectsFn ERROR:', error)
      throw error
    }
  })

export const getProjectByIdFn = createServerFn({ method: 'GET' }).handler(
  async ({ data: id }: { data: unknown }): Promise<Project | null> => {
    try {
      const { getDb } = await import('@/shared/lib/db')
      const db = getDb()
      const [item] = await db
        .select({
          id: projects.id,
          name: projects.name,
          description: projects.description,
          startDate: projects.startDate,
          endDate: projects.endDate,
          status: projects.status,
          type: projects.type,
          priority: projects.priority,
          budget: projects.budget,
          departmentId: projects.departmentId,
          createdAt: projects.createdAt,
          updatedAt: projects.updatedAt,
        })
        .from(projects)
        .where(eq(projects.id, id as string))
        .limit(1)

      if (!item) return null

      const [members, projectSkillsData] = await Promise.all([
        db.select().from(projectMembers).where(eq(projectMembers.projectId, item.id)),
        db
          .select({ skillName: skills.name })
          .from(projectSkills)
          .innerJoin(skills, eq(projectSkills.skillId, skills.id))
          .where(eq(projectSkills.projectId, item.id)),
      ])

      const team = members.map((m) => ({
        userId: m.userId,
        role: m.role as ProjectMemberRole,
      }))

      return {
        id: item.id,
        name: item.name,
        description: item.description,
        startDate: item.startDate ? item.startDate.toISOString() : '',
        endDate: item.endDate ? item.endDate.toISOString() : '',
        skills: projectSkillsData.map((s) => s.skillName),
        status: item.status as Project['status'],
        type: item.type as Project['type'],
        priority: (item.priority as string) || 'medium',
        budget: item.budget ? Number(item.budget) : 0,
        departmentId: item.departmentId,
        team,
        createdAt: item.createdAt ? item.createdAt.toISOString() : new Date().toISOString(),
        updatedAt: item.updatedAt ? item.updatedAt.toISOString() : new Date().toISOString(),
      }
    } catch (error) {
      console.error('getProjectByIdFn ERROR', error)
      throw error
    }
  },
) as unknown as (opts: { data: string }) => Promise<Project | null>

export const getDepartmentsFn = createServerFn({ method: 'GET' }).handler(async () => {
  if (process.env.VITE_E2E === 'true') {
    return [
      { id: '1', name: 'Engineering' },
      { id: '2', name: 'Product' },
      { id: '3', name: 'Design' },
      { id: '4', name: 'Marketing' },
    ]
  }

  try {
    const { getDb } = await import('@/shared/lib/db')
    const db = getDb()
    return await db.select().from(departments).orderBy(departments.name)
  } catch (error) {
    console.error('Error in getDepartmentsFn:', error)
    return []
  }
})

export const createProjectFn = createServerFn({ method: 'POST' }).handler(
  async ({ data }: { data: unknown }): Promise<Project> => {
    const parsed = projectSchema.safeParse(data)
    if (!parsed.success) {
      throw new Error(`Invalid project data: ${parsed.error.message}`)
    }
    const input = parsed.data

    try {
      const { getDb } = await import('@/shared/lib/db')
      const db = getDb()

      // Pre-fetch or create all needed skills in batch (avoids N+1)
      const skillMap =
        input.skills && input.skills.length > 0
          ? await findOrCreateProjectSkills(db, input.skills)
          : new Map<string, string>()

      const projectId = crypto.randomUUID()

      const [newItem] = await db.transaction(async (tx) => {
        const [created] = await tx
          .insert(projects)
          .values({
            id: projectId,
            name: input.name,
            description: input.description,
            startDate: input.startDate ? new Date(input.startDate) : undefined,
            endDate: input.endDate ? new Date(input.endDate) : undefined,
            status: input.status,
            type: input.type,
            priority: input.priority,
            budget: Math.round(input.budget),
            departmentId: input.departmentId,
          })
          .returning()

        if (skillMap.size > 0 && input.skills) {
          await tx.insert(projectSkills).values(
            input.skills
              .filter((name) => skillMap.has(name))
              .map((name) => ({ projectId, skillId: skillMap.get(name)! })),
          )
        }

        if (input.team && input.team.length > 0) {
          await tx.insert(projectMembers).values(
            input.team.map((m: { userId: string; role: ProjectMemberRole }) => ({
              id: crypto.randomUUID(),
              projectId,
              userId: m.userId,
              role: m.role,
            })),
          )
        }

        return [created]
      })

      return {
        id: newItem.id,
        name: newItem.name,
        description: newItem.description,
        startDate: newItem.startDate ? newItem.startDate.toISOString() : '',
        endDate: newItem.endDate ? newItem.endDate.toISOString() : '',
        skills: input.skills,
        status: newItem.status as Project['status'],
        type: newItem.type as Project['type'],
        priority: (newItem.priority as string) || 'medium',
        budget: newItem.budget ? Number(newItem.budget) : 0,
        departmentId: newItem.departmentId,
        team: input.team as { userId: string; role: ProjectMemberRole }[],
        createdAt: newItem.createdAt.toISOString(),
        updatedAt: newItem.updatedAt.toISOString(),
      }
    } catch (error) {
      console.error('createProjectFn ERROR', error)
      throw error
    }
  },
) as unknown as (opts: { data: ProjectInput }) => Promise<Project>

export const updateProjectFn = createServerFn({ method: 'POST' }).handler(
  async ({ data }: { data: unknown }): Promise<Project> => {
    const { id, data: updateData } = data as { id: string; data: Partial<ProjectInput> }
    try {
      const { getDb } = await import('@/shared/lib/db')
      const db = getDb()

      // Pre-fetch or create all needed skills in batch (avoids N+1)
      const skillMap =
        updateData.skills && updateData.skills.length > 0
          ? await findOrCreateProjectSkills(db, updateData.skills)
          : null

      const [updatedItem] = await db.transaction(async (tx) => {
        const [updated] = await tx
          .update(projects)
          .set({
            name: updateData.name,
            description: updateData.description,
            startDate: updateData.startDate ? new Date(updateData.startDate) : undefined,
            endDate: updateData.endDate ? new Date(updateData.endDate) : undefined,
            status: updateData.status,
            type: updateData.type,
            priority: updateData.priority,
            budget: updateData.budget ? Math.round(updateData.budget) : undefined,
            departmentId: updateData.departmentId,
            updatedAt: new Date(),
          })
          .where(eq(projects.id, id))
          .returning()

        if (!updated) {
          throw new Error('Project not found for update')
        }

        if (updateData.skills) {
          await tx.delete(projectSkills).where(eq(projectSkills.projectId, id))
          if (skillMap && skillMap.size > 0) {
            await tx.insert(projectSkills).values(
              updateData.skills
                .filter((name) => skillMap.has(name))
                .map((name) => ({ projectId: id, skillId: skillMap.get(name)! })),
            )
          }
        }

        if (updateData.team) {
          await tx.delete(projectMembers).where(eq(projectMembers.projectId, id))
          if (updateData.team.length > 0) {
            await tx.insert(projectMembers).values(
              updateData.team.map((m: { userId: string; role: ProjectMemberRole }) => ({
                id: crypto.randomUUID(),
                projectId: id,
                userId: m.userId,
                role: m.role,
              })),
            )
          }
        }

        return [updated]
      })

      return {
        id: updatedItem.id,
        name: updatedItem.name,
        description: updatedItem.description,
        startDate: updatedItem.startDate ? updatedItem.startDate.toISOString() : '',
        endDate: updatedItem.endDate ? updatedItem.endDate.toISOString() : '',
        skills: updateData.skills || [],
        status: updatedItem.status as Project['status'],
        type: updatedItem.type as Project['type'],
        priority: (updatedItem.priority as string) || 'medium',
        budget: updatedItem.budget ? Number(updatedItem.budget) : 0,
        departmentId: updatedItem.departmentId,
        team: (updateData.team || []) as { userId: string; role: ProjectMemberRole }[],
        createdAt: updatedItem.createdAt.toISOString(),
        updatedAt: updatedItem.updatedAt.toISOString(),
      }
    } catch (error) {
      console.error('updateProjectFn ERROR', error)
      throw error
    }
  },
) as unknown as (opts: { data: { id: string; data: Partial<ProjectInput> } }) => Promise<Project>

export const deleteProjectFn = createServerFn({ method: 'POST' }).handler(
  async ({ data: id }: { data: unknown }): Promise<{ success: boolean }> => {
    try {
      const { getDb } = await import('@/shared/lib/db')
      const db = getDb()
      await db.transaction(async (tx) => {
        await tx.delete(projectMembers).where(eq(projectMembers.projectId, id as string))
        await tx.delete(projectSkills).where(eq(projectSkills.projectId, id as string))
        await tx.delete(projects).where(eq(projects.id, id as string))
      })
      return { success: true }
    } catch (error) {
      console.error('deleteProjectFn ERROR', error)
      throw error
    }
  },
) as unknown as (opts: { data: string }) => Promise<{ success: boolean }>

export const getProjectMembersFn = createServerFn({ method: 'GET' }).handler(
  async ({ data: projectId }: { data: unknown }): Promise<ProjectMember[]> => {
    const id = projectId as string
    if (process.env.VITE_E2E === 'true') {
      return [
        {
          id: '1',
          projectId: id,
          userId: 'user_e2e_local',
          userName: 'Local User',
          userEmail: 'local@example.com',
          role: 'owner' as const,
          joinedAt: new Date().toISOString(),
        },
      ]
    }

    const { getDb } = await import('@/shared/lib/db')
    const db = getDb()

    const members = await db
      .select({
        id: projectMembers.id,
        projectId: projectMembers.projectId,
        userId: projectMembers.userId,
        userName: users.name,
        userEmail: users.email,
        role: projectMembers.role,
        joinedAt: projectMembers.joinedAt,
      })
      .from(projectMembers)
      .innerJoin(users, eq(projectMembers.userId, users.id))
      .where(eq(projectMembers.projectId, id))

    return members.map((m) => ({
      ...m,
      role: m.role as ProjectMemberRole,
      joinedAt: m.joinedAt.toISOString(),
      userName: m.userName || '',
      userEmail: m.userEmail || '',
    }))
  },
) as unknown as (opts: { data: string }) => Promise<ProjectMember[]>

export const addProjectMemberFn = createServerFn({ method: 'POST' }).handler(
  async ({ data }: { data: unknown }): Promise<ProjectMember> => {
    const parsed = projectMemberSchema.safeParse(data)
    if (!parsed.success) {
      throw new Error(`Invalid member data: ${parsed.error.message}`)
    }
    const input = parsed.data

    if (process.env.VITE_E2E === 'true') {
      return {
        id: crypto.randomUUID(),
        ...input,
        joinedAt: new Date().toISOString(),
        userName: 'E2E User',
        userEmail: 'e2e@example.com',
      }
    }

    const { getDb } = await import('@/shared/lib/db')
    const db = getDb()

    const [newMember] = await db
      .insert(projectMembers)
      .values({
        id: crypto.randomUUID(),
        projectId: input.projectId,
        userId: input.userId,
        role: input.role,
      })
      .returning()

    return {
      id: newMember.id,
      projectId: newMember.projectId,
      userId: newMember.userId,
      role: newMember.role as ProjectMemberRole,
      joinedAt: newMember.joinedAt.toISOString(),
      userName: '', // This will be updated by the UI or query invalidation
      userEmail: '',
    }
  },
) as unknown as (opts: { data: ProjectMemberInput }) => Promise<ProjectMember>

export const updateProjectMemberFn = createServerFn({ method: 'POST' }).handler(
  async ({ data: typedInput }: { data: unknown }) => {
    const input = typedInput as {
      projectId: string
      userId: string
      data: { role: ProjectMemberRole }
    }
    if (process.env.VITE_E2E === 'true') {
      return { success: true }
    }

    const { getDb } = await import('@/shared/lib/db')
    const db = getDb()

    await db
      .update(projectMembers)
      .set({
        role: input.data.role,
      })
      .where(
        and(eq(projectMembers.projectId, input.projectId), eq(projectMembers.userId, input.userId)),
      )

    return { success: true }
  },
) as unknown as (opts: {
  data: {
    projectId: string
    userId: string
    data: { role: ProjectMemberRole }
  }
}) => Promise<{ success: boolean }>

export const removeProjectMemberFn = createServerFn({ method: 'POST' }).handler(
  async ({ data: typedInput }: { data: unknown }) => {
    const input = typedInput as { projectId: string; userId: string }
    if (process.env.VITE_E2E === 'true') {
      return { success: true }
    }

    const { getDb } = await import('@/shared/lib/db')
    const db = getDb()

    await db
      .delete(projectMembers)
      .where(
        and(eq(projectMembers.projectId, input.projectId), eq(projectMembers.userId, input.userId)),
      )

    return { success: true }
  },
) as unknown as (opts: {
  data: { projectId: string; userId: string }
}) => Promise<{ success: boolean }>
