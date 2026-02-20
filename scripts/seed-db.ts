import * as dotenv from 'dotenv'
import { drizzle } from 'drizzle-orm/postgres-js'
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import postgres from 'postgres'
import * as schema from '../src/shared/lib/db/schema'
import * as seedData from './seed-data'

dotenv.config()

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL is not defined')
}

const client = postgres(connectionString)
const db = drizzle(client, { schema })

async function seed() {
  console.log('🌱 Seeding database...')

  try {
    // Clear existing data
    console.log('Cleaning existing data...')
    await db.delete(schema.transactions)
    await db.delete(schema.todos)
    await db.delete(schema.projects)
    await db.delete(schema.users)
    await db.delete(schema.categories)
    await db.delete(schema.teams)

    // Insert Users
    if (seedData.users.length > 0) {
      console.log(`Inserting ${seedData.users.length} users...`)

      await db.insert(schema.users).values(
        seedData.users.map((u: any) => ({
          ...u,
          createdAt: u.createdAt ? new Date(u.createdAt) : new Date(),
        })),
      )
    }

    // Insert Projects
    if (seedData.projects.length > 0) {
      console.log(`Inserting ${seedData.projects.length} projects...`)

      await db.insert(schema.projects).values(
        seedData.projects.map((p: any) => ({
          ...p,
          startDate: p.startDate ? new Date(p.startDate) : null,
          endDate: p.endDate ? new Date(p.endDate) : null,
          createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
          updatedAt: p.updatedAt ? new Date(p.updatedAt) : new Date(),
        })),
      )
    }

    // Insert Todos
    if (seedData.todos.length > 0) {
      console.log(`Inserting ${seedData.todos.length} todos...`)

      await db.insert(schema.todos).values(
        seedData.todos.map((t: any) => ({
          ...t,
          dueDate: t.dueDate ? new Date(t.dueDate) : null,
          createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
          updatedAt: t.updatedAt ? new Date(t.updatedAt) : new Date(),
        })),
      )
    }

    // Insert Transactions
    if (seedData.transactions.length > 0) {
      console.log(`Inserting ${seedData.transactions.length} transactions...`)

      await db.insert(schema.transactions).values(
        seedData.transactions.map((t: any) => ({
          id: t.id,
          customerName: t.customerName || 'Unknown',
          customerEmail: t.customerEmail || 'unknown@example.com',
          status: t.status,
          date: t.date ? new Date(t.date) : new Date(),
          amount: t.amount,
          userId: t.userId,
          projectId: t.projectId,
          assignedAdminId: t.assignedAdminId,
          approvedBy: t.approvedBy,
          approvedAt: t.approvedAt ? new Date(t.approvedAt) : null,
          rejectionReason: t.rejectionReason,
        })),
      )
    }

    // Insert Categories
    if (seedData.categories.length > 0) {
      console.log(`Inserting ${seedData.categories.length} categories...`)

      await db.insert(schema.categories).values(seedData.categories)
    }

    // Insert Teams
    if (seedData.teams.length > 0) {
      console.log(`Inserting ${seedData.teams.length} teams...`)

      await db.insert(schema.teams).values(
        seedData.teams.map((t: any) => ({
          ...t,
          createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
          updatedAt: t.updatedAt ? new Date(t.updatedAt) : new Date(),
        })),
      )
    }

    console.log('✅ Database seeded successfully!')
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

seed()
