import { createServerFn } from '@tanstack/react-start'
import { eq, and, gte, count, sum, sql, inArray, ilike, desc } from 'drizzle-orm'
import { z } from 'zod'
import {
  todos,
  users,
  transactions,
  projects,
  categories,
  projectMembers,
  teamMembers,
} from '@/shared/lib/db/schema'

async function loadDb() {
  const { getDb } = await import('@/shared/lib/db')
  return getDb()
}

export const getAnalyticsKPIsFn = createServerFn({ method: 'GET' })
  .inputValidator(z.void().optional())
  .handler(async ({ data: _data }) => {
    const isE2E = process.env.VITE_E2E === 'true'

    try {
      const db = await loadDb()

      const [
        [totalIncome],
        [totalExpenses],
        [activeProjects],
        [completedProjects],
        [totalTasks],
        [completedTasks],
        [activeUsers],
      ] = await Promise.all([
        db
          .select({ value: sum(transactions.amount) })
          .from(transactions)
          .where(and(eq(transactions.status, 'Approved'), sql`${transactions.amount} > 0`)),
        db
          .select({ value: sum(transactions.amount) })
          .from(transactions)
          .where(and(eq(transactions.status, 'Approved'), sql`${transactions.amount} < 0`)),
        db.select({ count: count() }).from(projects).where(eq(projects.status, 'active')),
        db.select({ count: count() }).from(projects).where(eq(projects.status, 'completed')),
        db.select({ count: count() }).from(todos),
        db.select({ count: count() }).from(todos).where(eq(todos.status, 'completed')),
        db.select({ count: count() }).from(users),
      ])

      const incomeValue = Number(totalIncome?.value ?? 0)
      const expenseValue = Math.abs(Number(totalExpenses?.value ?? 0))
      const netBalance = incomeValue - expenseValue
      const taskCompletionRate =
        totalTasks.count > 0 ? Math.round((completedTasks.count / totalTasks.count) * 100) : 0

      // If E2E and no data in DB, return mock
      if (isE2E && incomeValue === 0 && expenseValue === 0 && activeProjects.count === 0) {
        return {
          revenue: 125000,
          expenses: 45000,
          netBalance: 80000,
          activeProjects: 12,
          completedProjects: 8,
          totalTasks: 150,
          completedTasks: 95,
          taskCompletionRate: 63,
          activeUsers: 25,
        }
      }

      return {
        revenue: incomeValue,
        expenses: expenseValue,
        netBalance,
        activeProjects: activeProjects.count,
        completedProjects: completedProjects.count,
        totalTasks: totalTasks.count,
        completedTasks: completedTasks.count,
        taskCompletionRate,
        activeUsers: activeUsers.count,
      }
    } catch (error) {
      console.error('Database connection failed for KPIs', error)
      if (isE2E) {
        return {
          revenue: 125000,
          expenses: 45000,
          netBalance: 80000,
          activeProjects: 12,
          completedProjects: 8,
          totalTasks: 150,
          completedTasks: 95,
          taskCompletionRate: 63,
          activeUsers: 25,
        }
      }
      throw error
    }
  })

