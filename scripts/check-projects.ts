import 'dotenv/config'
import postgres from 'postgres'
import { getDb } from '../src/shared/lib/db/index.js'
import { projects } from '../src/shared/lib/db/schema.js'

async function check() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error('DATABASE_URL not found')
    process.exit(1)
  }

  const client = postgres(connectionString, { prepare: false })
  try {
    const db = getDb()
    console.log('Fetching projects...')
    const result = await db.select().from(projects)
    console.log('Projects count:', result.length)
    if (result.length > 0) {
      console.log('Sample project:', JSON.stringify(result[0], null, 2))
    }
  } catch (err) {
    console.error('Error during check:', err)
  } finally {
    await client.end()
    process.exit(0)
  }
}

check()
