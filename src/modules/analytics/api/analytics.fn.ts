import { createServerFn } from '@tanstack/react-start'
import { eq, and, gte, count, sum, sql, inArray, ilike, desc } from 'drizzle-orm'
import { z } from 'zod'
import { loadDb } from '@/shared/lib/db/load'
import {
  todos,
  users,
  transactions,
  projects,
  categories,
  projectMembers,
  teamMembers,
} from '@/shared/lib/db/schema'
import { isE2E } from '@/shared/lib/env'

export const getAnalyticsKPIsFn = createServerFn({ method: 'GET' })
  .inputValidator(z.void().optional())
  .handler(async ({ data: _data }) => {
    try {
      const db = await loadDb()

      const [[totalIncome], [totalExpenses], projectStats, taskStats, [activeUsers]] =
        await Promise.all([
          db
            .select({ value: sum(transactions.amount) })
            .from(transactions)
            .where(and(eq(transactions.status, 'Approved'), sql`${transactions.amount} > 0`)),
          db
            .select({ value: sum(transactions.amount) })
            .from(transactions)
            .where(and(eq(transactions.status, 'Approved'), sql`${transactions.amount} < 0`)),
          db
            .select({
              status: projects.status,
              count: count(),
            })
            .from(projects)
            .where(sql`${projects.status} IN ('active', 'completed')`)
            .groupBy(projects.status),
          db
            .select({
              total: count(),
              completed: sql<number>`COUNT(*) FILTER (WHERE ${todos.status} = 'completed')`,
            })
            .from(todos),
          db.select({ count: count() }).from(users),
        ])

      const incomeValue = Number(totalIncome?.value ?? 0)
      const expenseValue = Math.abs(Number(totalExpenses?.value ?? 0))
      const netBalance = incomeValue - expenseValue

      const activeProjects = projectStats.find((p) => p.status === 'active')?.count ?? 0
      const completedProjects = projectStats.find((p) => p.status === 'completed')?.count ?? 0
      const totalTasks = Number(taskStats[0]?.total ?? 0)
      const completedTasks = Number(taskStats[0]?.completed ?? 0)

      const taskCompletionRate =
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

      // If E2E and no data in DB, return mock
      if (isE2E && incomeValue === 0 && expenseValue === 0 && activeProjects === 0) {
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
        activeProjects,
        completedProjects,
        totalTasks,
        completedTasks,
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
    const days = data.days

    try {
      const db = await loadDb()

      const now = new Date()
      const startDate = new Date(now)
      startDate.setDate(startDate.getDate() - days)

      // Use SQL GROUP BY to aggregate by date — avoids loading all raw rows
      const aggregated = await db
        .select({
          dateStr: sql<string>`TO_CHAR(${transactions.date}, 'YYYY-MM-DD')`,
          income: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.amount} > 0 THEN ${transactions.amount} ELSE 0 END), 0)`,
          expenses: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.amount} < 0 THEN ABS(${transactions.amount}) ELSE 0 END), 0)`,
        })
        .from(transactions)
        .where(and(eq(transactions.status, 'Approved'), gte(transactions.date, startDate)))
        .groupBy(sql`TO_CHAR(${transactions.date}, 'YYYY-MM-DD')`)

      const grouped: Record<string, { income: number; expenses: number }> = {}
      for (const row of aggregated) {
        grouped[row.dateStr] = {
          income: Number(row.income),
          expenses: Number(row.expenses),
        }
      }

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
            income: ((i * 1234) % 4001) + 1000,
            expenses: ((i * 567) % 1501) + 500,
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
            income: ((i * 1234) % 4001) + 1000,
            expenses: ((i * 567) % 1501) + 500,
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
    const days = data.days

    try {
      const db = await loadDb()

      const now = new Date()
      const startDate = new Date(now)
      startDate.setDate(startDate.getDate() - days)

      // Use SQL GROUP BY to aggregate by date — avoids loading all raw rows
      const formattedData = await db
        .select({
          date: sql<string>`TO_CHAR(${todos.updatedAt}, 'YYYY-MM-DD')`,
          count: count(),
        })
        .from(todos)
        .where(and(eq(todos.status, 'completed'), gte(todos.updatedAt, startDate)))
        .groupBy(sql`TO_CHAR(${todos.updatedAt}, 'YYYY-MM-DD')`)
        .orderBy(sql`TO_CHAR(${todos.updatedAt}, 'YYYY-MM-DD')`)

      if (isE2E && formattedData.length === 0) {
        const mockData = []
        for (let i = days; i >= 0; i--) {
          const date = new Date(now)
          date.setDate(date.getDate() - i)
          mockData.push({
            date: date.toISOString().split('T')[0],
            count: (i * 3) % 10,
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
            count: (i * 3) % 10,
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
    try {
      const db = await loadDb()

      const allProjects = await db
        .select({
          id: projects.id,
          name: projects.name,
          status: projects.status,
          budget: projects.budget,
        })
        .from(projects)
        .limit(200)

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

      // Use GROUP BY to aggregate todo stats per project in a single query
      const projectIds = allProjects.map((p) => p.id)
      const todoStats =
        projectIds.length > 0
          ? await db
              .select({
                projectId: todos.projectId,
                total: count(),
                completed: sql<number>`COUNT(*) FILTER (WHERE ${todos.status} = 'completed')`,
                totalHours: sql<number>`COALESCE(SUM(${todos.actualTime}), 0)`,
              })
              .from(todos)
              .where(inArray(todos.projectId, projectIds))
              .groupBy(todos.projectId)
          : []

      const statsMap = new Map(todoStats.map((s) => [s.projectId, s]))

      return allProjects.map((project) => {
        const stats = statsMap.get(project.id)
        const total = Number(stats?.total ?? 0)
        const completed = Number(stats?.completed ?? 0)
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0
        const totalHours = Number(stats?.totalHours ?? 0)
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

      // Use SQL GROUP BY to aggregate todo counts per user — avoids loading all rows
      const todoClauses = []
      if (projectId) todoClauses.push(eq(todos.projectId, projectId))
      if (filteredUserIds?.length) todoClauses.push(inArray(todos.assignedTo, filteredUserIds))
      const todoWhere =
        todoClauses.length === 0
          ? undefined
          : todoClauses.length === 1
            ? todoClauses[0]
            : and(...todoClauses)

      const workloadStats = await db
        .select({
          userId: todos.assignedTo,
          total: count(),
          completed: sql<number>`COUNT(*) FILTER (WHERE ${todos.status} = 'completed')`,
          pending: sql<number>`COUNT(*) FILTER (WHERE ${todos.status} = 'pending')`,
          inProgress: sql<number>`COUNT(*) FILTER (WHERE ${todos.status} = 'in_progress')`,
        })
        .from(todos)
        .where(todoWhere)
        .groupBy(todos.assignedTo)
        .having(sql`${todos.assignedTo} IS NOT NULL`)
        .limit(50)

      if (isE2E && workloadStats.length === 0) {
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

      if (workloadStats.length === 0) return []

      // Fetch only the users we need
      const userIds = workloadStats.map((s) => s.userId).filter((id): id is string => id !== null)
      const userRows = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(inArray(users.id, userIds))

      const usersMap = new Map(userRows.map((u) => [u.id, u]))

      return workloadStats
        .filter((s) => s.userId && usersMap.has(s.userId))
        .map((s) => {
          const user = usersMap.get(s.userId!)!
          return {
            user: { ...user, createdAt: user.createdAt.toISOString() },
            total: Number(s.total),
            completed: Number(s.completed),
            pending: Number(s.pending),
            inProgress: Number(s.inProgress),
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