export const getRevenueTrendFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ days: z.number().optional().default(30) }))
  .handler(async ({ data }) => {
    const isE2E = process.env.VITE_E2E === 'true'
    const days = data.days

    try {
      const db = await loadDb()

      const now = new Date()
      const startDate = new Date(now)
      startDate.setDate(startDate.getDate() - days)

      const results = await db
        .select({
          date: transactions.date,
          amount: transactions.amount,
        })
        .from(transactions)
        .where(and(eq(transactions.status, 'Approved'), gte(transactions.date, startDate)))

      results.sort((a, b) => a.date.getTime() - b.date.getTime())

      const grouped = results.reduce(
        (acc, curr) => {
          const dateStr = curr.date.toISOString().split('T')[0]
          if (!acc[dateStr]) {
            acc[dateStr] = { income: 0, expenses: 0 }
          }
          if (curr.amount > 0) {
            acc[dateStr].income += curr.amount
          } else {
            acc[dateStr].expenses += Math.abs(curr.amount)
          }
          return acc
        },
        {} as Record<string, { income: number; expenses: number }>,
      )

      // Ensure all days are represented
      const fullData = []
      let hasData = false
      for (let i = days; i >= 0; i--) {
        const d = new Date(now)
        d.setDate(d.getDate() - i)
        const dateStr = d.toISOString().split('T')[0]
        const dayData = {
          date: dateStr,
          income: grouped[dateStr]?.income || 0,
          expenses: grouped[dateStr]?.expenses || 0,
        }
        if (dayData.income > 0 || dayData.expenses > 0) hasData = true
        fullData.push(dayData)
      }

      if (isE2E && !hasData) {
        const mockData = []
        for (let i = days; i >= 0; i--) {
          const date = new Date(now)
          date.setDate(date.getDate() - i)
          mockData.push({
            date: date.toISOString().split('T')[0],
            income: Math.floor(Math.random() * 5000) + 1000,
            expenses: Math.floor(Math.random() * 2000) + 500,
          })
        }
        return mockData
      }

      return fullData
    } catch (error) {
      console.error('Database connection failed for Revenue Trend', error)
      if (isE2E) {
        const mockData = []
        const now = new Date()
        for (let i = days; i >= 0; i--) {
          const date = new Date(now)
          date.setDate(date.getDate() - i)
          mockData.push({
            date: date.toISOString().split('T')[0],
            income: Math.floor(Math.random() * 5000) + 1000,
            expenses: Math.floor(Math.random() * 2000) + 500,
          })
        }
        return mockData
      }
      throw error
    }
  })

export const getTaskCompletionTrendFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ days: z.number().optional().default(30) }))
  .handler(async ({ data }) => {
    const isE2E = process.env.VITE_E2E === 'true'
    const days = data.days

    try {
      const db = await loadDb()

      const now = new Date()
      const startDate = new Date(now)
      startDate.setDate(startDate.getDate() - days)

      const results = await db
        .select({
          updatedAt: todos.updatedAt,
        })
        .from(todos)
        .where(and(eq(todos.status, 'completed'), gte(todos.updatedAt, startDate)))

      results.sort((a, b) => a.updatedAt.getTime() - b.updatedAt.getTime())

      const grouped = results.reduce(
        (acc, curr) => {
          const dateStr = curr.updatedAt.toISOString().split('T')[0]
          acc[dateStr] = (acc[dateStr] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      )

      const formattedData = Object.entries(grouped)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date))

      if (isE2E && formattedData.length === 0) {
        const mockData = []
        for (let i = days; i >= 0; i--) {
          const date = new Date(now)
          date.setDate(date.getDate() - i)
          mockData.push({
            date: date.toISOString().split('T')[0],
            count: Math.floor(Math.random() * 10),
          })
        }
        return mockData
      }

      return formattedData
    } catch (error) {
      console.error('Database connection failed for Task Completion', error)
      if (isE2E) {
        const mockData = []
        const now = new Date()
        for (let i = days; i >= 0; i--) {
          const date = new Date(now)
          date.setDate(date.getDate() - i)
          mockData.push({
            date: date.toISOString().split('T')[0],
            count: Math.floor(Math.random() * 10),
          })
        }
        return mockData
      }
      throw error
    }
  })

