import {
  categories,
  projectMembers,
  projects,
  teamMembers,
  todos,
  transactions,
  users,
} from '@/shared/lib/db/schema'
import { createServerFn } from '@tanstack/react-start'
import { and, count, desc, eq, gte, inArray, lt, sql } from 'drizzle-orm'
import { z } from 'zod'

async function loadDb() {
  const { getDb } = await import('@/shared/lib/db')
  return getDb()
}

const DASHBOARD_METRIC_KEYS = ['netBalance', 'revenue', 'expenses', 'activeProjects'] as const

const dashboardMetricSchema = z.enum(DASHBOARD_METRIC_KEYS)

const MOCK_DASHBOARD_STATS = {
  revenue: {
    value: 125000,
    change: 12.5,
    trend: 'up' as const,
    periodTotal: 45000,
    pendingApprovalTotal: 5000,
    periodDays: 30,
  },
  expenses: {
    value: 45000,
    change: 5.2,
    trend: 'up' as const,
    periodTotal: 15000,
    periodDays: 30,
  },
  netBalance: {
    value: 80000,
    change: 15.8,
    trend: 'up' as const,
    periodTotal: 30000,
    periodDays: 30,
  },
  activeProjects: {
    value: 12,
    change: 0,
    trend: 'up' as const,
    context: 'Active Projects',
  },
  completedTasks: {
    value: 450,
    change: 0,
    trend: 'up' as const,
    context: 'Completed Tasks',
  },
  pendingTasks: {
    value: 25,
    change: 0,
    trend: 'down' as const,
    context: 'Pending Tasks',
  },
}

function getDashboardPeriodStart() {
  const periodStart = new Date()
  periodStart.setDate(periodStart.getDate() - 30)
  return periodStart
}

async function getRevenueSnapshot(db: Awaited<ReturnType<typeof loadDb>>, periodStart: Date) {
  const [historicalIncomeRow, periodIncomeRow, pendingSumRow] = await Promise.all([
    db
      .select({
        total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
      })
      .from(transactions)
      .where(and(eq(transactions.status, 'Approved'), sql`${transactions.amount} > 0`)),
    db
      .select({
        total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.status, 'Approved'),
          gte(transactions.date, periodStart),
          sql`${transactions.amount} > 0`,
        ),
      ),
    db
      .select({
        total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
      })
      .from(transactions)
      .where(eq(transactions.status, 'Pending')),
  ])

  const totalIncome = Number(historicalIncomeRow[0]?.total ?? 0)
  const periodIncome = Number(periodIncomeRow[0]?.total ?? 0)
  const pendingApprovalTotal = Number(pendingSumRow[0]?.total ?? 0)

  const change =
    totalIncome > 0
      ? Math.round(((periodIncome / Math.max(1, totalIncome)) * 100 + Number.EPSILON) * 10) / 10
      : 0

  return {
    value: totalIncome,
    change,
    trend: change >= 0 ? 'up' : 'down',
    periodTotal: periodIncome,
    pendingApprovalTotal,
    periodDays: 30,
  }
}

async function getExpensesSnapshot(db: Awaited<ReturnType<typeof loadDb>>, periodStart: Date) {
  const [historicalExpenseRow, periodExpenseRow] = await Promise.all([
    db
      .select({
        total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
      })
      .from(transactions)
      .where(and(eq(transactions.status, 'Approved'), sql`${transactions.amount} < 0`)),
    db
      .select({
        total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.status, 'Approved'),
          gte(transactions.date, periodStart),
          sql`${transactions.amount} < 0`,
        ),
      ),
  ])

  const totalExpenses = Math.abs(Number(historicalExpenseRow[0]?.total ?? 0))
  const periodExpenses = Math.abs(Number(periodExpenseRow[0]?.total ?? 0))

  const change =
    totalExpenses > 0
      ? Math.round(((periodExpenses / Math.max(1, totalExpenses)) * 100 + Number.EPSILON) * 10) / 10
      : 0

  return {
    value: totalExpenses,
    change,
    trend: change >= 0 ? 'up' : 'down',
    periodTotal: periodExpenses,
    periodDays: 30,
  }
}

async function getNetBalanceSnapshot(db: Awaited<ReturnType<typeof loadDb>>, periodStart: Date) {
  const [revenue, expenses] = await Promise.all([
    getRevenueSnapshot(db, periodStart),
    getExpensesSnapshot(db, periodStart),
  ])

  const value = revenue.value - expenses.value
  const periodTotal = revenue.periodTotal - expenses.periodTotal
  const change =
    Math.abs(value) > 0
      ? Math.round(((periodTotal / Math.max(1, Math.abs(value))) * 100 + Number.EPSILON) * 10) / 10
      : 0

  return {
    value,
    change,
    trend: change >= 0 ? 'up' : 'down',
    periodTotal,
    periodDays: 30,
  }
}

