import { randomUUID } from 'crypto'
import * as dotenv from 'dotenv'
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

async function seedExpenses() {
  console.log('💸 Seeding 112 negative project expenses...')

  try {
    // Get existing projects and categories to reference
    const projects = await db.select().from(schema.projects)
    const categories = await db.select().from(schema.categories)
    const users = await db.select().from(schema.users)

    if (projects.length === 0 || categories.length === 0 || users.length === 0) {
      throw new Error('Missing projects, categories, or users. Run main seed first.')
    }

    const paymentMethods = ['Credit Card', 'Bank Transfer', 'PayPal', 'Cash']
    const expenseDescriptions = [
      'Server Infrastructure',
      'Software License',
      'Hardware Procurement',
      'Consultancy Fee',
      'Marketing Campaign',
      'Office Supplies',
      'Travel Expenses',
      'Cloud Services Subscription',
      'External API Credits',
      'Development Outsourcing',
    ]

    const transactionsData = []

    for (let i = 0; i < 112; i++) {
      const project = projects[i % projects.length]
      const category = categories[i % categories.length]
      const user = users[i % users.length]
      const amount = -Math.floor(Math.random() * 500000 + 10000) // -$100.00 to -$5,100.00

      transactionsData.push({
        id: `tx_neg_${randomUUID()}`,
        customerName: 'Internal Expense',
        customerEmail: 'finance@company.com',
        status: 'Approved' as 'Approved' | 'Pending' | 'Rejected',
        date: new Date(Date.now() - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000)), // Last 90 days
        amount: amount,
        paymentMethod: paymentMethods[i % paymentMethods.length],
        description: expenseDescriptions[i % expenseDescriptions.length],
        userId: user.id,
        projectId: project.id,
        categoryId: category.id,
      })
    }

    await db.insert(schema.transactions).values(transactionsData)
    console.log('✅ 112 negative transactions seeded successfully!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error seeding expenses:', error)
    process.exit(1)
  }
}

seedExpenses()
