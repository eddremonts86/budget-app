import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import * as dotenv from 'dotenv'
import { drizzle } from 'drizzle-orm/postgres-js'
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import postgres from 'postgres'
import * as schema from '../src/shared/lib/db/schema'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL is not defined')
}

const client = postgres(connectionString)
const db = drizzle(client, { schema })

async function seed() {
  console.log('🌱 Seeding database...')

  const dbPath = path.join(__dirname, '../mocks/db.json')
  const data = JSON.parse(fs.readFileSync(dbPath, 'utf-8'))

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
    if (data.users && data.users.length > 0) {
      console.log(`Inserting ${data.users.length} users...`)

      await db.insert(schema.users).values(
        data.users.map((u: any) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          avatar: u.avatar,
          createdAt: u.createdAt ? new Date(u.createdAt) : new Date(),
        })),
      )
    }

    // Insert Projects
    if (data.projects && data.projects.length > 0) {
      console.log(`Inserting ${data.projects.length} projects...`)

      await db.insert(schema.projects).values(
        data.projects.map((p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          startDate: p.startDate ? new Date(p.startDate) : null,
          endDate: p.endDate ? new Date(p.endDate) : null,
          technologies: p.technologies,
          status: p.status,
          team: p.team,
          createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
          updatedAt: p.updatedAt ? new Date(p.updatedAt) : new Date(),
        })),
      )
    }

    // Insert Todos
    if (data.todos && data.todos.length > 0) {
      console.log(`Inserting ${data.todos.length} todos...`)

      await db.insert(schema.todos).values(
        data.todos.map((t: any) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          status: t.status,
          priority: t.priority,
          dueDate: t.dueDate ? new Date(t.dueDate) : null,
          createdBy: t.createdBy,
          assignedTo: t.assignedTo,
          projectId: t.projectId,
          createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
          updatedAt: t.updatedAt ? new Date(t.updatedAt) : new Date(),
        })),
      )
    }

    // Insert Transactions
    if (data.transactions && data.transactions.length > 0) {
      console.log(`Inserting ${data.transactions.length} transactions...`)

      await db.insert(schema.transactions).values(
        data.transactions.map((t: any) => ({
          id: t.id,
          customerName: t.customer?.name || 'Unknown',
          customerEmail: t.customer?.email || 'unknown@example.com',
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
    if (data.categories && data.categories.length > 0) {
      console.log(`Inserting ${data.categories.length} categories...`)

      await db.insert(schema.categories).values(
        data.categories.map((c: any) => ({
          id: c.id,
          name: c.name,
          color: c.color,
        })),
      )
    }

    // Insert Teams
    if (data.teams && data.teams.length > 0) {
      console.log(`Inserting ${data.teams.length} teams...`)

      await db.insert(schema.teams).values(
        data.teams.map((t: any) => ({
          id: t.id,
          name: t.name,
          description: t.description,
          members: t.members,
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
