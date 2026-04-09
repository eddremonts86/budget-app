import { randomUUID } from 'node:crypto'
import * as dotenv from 'dotenv'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../../src/shared/lib/db/schema'

dotenv.config()

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL is not defined')
}

let finalConnectionString = connectionString
if (finalConnectionString.includes('@db:5432') && !process.env.DOCKER_CONTAINER) {
  console.log('Detected db:5432 in DATABASE_URL but running on host. Switching to localhost:5432.')
  finalConnectionString = finalConnectionString.replace('@db:5432', '@localhost:5432')
}

const client = postgres(finalConnectionString)
const db = drizzle(client, { schema })

function randomDate(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

function randomAmount(min = 25, max = 5000) {
  const amount = Math.floor(min + Math.random() * (max - min))
  return Math.random() < 0.3 ? -amount : amount
}

function randomStatus() {
  return Math.random() < 0.65 ? 'Approved' : 'Pending'
}

function randomCustomer(i: number) {
  const companies = ['Acme', 'Globex', 'Umbrella', 'Wayne', 'Stark', 'Initech', 'Soylent', 'Hooli']
  const name = `${companies[i % companies.length]} ${100 + i}`
  const domain = `${name.toLowerCase().replace(/\s+/g, '')}.com`
  return { name, email: `billing@${domain}` }
}

async function seedTransactions(count = 232) {
  try {
    console.log(`🌱 Seeding ${count} random transactions...`)

    const users = await db.select().from(schema.users)
    const projects = await db.select().from(schema.projects)

    if (users.length === 0 || projects.length === 0) {
      console.error('❌ No users or projects found. Run db:seed:complex first.')
      process.exit(1)
    }

    const start = new Date('2020-01-01T00:00:00.000Z')
    const end = new Date('2026-12-01T00:00:00.000Z')

    const rows = Array.from({ length: count }).map((_, i) => {
      const status = randomStatus()
      const { name, email } = randomCustomer(i)
      const date = randomDate(start, end)
      const amount = randomAmount()
      const approvedAt = status === 'Approved' ? date : null

      const user = users[Math.floor(Math.random() * users.length)]
      const project = projects[Math.floor(Math.random() * projects.length)]
      const userId = user.id
      const projectId = project.id

      return {
        id: `trans_${randomUUID()}`,
        customerName: name,
        customerEmail: email,
        status,
        date,
        amount,
        userId,
        projectId,
        assignedAdminId: userId,
        approvedBy: status === 'Approved' ? userId : null,
        approvedAt,
        rejectionReason: status === 'Pending' ? null : null,
      } as any
    })

    await db.insert(schema.transactions).values(rows)
    console.log('✅ Random transactions seeded successfully!')
  } catch (error) {
    console.error('❌ Error seeding transactions:', error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

seedTransactions()