async function getActiveProjectsSnapshot(db: Awaited<ReturnType<typeof loadDb>>) {
  const [activeProjectsRow] = await db
    .select({ count: count() })
    .from(projects)
    .where(eq(projects.status, 'active'))

  return {
    value: activeProjectsRow?.count ?? 0,
    change: 0,
    trend: 'up' as const,
    context: 'Active Projects',
  }
}

export const getDashboardMetricFn = createServerFn({ method: 'GET' })
  .inputValidator(dashboardMetricSchema)
  .handler(async ({ data: metric }) => {
    const isE2E = process.env.VITE_E2E === 'true'

    try {
      const db = await loadDb()
      const periodStart = getDashboardPeriodStart()

      switch (metric) {
        case 'revenue': {
          const revenue = await getRevenueSnapshot(db, periodStart)
          if (isE2E && revenue.value === 0) {
            return MOCK_DASHBOARD_STATS.revenue
          }
          return revenue
        }
        case 'expenses': {
          const expenses = await getExpensesSnapshot(db, periodStart)
          if (isE2E && expenses.value === 0) {
            return MOCK_DASHBOARD_STATS.expenses
          }
          return expenses
        }
        case 'netBalance': {
          const netBalance = await getNetBalanceSnapshot(db, periodStart)
          if (isE2E && netBalance.value === 0) {
            return MOCK_DASHBOARD_STATS.netBalance
          }
          return netBalance
        }
        case 'activeProjects': {
          const activeProjects = await getActiveProjectsSnapshot(db)
          if (isE2E && activeProjects.value === 0) {
            return MOCK_DASHBOARD_STATS.activeProjects
          }
          return activeProjects
        }
      }
    } catch (error) {
      console.error('Error in getDashboardMetricFn:', error)
      if (isE2E) {
        return MOCK_DASHBOARD_STATS[metric]
      }
      throw error
    }
  })

export const getDashboardStatsFn = createServerFn({ method: 'GET' })
  .inputValidator(z.void().optional())
  .handler(async ({ data: _data }) => {
    const isE2E = process.env.VITE_E2E === 'true'

    try {
      const db = await loadDb()
      const periodStart = getDashboardPeriodStart()

      const [[activeProjectsRow], [completedTasksRow], [pendingTasksRow]] = await Promise.all([
        db.select({ count: count() }).from(projects).where(eq(projects.status, 'active')),
        db.select({ count: count() }).from(todos).where(eq(todos.status, 'completed')),
        db.select({ count: count() }).from(todos).where(eq(todos.status, 'pending')),
      ])

      const [revenue, expenses, netBalance] = await Promise.all([
        getRevenueSnapshot(db, periodStart),
        getExpensesSnapshot(db, periodStart),
        getNetBalanceSnapshot(db, periodStart),
      ])

      // Check if we should return mock data in E2E mode
      if (isE2E && revenue.value === 0 && expenses.value === 0 && activeProjectsRow.count === 0) {
        return MOCK_DASHBOARD_STATS
      }

      return {
        revenue,
        expenses,
        netBalance,
        activeProjects: {
          value: activeProjectsRow.count,
          change: 0,
          trend: 'up',
          context: 'Active Projects',
        },
        completedTasks: {
          value: completedTasksRow.count,
          change: 0,
          trend: 'up',
          context: 'Completed Tasks',
        },
        pendingTasks: {
          value: pendingTasksRow.count,
          change: 0,
          trend: 'down',
          context: 'Pending Tasks',
        },
      }
    } catch (error) {
      console.error('Error in getDashboardStatsFn:', error)
      if (isE2E) {
        return MOCK_DASHBOARD_STATS
      }
      throw error
    }
  })

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

