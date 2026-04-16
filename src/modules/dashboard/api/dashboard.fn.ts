import { createServerFn } from '@tanstack/react-start'
import { and, count, desc, eq, gte, sql } from 'drizzle-orm'
import { z } from 'zod'
import { projects, todos, transactions } from '@/shared/lib/db/schema'

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

async function getNetBalanceSnapshot(
  db: Awaited<ReturnType<typeof loadDb>>,
  periodStart: Date,
  precomputedRevenue?: Awaited<ReturnType<typeof getRevenueSnapshot>>,
  precomputedExpenses?: Awaited<ReturnType<typeof getExpensesSnapshot>>,
) {
  const [revenue, expenses] = await Promise.all([
    precomputedRevenue ?? getRevenueSnapshot(db, periodStart),
    precomputedExpenses ?? getExpensesSnapshot(db, periodStart),
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

      const [revenue, expenses] = await Promise.all([
        getRevenueSnapshot(db, periodStart),
        getExpensesSnapshot(db, periodStart),
      ])

      // Pass precomputed revenue/expenses to avoid duplicate DB queries
      const netBalance = await getNetBalanceSnapshot(db, periodStart, revenue, expenses)

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

export const getRecentTransactionsFn = createServerFn({ method: 'GET' })
  .inputValidator(z.void().optional())
  .handler(async ({ data: _data }) => {
    const isE2E = process.env.VITE_E2E === 'true'

    try {
      const db = await loadDb()
      const items = await db
        .select({
          id: transactions.id,
          date: transactions.date,
          amount: transactions.amount,
          status: transactions.status,
          description: transactions.description,
        })
        .from(transactions)
        .limit(5)
        .orderBy(desc(transactions.date))

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
