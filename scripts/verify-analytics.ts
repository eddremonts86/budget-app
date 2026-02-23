import * as dotenv from 'dotenv'
import { sql, gte, lte, and, count, sum, eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../src/shared/lib/db/schema'

dotenv.config()

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL is not defined')
}

const client = postgres(connectionString)
const db = drizzle(client, { schema })

async function verifyAnalytics() {
  console.log('📊 Verifying Analytics Data...')

  // 1. KPIs
  const totalRevenue = await db
    .select({ total: sum(schema.transactions.amount) })
    .from(schema.transactions)
    .then((res) => res[0].total || 0)
  console.log(`💰 Total Revenue: ${totalRevenue}`)

  const activeProjects = await db.$count(schema.projects, eq(schema.projects.status, 'active'))
  console.log(`🚀 Active Projects: ${activeProjects}`)

  const totalTasks = await db.$count(schema.todos)
  const completedTasks = await db.$count(schema.todos, eq(schema.todos.status, 'completed'))
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
  console.log(`✅ Completion Rate: ${completionRate.toFixed(2)}%`)

  // 2. Revenue Trend (last 30 days)
  const days = 30
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const revenueTrend = await db
    .select({
      date: sql<string>`to_char(${schema.transactions.date}, 'YYYY-MM-DD')`,
      amount: sum(schema.transactions.amount),
    })
    .from(schema.transactions)
    .where(and(gte(schema.transactions.date, startDate), lte(schema.transactions.date, endDate)))
    .groupBy(sql`to_char(${schema.transactions.date}, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${schema.transactions.date}, 'YYYY-MM-DD')`)

  console.log(`📈 Revenue Trend Points: ${revenueTrend.length}`)

  // 3. Task Completion Trend
  const taskTrend = await db
    .select({
      date: sql<string>`to_char(${schema.todos.completedAt}, 'YYYY-MM-DD')`,
      count: count(schema.todos.id),
    })
    .from(schema.todos)
    .where(
      and(
        gte(schema.todos.completedAt, startDate),
        lte(schema.todos.completedAt, endDate),
        eq(schema.todos.status, 'completed'),
      ),
    )
    .groupBy(sql`to_char(${schema.todos.completedAt}, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${schema.todos.completedAt}, 'YYYY-MM-DD')`)

  console.log(`✅ Task Trend Points: ${taskTrend.length}`)

  process.exit(0)
}

verifyAnalytics()
