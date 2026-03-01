import * as dotenv from 'dotenv'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './src/shared/lib/db/schema.ts'

dotenv.config()

async function main() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error('DATABASE_URL not found')
    return
  }
  const client = postgres(connectionString)
  const db = drizzle(client, { schema })
  try {
    const projects = await db.select().from(schema.projects)
    console.log('Projects count in DB:', projects.length)
    console.log('Projects:', JSON.stringify(projects, null, 2))
  } catch (err) {
    console.error('Error fetching projects:', err)
  } finally {
    await client.end()
  }
}

main()
