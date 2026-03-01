import { createServerFn } from '@tanstack/react-start'
import { desc, eq, and, inArray, count } from 'drizzle-orm'
import { projects, departments, projectMembers, users } from '@/shared/lib/db/schema'

export interface Project {
  id: string
  name: string
  description: string | null
  startDate: string
  endDate: string
  technologies: string[]
  status: 'active' | 'completed' | 'on_hold' | 'planning' | 'cancelled'
  type: 'internal' | 'external' | 'research' | 'maintenance'
  priority: 'low' | 'medium' | 'high' | string | null
  budget: number
  departmentId: string | null
  team: { userId: string; role: ProjectMemberRole }[]
  createdAt: string
  updatedAt: string
}

export interface ProjectInput {
  name: string
  description: string | null
  startDate: string
  endDate: string
  technologies: string[]
  status: Project['status']
  type: Project['type']
  priority: Project['priority']
  budget: number
  departmentId: string | null
  team: { userId: string; role: ProjectMemberRole }[]
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

export interface ProjectMemberInput {
  projectId: string
  userId: string
  role: ProjectMemberRole
}

export interface ProjectListResponse {
  data: Project[]
  nextPage?: number
  totalCount: number
}

export const getProjectsFn = createServerFn({ method: 'GET' }).handler(
  async ({
    data,
  }: {
    data?: { pageParam?: number; limit?: number }
  }): Promise<ProjectListResponse> => {
    try {
      console.log('getProjectsFn: Starting fetch', data)
      const { pageParam, limit: limitParam } = data || {}
      const page = pageParam || 1
      const limit = limitParam || 100
      const offset = (page - 1) * limit

      const { getDb } = await import('@/shared/lib/db')
      const db = getDb()
      console.log('getProjectsFn: DB initialized')

      console.log('getProjectsFn: Querying DB', { limit, offset })
      const [items, totalResult] = await Promise.all([
        db.select().from(projects).limit(limit).offset(offset).orderBy(desc(projects.createdAt)),
        db.select({ count: count() }).from(projects),
      ])

      const total = totalResult[0]?.count ?? 0
      console.log(`getProjectsFn: Found ${items.length} items from projects table, total ${total}`)

      if (!items || items.length === 0) {
        console.log('getProjectsFn: No items found, returning empty array')
        return { data: [], totalCount: total }
      }

      const projectIds = items.map((i) => i.id)
      console.log('getProjectsFn: Fetching members for IDs:', projectIds)
      const allMembers =
        projectIds.length > 0
          ? await db
              .select()
              .from(projectMembers)
              .where(inArray(projectMembers.projectId, projectIds))
          : []

      console.log(`getProjectsFn: Found ${allMembers.length} members total`)

      const projectsData: Project[] = items.map((item) => {
        try {
          const team = (allMembers || [])
            .filter((m) => m.projectId === item.id)
            .map((m) => ({
              userId: m.userId,
              role: m.role as ProjectMemberRole,
            }))

          return {
            id: item.id,
            name: item.name,
            description: item.description,
            startDate: item.startDate ? item.startDate.toISOString() : '',
            endDate: item.endDate ? item.endDate.toISOString() : '',
            technologies: Array.isArray(item.technologies) ? (item.technologies as string[]) : [],
            status: (item.status as Project['status']) || 'active',
            type: (item.type as Project['type']) || 'internal',
            priority: (item.priority as Project['priority']) || 'medium',
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
        } catch (err) {
          console.error('Error mapping project item:', item.id, err)
          throw err
        }
      })

      const totalPages = Math.ceil(total / limit)
      const nextPage = page < totalPages ? page + 1 : undefined

      console.log('getProjectsFn: Success, returning', projectsData.length, 'projects')
      return {
        data: projectsData,
        nextPage,
        totalCount: total,
      }
    } catch (error) {
      console.error('getProjectsFn ERROR:', error)
      throw error
    }
  },
)

export const getProjectByIdFn = createServerFn({ method: 'GET' }).handler(
  async ({ data: id }: { data: unknown }): Promise<Project | null> => {
    try {
      const { getDb } = await import('@/shared/lib/db')
      const db = getDb()
      const [item] = await db
        .select()
        .from(projects)
        .where(eq(projects.id, id as string))
        .limit(1)

      if (!item) return null

      const members = await db
        .select()
        .from(projectMembers)
        .where(eq(projectMembers.projectId, item.id))

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
        technologies: item.technologies || [],
        status: item.status as Project['status'],
        type: item.type as Project['type'],
        priority: (item.priority as Project['priority']) || 'medium',
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
  async ({ data: untypedInput }: { data: unknown }): Promise<Project> => {
    try {
      const input = untypedInput as ProjectInput
      const { getDb } = await import('@/shared/lib/db')
      const db = getDb()
      const [newItem] = await db
        .insert(projects)
        .values({
          id: crypto.randomUUID(),
          name: input.name,
          description: input.description,
          startDate: input.startDate ? new Date(input.startDate) : undefined,
          endDate: input.endDate ? new Date(input.endDate) : undefined,
          technologies: input.technologies,
          status: input.status as 'active' | 'completed' | 'on_hold' | 'planning' | 'cancelled',
          type: input.type as 'internal' | 'external' | 'research' | 'maintenance',
          priority: input.priority,
          budget: Math.round(input.budget),
          departmentId: input.departmentId,
        })
        .returning()

      if (input.team && input.team.length > 0) {
        await db.insert(projectMembers).values(
          input.team.map((m: { userId: string; role: ProjectMemberRole }) => ({
            id: crypto.randomUUID(),
            projectId: newItem.id,
            userId: m.userId,
            role: m.role as 'owner' | 'manager' | 'contributor' | 'viewer',
          })),
        )
      }

      return {
        id: newItem.id,
        name: newItem.name,
        description: newItem.description,
        startDate: newItem.startDate ? newItem.startDate.toISOString() : '',
        endDate: newItem.endDate ? newItem.endDate.toISOString() : '',
        technologies: newItem.technologies || [],
        status: newItem.status as Project['status'],
        type: newItem.type as Project['type'],
        priority: (newItem.priority as Project['priority']) || 'medium',
        budget: newItem.budget ? Number(newItem.budget) : 0,
        departmentId: newItem.departmentId,
        team: input.team || [],
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
  async ({ data: untypedData }: { data: unknown }): Promise<Project> => {
    const { id, data: updateData } = untypedData as {
      id: string
      data: Partial<ProjectInput>
    }
    try {
      const { getDb } = await import('@/shared/lib/db')
      const db = getDb()
      const [updatedItem] = await db
        .update(projects)
        .set({
          name: updateData.name,
          description: updateData.description,
          startDate: updateData.startDate ? new Date(updateData.startDate) : undefined,
          endDate: updateData.endDate ? new Date(updateData.endDate) : undefined,
          technologies: updateData.technologies,
          status: updateData.status as
            | 'active'
            | 'completed'
            | 'on_hold'
            | 'planning'
            | 'cancelled',
          type: updateData.type as 'internal' | 'external' | 'research' | 'maintenance',
          priority: updateData.priority,
          budget: updateData.budget ? Math.round(updateData.budget) : undefined,
          departmentId: updateData.departmentId,
          updatedAt: new Date(),
        })
        .where(eq(projects.id, id))
        .returning()

      if (updateData.team) {
        await db.delete(projectMembers).where(eq(projectMembers.projectId, id))
        if (updateData.team.length > 0) {
          await db.insert(projectMembers).values(
            updateData.team.map((m: { userId: string; role: ProjectMemberRole }) => ({
              id: crypto.randomUUID(),
              projectId: id,
              userId: m.userId,
              role: m.role as 'owner' | 'manager' | 'contributor' | 'viewer',
            })),
          )
        }
      }

      return {
        id: updatedItem.id,
        name: updatedItem.name,
        description: updatedItem.description,
        startDate: updatedItem.startDate ? updatedItem.startDate.toISOString() : '',
        endDate: updatedItem.endDate ? updatedItem.endDate.toISOString() : '',
        technologies: updatedItem.technologies || [],
        status: updatedItem.status as Project['status'],
        type: updatedItem.type as Project['type'],
        priority: (updatedItem.priority as Project['priority']) || 'medium',
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
  async ({ data: id }: { data: unknown }) => {
    try {
      const { getDb } = await import('@/shared/lib/db')
      const db = getDb()
      await db.delete(projectMembers).where(eq(projectMembers.projectId, id as string))
      await db.delete(projects).where(eq(projects.id, id as string))
      return { success: true }
    } catch (error) {
      console.error('deleteProjectFn ERROR', error)
      throw error
    }
  },
) as unknown as (opts: { data: string }) => Promise<{ success: boolean }>

export const getProjectMembersFn = createServerFn({ method: 'GET' }).handler(
  async ({ data: projectId }: { data: unknown }): Promise<ProjectMember[]> => {
    if (process.env.VITE_E2E === 'true') {
      return [
        {
          id: '1',
          projectId: projectId as string,
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
      .where(eq(projectMembers.projectId, projectId as string))

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
  async ({ data: untypedInput }: { data: unknown }): Promise<ProjectMember> => {
    const typedInput = untypedInput as ProjectMemberInput
    if (process.env.VITE_E2E === 'true') {
      return {
        id: crypto.randomUUID(),
        ...typedInput,
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
        projectId: typedInput.projectId,
        userId: typedInput.userId,
        role: typedInput.role,
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
  async ({ data: untypedInput }: { data: unknown }) => {
    const typedInput = untypedInput as {
      projectId: string
      userId: string
      data: { role: 'owner' | 'manager' | 'contributor' | 'viewer' }
    }
    if (process.env.VITE_E2E === 'true') {
      return { success: true }
    }

    const { getDb } = await import('@/shared/lib/db')
    const db = getDb()

    await db
      .update(projectMembers)
      .set({
        role: typedInput.data.role,
      })
      .where(
        and(
          eq(projectMembers.projectId, typedInput.projectId),
          eq(projectMembers.userId, typedInput.userId),
        ),
      )

    return { success: true }
  },
) as unknown as (opts: {
  data: {
    projectId: string
    userId: string
    data: { role: 'owner' | 'manager' | 'contributor' | 'viewer' }
  }
}) => Promise<{ success: boolean }>

export const removeProjectMemberFn = createServerFn({ method: 'POST' }).handler(
  async ({ data: untypedInput }: { data: unknown }) => {
    const typedInput = untypedInput as { projectId: string; userId: string }
    if (process.env.VITE_E2E === 'true') {
      return { success: true }
    }

    const { getDb } = await import('@/shared/lib/db')
    const db = getDb()

    await db
      .delete(projectMembers)
      .where(
        and(
          eq(projectMembers.projectId, typedInput.projectId),
          eq(projectMembers.userId, typedInput.userId),
        ),
      )

    return { success: true }
  },
) as unknown as (opts: {
  data: { projectId: string; userId: string }
}) => Promise<{ success: boolean }>