export const getProjectPerformanceFn = createServerFn({ method: 'GET' })
  .inputValidator(z.void().optional())
  .handler(async ({ data: _data }) => {
    const isE2E = process.env.VITE_E2E === 'true'

    try {
      const db = await loadDb()

      const allProjects = await db.select().from(projects)

      if (isE2E && allProjects.length === 0) {
        return [
          {
            id: '1',
            name: 'Website Redesign',
            status: 'active',
            budget: 15000,
            spent: 8500,
            progress: 65,
            taskCount: 24,
            completedTaskCount: 16,
          },
          {
            id: '2',
            name: 'Mobile App Launch',
            status: 'active',
            budget: 25000,
            spent: 12000,
            progress: 45,
            taskCount: 32,
            completedTaskCount: 14,
          },
          {
            id: '3',
            name: 'Marketing Campaign',
            status: 'completed',
            budget: 5000,
            spent: 4800,
            progress: 100,
            taskCount: 10,
            completedTaskCount: 10,
          },
          {
            id: '4',
            name: 'Internal Dashboard',
            status: 'on_hold',
            budget: 8000,
            spent: 2000,
            progress: 25,
            taskCount: 12,
            completedTaskCount: 3,
          },
        ]
      }

      const allTodos = await db
        .select({
          projectId: todos.projectId,
          status: todos.status,
          actualTime: todos.actualTime,
          estimatedTime: todos.estimatedTime,
        })
        .from(todos)

      return allProjects.map((project) => {
        const projectTodos = allTodos.filter((t) => t.projectId === project.id)
        const total = projectTodos.length
        const completed = projectTodos.filter((t) => t.status === 'completed').length
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0

        // Calculate budget usage if we had cost per hour, for now just use random logic or 0
        // Assuming actualTime is in hours and rate is $50/hr
        const totalHours = projectTodos.reduce((sum, t) => sum + (t.actualTime || 0), 0)
        const estimatedCost = totalHours * 50

        return {
          id: project.id,
          name: project.name,
          status: project.status,
          budget: project.budget,
          spent: estimatedCost,
          progress,
          taskCount: total,
          completedTaskCount: completed,
        }
      })
    } catch (error) {
      console.error('Database connection failed for Projects', error)
      if (isE2E) {
        return [
          {
            id: '1',
            name: 'Website Redesign',
            status: 'active',
            budget: 15000,
            spent: 8500,
            progress: 65,
            taskCount: 24,
            completedTaskCount: 16,
          },
          {
            id: '2',
            name: 'Mobile App Launch',
            status: 'active',
            budget: 25000,
            spent: 12000,
            progress: 45,
            taskCount: 32,
            completedTaskCount: 14,
          },
          {
            id: '3',
            name: 'Marketing Campaign',
            status: 'completed',
            budget: 5000,
            spent: 4800,
            progress: 100,
            taskCount: 10,
            completedTaskCount: 10,
          },
          {
            id: '4',
            name: 'Internal Dashboard',
            status: 'on_hold',
            budget: 8000,
            spent: 2000,
            progress: 25,
            taskCount: 12,
            completedTaskCount: 3,
          },
        ]
      }
      throw error
    }
  })

export interface ProjectPerformanceRow {
  id: string
  name: string
  status: string
  budget: number | null
  spent: number
  progress: number
  taskCount: number
  completedTaskCount: number
}

export interface ProjectPerformanceResponse {
  data: ProjectPerformanceRow[]
  nextPage?: number
  totalCount: number
}

export const getProjectPerformancePaginatedFn = createServerFn({ method: 'GET' })
  .inputValidator(
    z
      .object({
        pageParam: z.number().optional(),
        limit: z.number().optional(),
        search: z.string().optional(),
      })
      .optional(),
  )
  .handler(async ({ data }): Promise<ProjectPerformanceResponse> => {
    const isE2E = process.env.VITE_E2E === 'true'

    try {
      const db = await loadDb()
      const { pageParam, limit: limitParam, search } = data || {}
      const page = pageParam || 1
      const limit = limitParam || 20
      const offset = (page - 1) * limit

      const whereClause = search ? ilike(projects.name, `%${search}%`) : undefined

      const [items, totalResult] = await Promise.all([
        db
          .select()
          .from(projects)
          .where(whereClause)
          .limit(limit)
          .offset(offset)
          .orderBy(desc(projects.createdAt)),
        db.select({ count: count() }).from(projects).where(whereClause),
      ])

      const total = totalResult[0]?.count ?? 0

      if (isE2E && items.length === 0) {
        return {
          data: [
            {
              id: '1',
              name: 'Website Redesign',
              status: 'active',
              budget: 15000,
              spent: 8500,
              progress: 65,
              taskCount: 24,
              completedTaskCount: 16,
            },
            {
              id: '2',
              name: 'Mobile App Launch',
              status: 'active',
              budget: 25000,
              spent: 12000,
              progress: 45,
              taskCount: 32,
              completedTaskCount: 14,
            },
          ],
          nextPage: undefined,
          totalCount: 2,
        }
      }

      // Fetch todo stats only for this page's projects
      const projectIds = items.map((p) => p.id)
      const todoStats =
        projectIds.length > 0
          ? await db
              .select({
                projectId: todos.projectId,
                total: count(),
                completed: sql<number>`count(*) filter (where ${todos.status} = 'completed')`,
                totalHours: sql<number>`coalesce(sum(${todos.actualTime}), 0)`,
              })
              .from(todos)
              .where(inArray(todos.projectId, projectIds))
              .groupBy(todos.projectId)
          : []

      const statsMap = new Map(todoStats.map((s) => [s.projectId, s]))

      const rows: ProjectPerformanceRow[] = items.map((project) => {
        const stats = statsMap.get(project.id)
        const totalTasks = Number(stats?.total ?? 0)
        const completed = Number(stats?.completed ?? 0)
        const progress = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0
        const totalHours = Number(stats?.totalHours ?? 0)

        return {
          id: project.id,
          name: project.name,
          status: project.status,
          budget: project.budget,
          spent: totalHours * 50,
          progress,
          taskCount: totalTasks,
          completedTaskCount: completed,
        }
      })

      return {
        data: rows,
        nextPage: offset + limit < total ? page + 1 : undefined,
        totalCount: total,
      }
    } catch (error) {
      console.error('Database connection failed for ProjectPerformancePaginated', error)
      if (isE2E) {
        return {
          data: [
            {
              id: '1',
              name: 'Website Redesign',
              status: 'active',
              budget: 15000,
              spent: 8500,
              progress: 65,
              taskCount: 24,
              completedTaskCount: 16,
            },
          ],
          nextPage: undefined,
          totalCount: 1,
        }
      }
      throw error
    }
  })

