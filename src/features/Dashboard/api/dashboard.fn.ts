import { createServerFn } from '@tanstack/react-start'
import { eq, desc, and, gte, lte, count, sql } from 'drizzle-orm'
import { todos, users, transactions, projects } from '@/shared/lib/db/schema'

export const getDashboardStatsFn = createServerFn({ method: 'GET' }).handler(async () => {
  if (process.env.VITE_E2E === 'true') {
    return {
      revenue: {
        value: 125000,
        change: 12.5,
        trend: 'up',
        periodTotal: 45000,
        pendingApprovalTotal: 5000,
        periodDays: 30,
      },
      expenses: {
        value: 45000,
        change: 5.2,
        trend: 'up',
        periodTotal: 15000,
        periodDays: 30,
      },
      netBalance: {
        value: 80000,
        change: 15.8,
        trend: 'up',
        periodTotal: 30000,
        periodDays: 30,
      },
      activeProjects: {
        value: 12,
        change: 0,
        trend: 'up',
        context: 'Active Projects',
      },
      completedTasks: {
        value: 450,
        change: 0,
        trend: 'up',
        context: 'Completed Tasks',
      },
      pendingTasks: {
        value: 25,
        change: 0,
        trend: 'down',
        context: 'Pending Tasks',
      },
    }
  }

  try {
    const { getDb } = await import('@/shared/lib/db')
    const db = getDb()

    const [[activeProjects], [completedTasks], [pendingTasks]] = await Promise.all([
      db.select({ count: count() }).from(projects).where(eq(projects.status, 'active')),
      db.select({ count: count() }).from(todos).where(eq(todos.status, 'completed')),
      db.select({ count: count() }).from(todos).where(eq(todos.status, 'pending')),
    ])

    const now = new Date()
    const periodStart = new Date(now)
    periodStart.setDate(periodStart.getDate() - 30)

    const [historicalIncomeRow, historicalExpenseRow] = await Promise.all([
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
        .where(and(eq(transactions.status, 'Approved'), sql`${transactions.amount} < 0`)),
    ])

    const [periodIncomeRow, periodExpenseRow] = await Promise.all([
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
        .where(
          and(
            eq(transactions.status, 'Approved'),
            gte(transactions.date, periodStart),
            sql`${transactions.amount} < 0`,
          ),
        ),
    ])

    const [pendingSumRow] = await db
      .select({
        total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
      })
      .from(transactions)
      .where(eq(transactions.status, 'Pending'))

    const totalIncome = Number(historicalIncomeRow[0]?.total ?? 0)
    const totalExpenses = Math.abs(Number(historicalExpenseRow[0]?.total ?? 0))
    const netBalance = totalIncome - totalExpenses

    const periodIncome = Number(periodIncomeRow[0]?.total ?? 0)
    const periodExpenses = Math.abs(Number(periodExpenseRow[0]?.total ?? 0))
    const periodNetBalance = periodIncome - periodExpenses

    const totalRevenuePending = Number(pendingSumRow?.total ?? 0)

    const revenueChange =
      totalIncome > 0
        ? Math.round(((periodIncome / Math.max(1, totalIncome)) * 100 + Number.EPSILON) * 10) / 10
        : 0

    const expenseChange =
      totalExpenses > 0
        ? Math.round(((periodExpenses / Math.max(1, totalExpenses)) * 100 + Number.EPSILON) * 10) /
          10
        : 0

    const balanceChange =
      Math.abs(netBalance) > 0
        ? Math.round(
            ((periodNetBalance / Math.max(1, Math.abs(netBalance))) * 100 + Number.EPSILON) * 10,
          ) / 10
        : 0

    return {
      revenue: {
        value: totalIncome,
        change: revenueChange,
        trend: revenueChange >= 0 ? 'up' : 'down',
        periodTotal: periodIncome,
        pendingApprovalTotal: totalRevenuePending,
        periodDays: 30,
      },
      expenses: {
        value: totalExpenses,
        change: expenseChange,
        trend: expenseChange >= 0 ? 'up' : 'down',
        periodTotal: periodExpenses,
        periodDays: 30,
      },
      netBalance: {
        value: netBalance,
        change: balanceChange,
        trend: balanceChange >= 0 ? 'up' : 'down',
        periodTotal: periodNetBalance,
        periodDays: 30,
      },
      activeProjects: {
        value: activeProjects.count,
        change: 0, // Calculate real change if we had history
        trend: 'up',
        context: 'Active Projects',
      },
      completedTasks: {
        value: completedTasks.count,
        change: 0,
        trend: 'up',
        context: 'Completed Tasks',
      },
      pendingTasks: {
        value: pendingTasks.count,
        change: 0,
        trend: 'down',
        context: 'Pending Tasks',
      },
    }
  } catch (error) {
    console.error('Error in getDashboardStatsFn:', error)
    return {
      revenue: {
        value: 0,
        change: 0,
        trend: 'down',
        periodTotal: 0,
        pendingApprovalTotal: 0,
        periodDays: 30,
      },
      expenses: {
        value: 0,
        change: 0,
        trend: 'down',
        periodTotal: 0,
        periodDays: 30,
      },
      netBalance: {
        value: 0,
        change: 0,
        trend: 'down',
        periodTotal: 0,
        periodDays: 30,
      },
      activeProjects: {
        value: 0,
        change: 0,
        trend: 'up',
        context: 'Active Projects',
      },
      completedTasks: {
        value: 0,
        change: 0,
        trend: 'up',
        context: 'Completed Tasks',
      },
      pendingTasks: {
        value: 0,
        change: 0,
        trend: 'down',
        context: 'Pending Tasks',
      },
    }
  }
})

