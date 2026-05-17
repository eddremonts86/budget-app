import { createServerFn } from '@tanstack/react-start'
import { desc } from 'drizzle-orm'
import { departments } from '@/shared/lib/db/schema'
import type { Department } from '../model/types'

export const getDepartmentsFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Department[]> => {
    if (process.env.VITE_E2E === 'true') {
      return [
        {
          id: '1',
          name: 'Engineering',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Sales',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '3',
          name: 'Marketing',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]
    }

    try {
      const { getDb } = await import('@/shared/lib/db/index')
      const db = getDb()

      const items = await db
        .select({
          id: departments.id,
          name: departments.name,
          managerId: departments.managerId,
          budget: departments.budget,
          location: departments.location,
          createdAt: departments.createdAt,
          updatedAt: departments.updatedAt,
        })
        .from(departments)
        .orderBy(desc(departments.name))
        .limit(500)

      return items.map((item) => ({
        id: item.id,
        name: item.name,
        managerId: item.managerId,
        budget: item.budget,
        location: item.location,
        createdAt:
          item.createdAt instanceof Date ? item.createdAt.toISOString() : new Date().toISOString(),
        updatedAt:
          item.updatedAt instanceof Date ? item.updatedAt.toISOString() : new Date().toISOString(),
      }))
    } catch (error) {
      console.error('Error in getDepartmentsFn:', error)
      throw error
    }
  },
)
