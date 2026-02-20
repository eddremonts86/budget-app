import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null

export const getDb = () => {
  if (dbInstance) return dbInstance

  // Check if we are in a server environment
  if (typeof window !== 'undefined') {
    throw new Error('Database connection cannot be initialized in the browser')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const connectionString = process.env.DATABASE_URL || (import.meta as any).env?.DATABASE_URL

  if (!connectionString) {
    console.error('❌ DATABASE_URL is not defined in process.env or import.meta.env')
    throw new Error('DATABASE_URL is not defined')
  }

  try {
    // Disable prefetch as it is not supported for "Transaction" pool mode
    const client = postgres(connectionString, { prepare: false })
    dbInstance = drizzle(client, { schema })
    return dbInstance
  } catch (error) {
    console.error('❌ Failed to initialize database connection:', error)
    throw error
  }
}