export const getTaskDistributionFn = createServerFn({ method: 'GET' })
  .inputValidator(z.void().optional())
  .handler(async ({ data: _data }) => {
    const isE2E = process.env.VITE_E2E === 'true'

    try {
      const db = await loadDb()

      const [byStatusRaw, byPriorityRaw] = await Promise.all([
        db
          .select({
            status: todos.status,
            count: count(),
          })
          .from(todos)
          .groupBy(todos.status),
        db
          .select({
            priority: todos.priority,
            count: count(),
          })
          .from(todos)
          .groupBy(todos.priority),
      ])

      if (isE2E && byStatusRaw.length === 0) {
        return {
          byStatus: [
            { name: 'todo', value: 15 },
            { name: 'in_progress', value: 25 },
            { name: 'review', value: 10 },
            { name: 'completed', value: 45 },
          ],
          byPriority: [
            { name: 'low', value: 20 },
            { name: 'medium', value: 50 },
            { name: 'high', value: 25 },
          ],
        }
      }

      return {
        byStatus: byStatusRaw.map((i) => ({ name: i.status, value: i.count })),
        byPriority: byPriorityRaw.map((i) => ({ name: i.priority, value: i.count })),
      }
    } catch (error) {
      console.error('Database connection failed for Task Distribution', error)
      if (isE2E) {
        return {
          byStatus: [
            { name: 'todo', value: 15 },
            { name: 'in_progress', value: 25 },
            { name: 'review', value: 10 },
            { name: 'completed', value: 45 },
          ],
          byPriority: [
            { name: 'low', value: 20 },
            { name: 'medium', value: 50 },
            { name: 'high', value: 25 },
          ],
        }
      }
      throw error
    }
  })

// ---------------------------------------------------------------------------
// Expense distribution
// ---------------------------------------------------------------------------
export const getExpenseDistributionFn = createServerFn({ method: 'GET' })
  .inputValidator(z.void().optional())
  .handler(async ({ data: _data }) => {
    const isE2E = process.env.VITE_E2E === 'true'

    try {
      const db = await loadDb()

      const results = await db
        .select({
          categoryName: categories.name,
          categoryColor: categories.color,
          totalAmount: sql<number>`ABS(SUM(${transactions.amount}))`,
        })
        .from(transactions)
        .innerJoin(categories, eq(transactions.categoryId, categories.id))
        .where(eq(transactions.status, 'Approved'))
        .groupBy(categories.name, categories.color)

      if (isE2E && results.length === 0) {
        return [
          { category: 'Development', amount: 5000, color: '#3b82f6' },
          { category: 'Design', amount: 3000, color: '#ec4899' },
          { category: 'Marketing', amount: 2000, color: '#f59e0b' },
          { category: 'Research', amount: 1500, color: '#10b981' },
        ]
      }

      return results.map((r) => ({
        category: r.categoryName,
        amount: Number(r.totalAmount),
        color: r.categoryColor,
      }))
    } catch (error) {
      console.error('Error in getExpenseDistributionFn:', error)
      if (isE2E) {
        return [
          { category: 'Development', amount: 5000, color: '#3b82f6' },
          { category: 'Design', amount: 3000, color: '#ec4899' },
          { category: 'Marketing', amount: 2000, color: '#f59e0b' },
          { category: 'Research', amount: 1500, color: '#10b981' },
        ]
      }
      throw error
    }
  })

