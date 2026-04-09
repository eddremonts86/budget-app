import { spawnSync } from 'node:child_process'
import postgres from 'postgres'

const adminUrl = 'postgresql://postgres:postgres@127.0.0.1:5433/postgres'
const databaseName = 'tanstack_template_auth_e2e'
const databaseUrl = `postgresql://postgres:postgres@127.0.0.1:5433/${databaseName}`

async function waitForPostgresReady() {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const admin = postgres(adminUrl, { max: 1, prepare: false })

    try {
      await admin`SELECT 1`
      return
    } catch (error) {
      if (attempt === 19) {
        throw error
      }

      await new Promise((resolve) => setTimeout(resolve, 1000))
    } finally {
      await admin.end({ timeout: 5 }).catch(() => undefined)
    }
  }
}

async function recreateDatabase() {
  const admin = postgres(adminUrl, { max: 1, prepare: false })

  try {
    await admin`
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = ${databaseName} AND pid <> pg_backend_pid()
    `
    await admin.unsafe(`DROP DATABASE IF EXISTS "${databaseName}"`)
    await admin.unsafe(`CREATE DATABASE "${databaseName}"`)
  } finally {
    await admin.end({ timeout: 5 })
  }
}

function runMigrations() {
  const result = spawnSync('pnpm', ['db:migrate'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
    },
  })

  if (result.status !== 0) {
    throw new Error('Failed to run auth-local E2E migrations')
  }
}

async function seedAuthRoles() {
  const db = postgres(databaseUrl, { max: 1, prepare: false })

  try {
    await db`
      INSERT INTO roles (id, name, description)
      VALUES
        ('role_admin', 'admin', 'Administrator'),
        ('role_project_manager', 'project_manager', 'Project manager'),
        ('role_user', 'user', 'Standard user')
      ON CONFLICT (id) DO UPDATE
      SET
        name = EXCLUDED.name,
        description = EXCLUDED.description
    `
  } finally {
    await db.end({ timeout: 5 })
  }
}

async function main() {
  await waitForPostgresReady()
  await recreateDatabase()
  runMigrations()
  await seedAuthRoles()
  console.log(`Prepared auth-local E2E database: ${databaseName}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
