
import 'dotenv/config'
import { eq, count } from 'drizzle-orm'
import { getDb } from '@/shared/lib/db'
import { todos, users } from '@/shared/lib/db/schema'

async function run() {
  try {
    console.log('Connecting to DB...')
    const db = getDb()
    
    console.log('Fetching users count...')
    const [totalUsers] = await db.select({ count: count() }).from(users)
    console.log('Total users:', totalUsers)
    console.log('Type of count:', typeof totalUsers.count)

    console.log('Fetching completed tasks count...')
    const [completedTasks] = await db
      .select({ count: count() })
      .from(todos)
      .where(eq(todos.status, 'completed'))
    console.log('Completed tasks:', completedTasks)

    console.log('Fetching pending tasks count...')
    const [pendingTasks] = await db
      .select({ count: count() })
      .from(todos)
      .where(eq(todos.status, 'pending'))
    console.log('Pending tasks:', pendingTasks)

    const totalRevenue = 45231.89
    const revenueChange = 20.1
    const activeUsersChange = 15

    const result = {
      revenue: { value: totalRevenue, change: revenueChange, trend: 'up' },
      subscriptions: { value: totalUsers.count, change: activeUsersChange, trend: 'up' },
      sales: { value: completedTasks.count, change: 12, trend: 'up', context: 'Completed Tasks' },
      activeNow: { value: pendingTasks.count, change: -5, trend: 'down', context: 'Pending Tasks' },
    }

    console.log('Result:', JSON.stringify(result, null, 2))
  } catch (error) {
    console.error('Error:', error)
  }
}

run()
