import { createServerFn } from '@tanstack/react-start'
import { eq, ilike } from 'drizzle-orm'
import { z } from 'zod'
import { categories } from '@/shared/lib/db/schema'

export const categorySchema = z.object({
  name: z.string().min(1),
  color: z.string().min(1),
})

export type CategoryInput = z.infer<typeof categorySchema>

const categoryListParamsSchema = z
  .object({
    pageParam: z.number().optional(),
    limit: z.number().optional(),
    search: z.string().optional(),
  })
  .optional()

const updateCategoryPayloadSchema = z.object({
  id: z.string().min(1),
  data: categorySchema.partial(),
})

export const getCategoriesFn = createServerFn({ method: 'GET' })
  .inputValidator(categoryListParamsSchema)
  .handler(async ({ data }) => {
    if (process.env.VITE_E2E === 'true') {
      return {
        data: Array.from({ length: 5 }).map((_, i) => ({
          id: i.toString(),
          name: `Category ${i}`,
          color: '#000000',
        })),
        nextPage: undefined,
        totalCount: 5,
      }
    }

    try {
      const { getDb } = await import('@/shared/lib/db/index')
      const db = getDb()
      const { pageParam, limit: limitParam, search } = data || {}
      const page = pageParam || 1
      const limit = Math.min(limitParam || 10, 100)
      const offset = (page - 1) * limit

      const whereClause = search ? ilike(categories.name, `%${search}%`) : undefined

      const [items, total] = await Promise.all([
        db.select().from(categories).where(whereClause).limit(limit).offset(offset),
        db.$count(categories, whereClause),
      ])

      const totalPages = Math.ceil(total / limit)
      const nextPage = page < totalPages ? page + 1 : undefined

      return {
        data: items,
        nextPage,
        totalCount: total,
      }
    } catch {
      return {
        data: [],
        nextPage: undefined,
        totalCount: 0,
      }
    }
  })

export const getCategoryByIdFn = createServerFn({ method: 'GET' })
  .inputValidator(z.string().optional())
  .handler(async ({ data: id }) => {
    if (process.env.VITE_E2E === 'true') {
      return {
        id: id || '1',
        name: 'Category 1',
        color: '#000000',
      }
    }

    try {
      if (!id) throw new Error('ID is required')
      const { getDb } = await import('@/shared/lib/db/index')
      const db = getDb()
      const result = await db.select().from(categories).where(eq(categories.id, id)).limit(1)
      return result[0] || null
    } catch {
      return null
    }
  })

export const createCategoryFn = createServerFn({ method: 'POST' })
  .inputValidator(categorySchema)
  .handler(async ({ data }) => {
    if (process.env.VITE_E2E === 'true') {
      return {
        id: crypto.randomUUID(),
        name: data.name,
        color: data.color,
      }
    }

    const { getDb } = await import('@/shared/lib/db/index')
    const db = getDb()

    const [newItem] = await db
      .insert(categories)
      .values({
        id: crypto.randomUUID(),
        name: data.name,
        color: data.color,
      })
      .returning()
    return newItem
  })

export const updateCategoryFn = createServerFn({ method: 'POST' })
  .inputValidator(updateCategoryPayloadSchema)
  .handler(async ({ data }) => {
    if (process.env.VITE_E2E === 'true') {
      return {
        id: data.id,
        name: data.data.name || 'Category 1',
        color: data.data.color || '#000000',
      }
    }

    const { getDb } = await import('@/shared/lib/db/index')
    const db = getDb()
    const [updatedItem] = await db
      .update(categories)
      .set(data.data)
      .where(eq(categories.id, data.id))
      .returning()
    return updatedItem
  })

export const deleteCategoryFn = createServerFn({ method: 'POST' })
  .inputValidator(z.string().optional())
  .handler(async ({ data: id }) => {
    if (process.env.VITE_E2E === 'true') {
      return { success: true }
    }

    if (!id) throw new Error('ID is required')
    const { getDb } = await import('@/shared/lib/db/index')
    const db = getDb()
    await db.delete(categories).where(eq(categories.id, id))
    return { success: true }
  })
