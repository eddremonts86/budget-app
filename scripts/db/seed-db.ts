import * as dotenv from 'dotenv'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../../src/shared/lib/db/schema'
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
    console.log('Cleaning existing data...')
    await db.delete(schema.projectMembers).catch(() => {})
    await db.delete(schema.transactions).catch(() => {})
    await db.delete(schema.todos).catch(() => {})
    await db.delete(schema.projects).catch(() => {})
    await db.delete(schema.teams).catch(() => {})
    await db.delete(schema.users).catch(() => {})
    await db.delete(schema.departments).catch(() => {})
    await db.delete(schema.categories).catch(() => {})

    if (seedData.categories.length > 0) {
      console.log(`Inserting ${seedData.categories.length} categories...`)
      await db.insert(schema.categories).values(seedData.categories)
    }

    if ((seedData as any).departments?.length > 0) {
      console.log(`Inserting ${(seedData as any).departments.length} departments...`)
      await db.insert(schema.departments).values(
        (seedData as any).departments.map((d: any) => ({
          ...d,
          managerId: null,
          createdAt: d.createdAt ? new Date(d.createdAt) : new Date(),
          updatedAt: d.updatedAt ? new Date(d.updatedAt) : new Date(),
        })),
      )
    }

    if (seedData.users.length > 0) {
      console.log(`Inserting ${seedData.users.length} users...`)
      await db.insert(schema.users).values(
        seedData.users.map((u: any) => ({
          ...u,
          createdAt: u.createdAt ? new Date(u.createdAt) : new Date(),
        })),
      )
    }

    if ((seedData as any).departments?.length > 0) {
      console.log('Updating departments with managers...')
      for (const d of (seedData as any).departments) {
        if (d.managerId) {
          await db
            .update(schema.departments)
            .set({ managerId: d.managerId })
            .where(eq(schema.departments.id, d.id))
        }
      }
    }

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

    if ((seedData as any).projectMembers?.length > 0) {
      console.log(`Inserting ${(seedData as any).projectMembers.length} project members...`)
      await db.insert(schema.projectMembers).values(
        (seedData as any).projectMembers.map((pm: any) => ({
          ...pm,
          joinedAt: pm.joinedAt ? new Date(pm.joinedAt) : new Date(),
          updatedAt: pm.updatedAt ? new Date(pm.updatedAt) : new Date(),
        })),
      )
    }

    if (seedData.todos.length > 0) {
      console.log(`Inserting ${seedData.todos.length} todos...`)
      await db.insert(schema.todos).values(
        seedData.todos.map((t: any) => ({
          ...t,
          dueDate: t.dueDate ? new Date(t.dueDate) : null,
          completedAt: t.completedAt ? new Date(t.completedAt) : null,
          createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
          updatedAt: t.updatedAt ? new Date(t.updatedAt) : new Date(),
        })),
      )
    }

    if (seedData.transactions.length > 0) {
      console.log(`Inserting ${seedData.transactions.length} transactions...`)
      await db.insert(schema.transactions).values(
        seedData.transactions.map((t: any) => ({
          ...t,
          date: t.date ? new Date(t.date) : new Date(),
          approvedAt: t.approvedAt ? new Date(t.approvedAt) : null,
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
