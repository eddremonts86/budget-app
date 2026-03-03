import postgres from 'postgres'
import * as dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL is not defined')
}

const sql = postgres(connectionString)

async function reset() {
  console.log('🔥 Reseteando base de datos...')
  try {
    await sql`DROP SCHEMA public CASCADE`
    await sql`CREATE SCHEMA public`
    await sql`GRANT ALL ON SCHEMA public TO public`
    console.log('✅ Base de datos reseteada.')
  } catch (error) {
    console.error('❌ Error al resetear:', error)
  } finally {
    await sql.end()
  }
}

reset()
