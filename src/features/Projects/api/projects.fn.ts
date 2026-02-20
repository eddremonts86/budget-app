import { createServerFn } from '@tanstack/react-start'
import { desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/shared/lib/db'
import { projects } from '@/shared/lib/db/schema'
import type { Project } from '../model/types'

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
  async ({ data }: { data: unknown }) => {
    const { pageParam, limit: limitParam } = (data as { pageParam?: number; limit?: number }) || {}
    const page = pageParam || 1
    const limit = limitParam || 100 // Default to 100 for projects as we usually want all
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
  },
) as unknown as (opts: { data: { pageParam?: number; limit?: number } }) => Promise<Project[]>

export const getProjectByIdFn = createServerFn({ method: 'GET' }).handler(
  async ({ data: id }: { data: unknown }) => {
    const result = await db
      .select()
      .from(projects)
      .where(eq(projects.id, id as string))
    if (!result.length) return null
    const item = result[0]
    return {
      ...item,
      startDate: item.startDate ? item.startDate.toISOString() : '',
      endDate: item.endDate ? item.endDate.toISOString() : '',
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }
  },
) as unknown as (opts: { data: string }) => Promise<Project | null>

export const createProjectFn = createServerFn({ method: 'POST' }).handler(
  async ({ data }: { data: unknown }) => {
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
  },
) as unknown as (opts: { data: z.infer<typeof projectSchema> }) => Promise<Project>

export const updateProjectFn = createServerFn({ method: 'POST' }).handler(
  async ({ data }: { data: unknown }) => {
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
  },
) as unknown as (opts: {
  data: { id: string; data: Partial<z.infer<typeof projectSchema>> }
}) => Promise<Project>

export const deleteProjectFn = createServerFn({ method: 'POST' }).handler(
  async ({ data: id }: { data: unknown }) => {
    await db.delete(projects).where(eq(projects.id, id as string))
    return { success: true }
  },
) as unknown as (opts: { data: string }) => Promise<{ success: boolean }>
