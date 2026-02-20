import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/shared/lib/db'
import { categories } from '@/shared/lib/db/schema'

export const categorySchema = z.object({
  name: z.string().min(1),
  color: z.string().min(1),
})

export type CategoryInput = z.infer<typeof categorySchema>

export const getCategoriesFn = createServerFn({ method: 'GET' }).handler(
  async ({ data }: { data: unknown }) => {
    const { pageParam, limit: limitParam } = (data as { pageParam?: number; limit?: number }) || {}
    const page = pageParam || 1
    const limit = limitParam || 10
    const offset = (page - 1) * limit

    const [items, total] = await Promise.all([
      db.select().from(categories).limit(limit).offset(offset),
      db.$count(categories),
    ])

    const totalPages = Math.ceil(total / limit)
    const nextPage = page < totalPages ? page + 1 : undefined

    return {
      data: items,
      nextPage,
      totalCount: total,
    }
  },
)

export const getCategoryByIdFn = createServerFn({ method: 'GET' }).handler(
  async ({ data: id }: { data: unknown }) => {
    const result = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id as string))
    return result[0] || null
  },
)

export const createCategoryFn = createServerFn({ method: 'POST' }).handler(
  async ({ data }: { data: unknown }) => {
    // Manual validation
    const parsed = categorySchema.safeParse(data)
    if (!parsed.success) {
      throw new Error(`Invalid input: ${parsed.error.message}`)
    }
    const input = parsed.data

    const [newItem] = await db
      .insert(categories)
      .values({
        id: crypto.randomUUID(),
        name: input.name,
        color: input.color,
      })
      .returning()
    return newItem
  },
) as unknown as (opts: { data: CategoryInput }) => Promise<typeof categories.$inferSelect>

export const updateCategoryFn = createServerFn({ method: 'POST' }).handler(
  async ({ data }: { data: unknown }) => {
    const { id, data: updateData } = data as {
      id: string
      data: Partial<z.infer<typeof categorySchema>>
    }
    const [updatedItem] = await db
      .update(categories)
      .set(updateData)
      .where(eq(categories.id, id))
      .returning()
    return updatedItem
  },
) as unknown as (opts: {
  data: { id: string; data: Partial<CategoryInput> }
}) => Promise<typeof categories.$inferSelect>

export const deleteCategoryFn = createServerFn({ method: 'POST' }).handler(
  async ({ data: id }: { data: unknown }) => {
    await db.delete(categories).where(eq(categories.id, id as string))
    return { success: true }
  },
) as unknown as (opts: { data: string }) => Promise<{ success: boolean }>
