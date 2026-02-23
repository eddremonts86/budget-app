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

async function verify() {
  console.log('🔍 Verifying data...')

  const usersCount = await db.$count(schema.users)
  console.log(`👤 Users: ${usersCount}`)

  const departmentsCount = await db.$count(schema.departments)
  console.log(`🏢 Departments: ${departmentsCount}`)

  const teamsCount = await db.$count(schema.teams)
  console.log(`👥 Teams: ${teamsCount}`)

  const projectsCount = await db.$count(schema.projects)
  console.log(`🚀 Projects: ${projectsCount}`)

  const categoriesCount = await db.$count(schema.categories)
  console.log(`🏷️ Categories: ${categoriesCount}`)

  const todosCount = await db.$count(schema.todos)
  console.log(`📝 Tasks: ${todosCount}`)

  if (
    usersCount === 50 &&
    departmentsCount === 5 &&
    teamsCount === 8 &&
    projectsCount === 10 &&
    categoriesCount === 15 &&
    todosCount === 1234
  ) {
    console.log('✅ Data verification passed!')
  } else {
    console.error('❌ Data verification failed!')
  }

  process.exit(0)
}

verify()