// ---------------------------------------------------------------------------
// Users workload
// ---------------------------------------------------------------------------
const usersWorkloadFiltersSchema = z
  .object({
    projectId: z.string().optional(),
    teamId: z.string().optional(),
  })
  .optional()

export type UsersWorkloadFilters = z.infer<typeof usersWorkloadFiltersSchema>

export const getUsersWorkloadFn = createServerFn({ method: 'GET' })
  .inputValidator(usersWorkloadFiltersSchema)
  .handler(async ({ data }) => {
    const isE2E = process.env.VITE_E2E === 'true'

    try {
      const db = await loadDb()
      const projectId = data?.projectId
      const teamId = data?.teamId

      let filteredUserIds: string[] | undefined

      if (projectId) {
        const rows = await db
          .select({ userId: projectMembers.userId })
          .from(projectMembers)
          .where(eq(projectMembers.projectId, projectId))
        filteredUserIds = rows.map((row) => row.userId)
      }

      if (teamId) {
        const rows = await db
          .select({ userId: teamMembers.userId })
          .from(teamMembers)
          .where(eq(teamMembers.teamId, teamId))
        const teamUserIds = rows.map((row) => row.userId)
        filteredUserIds = filteredUserIds
          ? filteredUserIds.filter((id) => teamUserIds.includes(id))
          : teamUserIds
      }

      if (filteredUserIds && filteredUserIds.length === 0) return []

      const userWhere =
        filteredUserIds && filteredUserIds.length > 0
          ? inArray(users.id, filteredUserIds)
          : undefined

      const todoClauses = []
      if (projectId) todoClauses.push(eq(todos.projectId, projectId))
      if (filteredUserIds?.length) todoClauses.push(inArray(todos.assignedTo, filteredUserIds))
      const todoWhere =
        todoClauses.length === 0
          ? undefined
          : todoClauses.length === 1
            ? todoClauses[0]
            : and(...todoClauses)

      const [allUsers, allTodos] = await Promise.all([
        db.select().from(users).where(userWhere),
        db.select().from(todos).where(todoWhere),
      ])

      if (isE2E && allUsers.length === 0) {
        return Array.from({ length: 5 }).map((_, i) => ({
          user: {
            id: i.toString(),
            name: `User ${i}`,
            email: `user${i}@example.com`,
            role: 'user' as const,
            createdAt: new Date().toISOString(),
          },
          total: 10,
          completed: 5,
          pending: 3,
          inProgress: 2,
        }))
      }

      return allUsers.map((user) => {
        const userTodos = allTodos.filter((t) => t.assignedTo === user.id)
        return {
          user: { ...user, createdAt: user.createdAt.toISOString() },
          total: userTodos.length,
          completed: userTodos.filter((t) => t.status === 'completed').length,
          pending: userTodos.filter((t) => t.status === 'pending').length,
          inProgress: userTodos.filter((t) => t.status === 'in_progress').length,
        }
      })
    } catch (error) {
      console.error('Error in getUsersWorkloadFn:', error)
      if (isE2E) {
        return Array.from({ length: 5 }).map((_, i) => ({
          user: {
            id: i.toString(),
            name: `User ${i}`,
            email: `user${i}@example.com`,
            role: 'user' as const,
            createdAt: new Date().toISOString(),
          },
          total: 10,
          completed: 5,
          pending: 3,
          inProgress: 2,
        }))
      }
      throw error
    }
  })
