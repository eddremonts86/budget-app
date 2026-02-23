import { createServerFn } from '@tanstack/react-start'
import { desc, eq } from 'drizzle-orm'
import { z } from 'zod'
// import { db } from '@/shared/lib/db'
import { projects } from '@/shared/lib/db/schema'

export const projectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  technologies: z.array(z.string()).optional(),
  status: z.enum(['active', 'completed', 'on_hold']).default('active'),
  team: z.array(z.string()).optional(),
})

export type ProjectInput = z.infer<typeof projectSchema>

export const getProjectsFn = createServerFn({ method: 'GET' }).handler(
  async ({ data }: { data?: { pageParam?: number; limit?: number } }) => {
    if (process.env.VITE_E2E === 'true') {
      return Array.from({ length: 5 }).map((_, i) => ({
        id: i.toString(),
        name: `Project ${i}`,
        description: `Description for Project ${i}`,
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        technologies: ['React', 'TypeScript'],
        status: 'active' as const,
        team: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }))
    }

    try {
      const { getDb } = await import('@/shared/lib/db')
      const db = getDb()
      const { pageParam, limit: limitParam } = data || {}
      const page = pageParam || 1
      const limit = limitParam || 100
      const offset = (page - 1) * limit

      const items = await db
        .select()
        .from(projects)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(projects.createdAt))

      return items.map((item) => ({
        ...item,
        startDate: item.startDate ? item.startDate.toISOString() : '',
        endDate: item.endDate ? item.endDate.toISOString() : '',
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      }))
    } catch (error) {
      console.error('Error in getProjectsFn:', error)
      return []
    }
  },
)

export const getProjectByIdFn = createServerFn({ method: 'GET' }).handler(
  async ({ data: id }: { data: string | undefined }) => {
    if (process.env.VITE_E2E === 'true') {
      return {
        id: id || '1',
        name: 'Project 1',
        description: 'Description for Project 1',
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        technologies: ['React', 'TypeScript'],
        status: 'active' as const,
        team: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }

    try {
      if (!id) throw new Error('ID is required')
      const { getDb } = await import('@/shared/lib/db')
      const db = getDb()
      const result = await db.select().from(projects).where(eq(projects.id, id))
      if (!result.length) return null
      const item = result[0]
      return {
        ...item,
        startDate: item.startDate ? item.startDate.toISOString() : '',
        endDate: item.endDate ? item.endDate.toISOString() : '',
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      }
    } catch (error) {
      console.error('Error in getProjectByIdFn:', error)
      return null
    }
  },
)

export const createProjectFn = createServerFn({ method: 'POST' }).handler(
  async ({ data }: { data: unknown }) => {
    if (process.env.VITE_E2E === 'true') {
      const input = data as ProjectInput
      return {
        id: crypto.randomUUID(),
        name: input.name,
        description: input.description,
        startDate: input.startDate || '',
        endDate: input.endDate || '',
        technologies: input.technologies || [],
        status: input.status,
        team: input.team || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }

    try {
      const { getDb } = await import('@/shared/lib/db')
      const db = getDb()
      // Manual validation
      const parsed = projectSchema.safeParse(data)
      if (!parsed.success) {
        throw new Error(`Invalid input: ${parsed.error.message}`)
      }
      const input = parsed.data

      const [newItem] = await db
        .insert(projects)
        .values({
          id: crypto.randomUUID(),
          name: input.name,
          description: input.description,
          startDate: input.startDate ? new Date(input.startDate) : null,
          endDate: input.endDate ? new Date(input.endDate) : null,
          technologies: input.technologies,
          status: input.status,
          team: input.team,
        })
        .returning()

      return {
        ...newItem,
        startDate: newItem.startDate ? newItem.startDate.toISOString() : '',
        endDate: newItem.endDate ? newItem.endDate.toISOString() : '',
        createdAt: newItem.createdAt.toISOString(),
        updatedAt: newItem.updatedAt.toISOString(),
      }
    } catch (error) {
      console.error('Error in createProjectFn:', error)
      throw error
    }
  },
)

export const updateProjectFn = createServerFn({ method: 'POST' }).handler(
  async ({ data }: { data: unknown }) => {
    if (process.env.VITE_E2E === 'true') {
      const { id, data: updateData } = data as {
        id: string
        data: Partial<ProjectInput>
      }
      return {
        id,
        name: updateData.name || 'Project 1',
        description: updateData.description || 'Description',
        startDate: updateData.startDate || '',
        endDate: updateData.endDate || '',
        technologies: updateData.technologies || [],
        status: updateData.status || 'active',
        team: updateData.team || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }

    try {
      const { getDb } = await import('@/shared/lib/db')
      const db = getDb()
      const { id, data: updateData } = data as {
        id: string
        data: Partial<z.infer<typeof projectSchema>>
      }

      const [updatedItem] = await db
        .update(projects)
        .set({
          ...updateData,
          startDate: updateData.startDate ? new Date(updateData.startDate) : undefined,
          endDate: updateData.endDate ? new Date(updateData.endDate) : undefined,
          updatedAt: new Date(),
        })
        .where(eq(projects.id, id))
        .returning()

      return {
        ...updatedItem,
        startDate: updatedItem.startDate ? updatedItem.startDate.toISOString() : '',
        endDate: updatedItem.endDate ? updatedItem.endDate.toISOString() : '',
        createdAt: updatedItem.createdAt.toISOString(),
        updatedAt: updatedItem.updatedAt.toISOString(),
      }
    } catch (error) {
      console.error('Error in updateProjectFn:', error)
      throw error
    }
  },
)

export const deleteProjectFn = createServerFn({ method: 'POST' }).handler(
  async ({ data: id }: { data: string | undefined }) => {
    if (process.env.VITE_E2E === 'true') {
      return { success: true }
    }

    try {
      if (!id) throw new Error('ID is required')
      const { getDb } = await import('@/shared/lib/db')
      const db = getDb()
      await db.delete(projects).where(eq(projects.id, id))
      return { success: true }
    } catch (error) {
      console.error('Error in deleteProjectFn:', error)
      throw error
    }
  },
)