export const getExpenseDistributionFn = createServerFn({ method: 'GET' }).handler(async () => {
  if (process.env.VITE_E2E === 'true') {
    return [
      { category: 'Development', amount: 5000, color: '#3b82f6' },
      { category: 'Design', amount: 3000, color: '#ec4899' },
      { category: 'Marketing', amount: 2000, color: '#f59e0b' },
      { category: 'Research', amount: 1500, color: '#10b981' },
    ]
  }

  try {
    const { getDb } = await import('@/shared/lib/db')
    const { categories } = await import('@/shared/lib/db/schema')
    const db = getDb()

    const results = await db
      .select({
        categoryName: categories.name,
        categoryColor: categories.color,
        totalAmount: sql<number>`ABS(SUM(${transactions.amount}))`,
      })
      .from(transactions)
      .innerJoin(categories, eq(transactions.categoryId, categories.id))
      .where(and(eq(transactions.status, 'Approved'), sql`${transactions.amount} < 0`))
      .groupBy(categories.name, categories.color)

    return results.map((r) => ({
      category: r.categoryName,
      amount: Number(r.totalAmount),
      color: r.categoryColor,
    }))
  } catch (error) {
    console.error('Error in getExpenseDistributionFn:', error)
    return []
  }
})

export const getRecentTransactionsFn = createServerFn({ method: 'GET' }).handler(async () => {
  if (process.env.VITE_E2E === 'true') {
    return Array.from({ length: 5 }).map((_, i) => ({
      id: i.toString(),
      date: new Date().toISOString(),
      amount: 1000,
      status: 'Approved' as const,
      description: `Transaction ${i}`,
    }))
  }

  try {
    const { getDb } = await import('@/shared/lib/db')
    const db = getDb()
    const items = await db.select().from(transactions).limit(5).orderBy(desc(transactions.date))
    return items.map((item) => ({
      ...item,
      date: item.date.toISOString(),
      amount: item.amount, // assuming amount is stored correctly
      status: item.status as 'Pending' | 'Approved' | 'Rejected',
    }))
  } catch (error) {
    console.error('Error in getRecentTransactionsFn:', error)
    return []
  }
})

export const getUpcomingTodosFn = createServerFn({ method: 'GET' }).handler(async () => {
  if (process.env.VITE_E2E === 'true') {
    return Array.from({ length: 3 }).map((_, i) => ({
      id: i.toString(),
      title: `Task ${i}`,
      description: `Description ${i}`,
      status: 'pending' as const,
      priority: 'medium' as const,
      assignedTo: '1',
      dueDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: null,
      projectId: null,
    }))
  }

  try {
    const { getDb } = await import('@/shared/lib/db')
    const db = getDb()
    const now = new Date()
    const nextWeek = new Date()
    nextWeek.setDate(now.getDate() + 7)

    const items = await db
      .select()
      .from(todos)
      .where(and(gte(todos.dueDate, now), lte(todos.dueDate, nextWeek)))
      .orderBy(todos.dueDate)

    return items.map((item) => ({
      ...item,
      dueDate: item.dueDate ? item.dueDate.toISOString() : '',
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }))
  } catch (error) {
    console.error('Error in getUpcomingTodosFn:', error)
    return []
  }
})

export const getUsersWorkloadFn = createServerFn({ method: 'GET' }).handler(async () => {
  if (process.env.VITE_E2E === 'true') {
    return Array.from({ length: 5 }).map((_, i) => ({
      user: {
        id: i.toString(),
        name: `User ${i}`,
        email: `user${i}@example.com`,
        role: 'user' as const,
        createdAt: new Date(),
      },
      total: 10,
      completed: 5,
      pending: 3,
      inProgress: 2,
    }))
  }

  try {
    const { getDb } = await import('@/shared/lib/db')
    const db = getDb()
    const allUsers = await db.select().from(users)
    const allTodos = await db.select().from(todos)

    return allUsers.map((user) => {
      const userTodos = allTodos.filter((t) => t.assignedTo === user.id)
      return {
        user,
        total: userTodos.length,
        completed: userTodos.filter((t) => t.status === 'completed').length,
        pending: userTodos.filter((t) => t.status === 'pending').length,
        inProgress: userTodos.filter((t) => t.status === 'in_progress').length,
      }
    })
  } catch (error) {
    console.error('Error in getUsersWorkloadFn:', error)
    return []
  }
})
