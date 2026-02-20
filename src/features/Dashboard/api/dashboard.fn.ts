import { createServerFn } from '@tanstack/react-start'
import { eq, desc, and, gte, lte, count } from 'drizzle-orm'
// import { db } from '@/shared/lib/db'
import { todos, users, transactions } from '@/shared/lib/db/schema'

export const getDashboardStatsFn = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    console.log('getDashboardStatsFn: Starting...')
    const { getDb } = await import('@/shared/lib/db')
    console.log('getDashboardStatsFn: Imported getDb')
    const db = getDb()
    console.log('getDashboardStatsFn: Got db instance')

    const [[totalUsers], [completedTasks], [pendingTasks]] = await Promise.all([
      db.select({ count: count() }).from(users),
      db.select({ count: count() }).from(todos).where(eq(todos.status, 'completed')),
      db.select({ count: count() }).from(todos).where(eq(todos.status, 'pending')),
    ])
    console.log('getDashboardStatsFn: DB queries completed', {
      totalUsers,
      completedTasks,
      pendingTasks,
    })

    // Mock revenue data for now as we don't have a payments table yet
    const totalRevenue = 45231.89
    const revenueChange = 20.1
    const activeUsersChange = 15

    return {
      revenue: { value: totalRevenue, change: revenueChange, trend: 'up' },
      subscriptions: { value: totalUsers.count, change: activeUsersChange, trend: 'up' },
      sales: { value: completedTasks.count, change: 12, trend: 'up', context: 'Completed Tasks' },
      activeNow: { value: pendingTasks.count, change: -5, trend: 'down', context: 'Pending Tasks' },
    }
  } catch (error) {
    console.error('Error in getDashboardStatsFn:', error)
    throw error
  }
})

export const getRecentTransactionsFn = createServerFn({ method: 'GET' }).handler(async () => {
  const { getDb } = await import('@/shared/lib/db')
  const db = getDb()
  const items = await db.select().from(transactions).limit(5).orderBy(desc(transactions.date))
  return items.map((item) => ({
    ...item,
    date: item.date.toISOString(),
    amount: item.amount, // assuming amount is stored correctly
    status: item.status as 'Pending' | 'Approved' | 'Rejected',
  }))
})

export const getUpcomingTodosFn = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    console.log('getUpcomingTodosFn: Starting...')
    const { getDb } = await import('@/shared/lib/db')
    const db = getDb()
    const now = new Date()
    const nextWeek = new Date()
    nextWeek.setDate(now.getDate() + 7)
    console.log(
      `getUpcomingTodosFn: Querying from ${now.toISOString()} to ${nextWeek.toISOString()}`,
    )

    const items = await db
      .select()
      .from(todos)
      .where(and(gte(todos.dueDate, now), lte(todos.dueDate, nextWeek)))
      .orderBy(todos.dueDate)

    console.log(`getUpcomingTodosFn: Found ${items.length} items`)

    return items.map((item) => ({
      ...item,
      dueDate: item.dueDate ? item.dueDate.toISOString() : '',
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }))
  } catch (error) {
    console.error('Error in getUpcomingTodosFn:', error)
    throw error
  }
})

export const getUsersWorkloadFn = createServerFn({ method: 'GET' }).handler(async () => {
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
    throw error
  }
})