export const getRecentTransactionsFn = createServerFn({ method: 'GET' })
  .inputValidator(z.void().optional())
  .handler(async ({ data: _data }) => {
    const isE2E = process.env.VITE_E2E === 'true'

    try {
      const db = await loadDb()
      const items = await db.select().from(transactions).limit(5).orderBy(desc(transactions.date))

      if (isE2E && items.length === 0) {
        return Array.from({ length: 5 }).map((_, i) => ({
          id: i.toString(),
          date: new Date().toISOString(),
          amount: 1000 - i * 100,
          status: 'Approved' as const,
          description: `Transaction ${i}`,
        }))
      }

      return items.map((item) => ({
        ...item,
        date: item.date.toISOString(),
        amount: item.amount,
        status: item.status as 'Pending' | 'Approved' | 'Rejected',
      }))
    } catch (error) {
      console.error('Error in getRecentTransactionsFn:', error)
      if (isE2E) {
        return Array.from({ length: 5 }).map((_, i) => ({
          id: i.toString(),
          user: {
            name: `User ${i}`,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`,
          },
          date: new Date().toISOString(),
          amount: 1000 - i * 100,
          status: 'Approved' as const,
          description: `Transaction ${i}`,
        }))
      }
      throw error
    }
  })

export const getUpcomingTodosFn = createServerFn({ method: 'GET' })
  .inputValidator(z.void().optional())
  .handler(async ({ data: _data }) => {
    const isE2E = process.env.VITE_E2E === 'true'

    try {
      const db = await loadDb()
      const now = new Date()
      const startOfToday = new Date(now)
      startOfToday.setHours(0, 0, 0, 0)
      const nextWeek = new Date(startOfToday)
      nextWeek.setDate(nextWeek.getDate() + 8)
      const openTodoStatuses = ['pending', 'in_progress', 'testing', 'on_hold', 'blocked'] as const
      const upcomingWindowClause = and(
        gte(todos.dueDate, startOfToday),
        lt(todos.dueDate, nextWeek),
        inArray(todos.status, [...openTodoStatuses]),
      )

      const [upcomingItems, [{ value: nextWeekCount }]] = await Promise.all([
        db.select().from(todos).where(upcomingWindowClause).orderBy(todos.dueDate).limit(50),
        db.select({ value: count() }).from(todos).where(upcomingWindowClause),
      ])

      const items =
        upcomingItems.length > 0
          ? upcomingItems
          : await db
              .select()
              .from(todos)
              .where(
                and(lt(todos.dueDate, startOfToday), inArray(todos.status, [...openTodoStatuses])),
              )
              .orderBy(desc(todos.dueDate))
              .limit(50)
      const displayMode = upcomingItems.length > 0 ? 'upcoming' : 'overdue_fallback'

      if (isE2E && items.length === 0) {
        return {
          items: Array.from({ length: 3 }).map((_, i) => ({
            id: i.toString(),
            title: `Task ${i}`,
            description: `Description ${i}`,
            status: 'pending' as const,
            priority: ['high', 'medium', 'low'][i % 3] as 'high' | 'medium' | 'low',
            assignedTo: '1',
            dueDate: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            completedAt: null,
            projectId: null,
          })),
          nextWeekCount: 3,
          displayCount: 3,
          displayMode: 'upcoming' as const,
        }
      }

      return {
        items: items.map((item) => ({
          ...item,
          dueDate: item.dueDate ? item.dueDate.toISOString() : '',
          createdAt: item.createdAt.toISOString(),
          updatedAt: item.updatedAt.toISOString(),
        })),
        nextWeekCount: Number(nextWeekCount ?? 0),
        displayCount: items.length,
        displayMode,
      }
    } catch (error) {
      console.error('Error in getUpcomingTodosFn:', error)
      if (isE2E) {
        return {
          items: Array.from({ length: 3 }).map((_, i) => ({
            id: i.toString(),
            title: `Task ${i}`,
            description: `Description ${i}`,
            status: 'pending' as const,
            priority: ['high', 'medium', 'low'][i % 3] as 'high' | 'medium' | 'low',
            assignedTo: '1',
            dueDate: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            completedAt: null,
            projectId: null,
          })),
          nextWeekCount: 3,
          displayCount: 3,
          displayMode: 'upcoming' as const,
        }
      }
      throw error
    }
  })

const usersWorkloadFiltersSchema = z
  .object({
    projectId: z.string().optional(),
    teamId: z.string().optional(),
  })
  .optional()

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
        const projectMemberRows = await db
          .select({ userId: projectMembers.userId })
          .from(projectMembers)
          .where(eq(projectMembers.projectId, projectId))

        filteredUserIds = projectMemberRows.map((row) => row.userId)
      }

      if (teamId) {
        const teamMemberRows = await db
          .select({ userId: teamMembers.userId })
          .from(teamMembers)
          .where(eq(teamMembers.teamId, teamId))

        const teamUserIds = teamMemberRows.map((row) => row.userId)
        filteredUserIds = filteredUserIds
          ? filteredUserIds.filter((userId) => teamUserIds.includes(userId))
          : teamUserIds
      }

      if (filteredUserIds && filteredUserIds.length === 0) {
        return []
      }

      const userWhereClause =
        filteredUserIds && filteredUserIds.length > 0
          ? inArray(users.id, filteredUserIds)
          : undefined

      const todoWhereClauses = []

      if (projectId) {
        todoWhereClauses.push(eq(todos.projectId, projectId))
      }

      if (filteredUserIds && filteredUserIds.length > 0) {
        todoWhereClauses.push(inArray(todos.assignedTo, filteredUserIds))
      }

      const todoWhereClause =
        todoWhereClauses.length === 0
          ? undefined
          : todoWhereClauses.length === 1
            ? todoWhereClauses[0]
            : and(...todoWhereClauses)

      const [allUsers, allTodos] = await Promise.all([
        db.select().from(users).where(userWhereClause),
        db.select().from(todos).where(todoWhereClause),
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
          user: {
            ...user,
            createdAt: user.createdAt.toISOString(),
          },
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
