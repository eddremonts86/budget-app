
import * as dotenv from 'dotenv'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../src/shared/lib/db/schema'

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

async function reset() {
  try {
    console.log('🗑️  Clearing database...')

    // Delete in order to respect foreign keys (child tables first)
    console.log('Deleting todos...')
    await db.delete(schema.todos)
    
    console.log('Deleting transactions...')
    await db.delete(schema.transactions)

    console.log('Deleting projects...')
    await db.delete(schema.projects)
    
    // We can keep users for now to avoid breaking auth if using external auth provider sync, 
    // but the seed script creates default users if missing. 
    // Let's clear users too to ensure clean state matching seed data.
    // console.log('Deleting users...')
    // await db.delete(schema.users)

    console.log('✅ Database cleared!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Reset failed:', error)
    process.exit(1)
  }
}

reset()
