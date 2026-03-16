import * as dotenv from 'dotenv'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../../src/shared/lib/db/schema'
import {
  CORPORATE_SNAPSHOT_PATH,
  readCorporateSnapshot,
  writeCorporateSnapshot,
} from './utils/corporate-dataset'

dotenv.config()

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL is not defined')
}

const resolvedConnectionString =
  connectionString.includes('@db:5432') && !process.env.DOCKER_CONTAINER
    ? connectionString.replace('@db:5432', '@127.0.0.1:5433')
    : connectionString

const client = postgres(resolvedConnectionString)
const db = drizzle(client, { schema })

async function insertInChunks(
  table: unknown,
  rows: Array<Record<string, unknown>>,
  chunkSize = 500,
) {
  for (let index = 0; index < rows.length; index += chunkSize) {
    const chunk = rows.slice(index, index + chunkSize)
    if (chunk.length > 0) {
      await db.insert(table as never).values(chunk as never)
    }
  }
}

async function safeDelete(table: unknown) {
  try {
    await db.delete(table as never)
  } catch (error) {
    if (
      error instanceof Error &&
      'cause' in error &&
      typeof error.cause === 'object' &&
      error.cause !== null &&
      'code' in error.cause &&
      (error.cause as { code?: string }).code === '42P01'
    ) {
      return
    }
    throw error
  }
}

function parseDate(value: unknown) {
  return typeof value === 'string' ? new Date(value) : value
}

async function loadSnapshot() {
  try {
    return await readCorporateSnapshot()
  } catch {
    console.log(`Snapshot not found at ${CORPORATE_SNAPSHOT_PATH}. Generating it now...`)
    await writeCorporateSnapshot()
    return readCorporateSnapshot()
  }
}

async function seed() {
  console.log('🌱 Importing corporate snapshot into database...')

  try {
    const snapshot = await loadSnapshot()

    console.log('Cleaning existing data...')
    await safeDelete(schema.todoDependencies)
    await safeDelete(schema.projectMembers)
    await safeDelete(schema.teamMembers)
    await safeDelete(schema.projectSkills)
    await safeDelete(schema.userSkills)
    await safeDelete(schema.externalIdentities)
    await safeDelete(schema.transactions)
    await safeDelete(schema.todos)
    await safeDelete(schema.projects)
    await safeDelete(schema.teams)
    await safeDelete(schema.users)
    await safeDelete(schema.campaigns)
    await safeDelete(schema.clients)
    await safeDelete(schema.departments)
    await safeDelete(schema.categories)
    await safeDelete(schema.authAccounts)
    await safeDelete(schema.authSessions)
    await safeDelete(schema.authVerifications)
    await safeDelete(schema.authUsers)
    await safeDelete(schema.aiTechnologies)
    await safeDelete(schema.jobTitles)
    await safeDelete(schema.experienceLevels)
    await safeDelete(schema.skills)
    await safeDelete(schema.roles)

    console.log(`Inserting ${snapshot.roles.length} roles...`)
    await insertInChunks(
      schema.roles,
      snapshot.roles.map((roleRow) => ({
        ...roleRow,
        createdAt: parseDate(roleRow.createdAt),
      })),
    )

    console.log(`Inserting ${snapshot.experienceLevels.length} experience levels...`)
    await insertInChunks(
      schema.experienceLevels,
      snapshot.experienceLevels.map((experienceLevelRow) => ({
        ...experienceLevelRow,
        createdAt: parseDate(experienceLevelRow.createdAt),
      })),
    )

    console.log(`Inserting ${snapshot.jobTitles.length} job titles...`)
    await insertInChunks(
      schema.jobTitles,
      snapshot.jobTitles.map((jobTitleRow) => ({
        ...jobTitleRow,
        createdAt: parseDate(jobTitleRow.createdAt),
      })),
    )

    console.log(`Inserting ${snapshot.skills.length} skills...`)
    await insertInChunks(
      schema.skills,
      snapshot.skills.map((skillRow) => ({
        ...skillRow,
        createdAt: parseDate(skillRow.createdAt),
      })),
    )

    console.log(`Inserting ${snapshot.aiTechnologies.length} AI technologies...`)
    await insertInChunks(
      schema.aiTechnologies,
      snapshot.aiTechnologies.map((technologyRow) => ({
        ...technologyRow,
        createdAt: parseDate(technologyRow.createdAt),
      })),
    )

    console.log(`Inserting ${snapshot.clients.length} clients...`)
    await insertInChunks(
      schema.clients,
      snapshot.clients.map((clientRow) => ({
        ...clientRow,
        createdAt: parseDate(clientRow.createdAt),
        updatedAt: parseDate(clientRow.updatedAt),
      })),
    )

    console.log(`Inserting ${snapshot.campaigns.length} campaigns...`)
    await insertInChunks(
      schema.campaigns,
      snapshot.campaigns.map((campaignRow) => ({
        ...campaignRow,
        startDate: parseDate(campaignRow.startDate),
        endDate: parseDate(campaignRow.endDate),
        createdAt: parseDate(campaignRow.createdAt),
        updatedAt: parseDate(campaignRow.updatedAt),
      })),
    )

    console.log(`Inserting ${snapshot.categories.length} categories...`)
    await insertInChunks(schema.categories, snapshot.categories)

    console.log(`Inserting ${snapshot.authUsers.length} auth users...`)
    await insertInChunks(
      schema.authUsers,
      snapshot.authUsers.map((authUserRow) => ({
        ...authUserRow,
        createdAt: parseDate(authUserRow.createdAt),
        updatedAt: parseDate(authUserRow.updatedAt),
      })),
    )

    console.log(`Inserting ${snapshot.departments.length} departments...`)
    await insertInChunks(
      schema.departments,
      snapshot.departments.map((departmentRow) => ({
        ...departmentRow,
        managerId: null,
        createdAt: parseDate(departmentRow.createdAt),
        updatedAt: parseDate(departmentRow.updatedAt),
      })),
    )

    console.log(`Inserting ${snapshot.users.length} users...`)
    await insertInChunks(
      schema.users,
      snapshot.users.map((userRow) => ({
        ...userRow,
        hireDate: parseDate(userRow.hireDate),
        createdAt: parseDate(userRow.createdAt),
        updatedAt: parseDate(userRow.updatedAt),
      })),
      400,
    )

    console.log(`Inserting ${snapshot.externalIdentities.length} external identities...`)
    await insertInChunks(
      schema.externalIdentities,
      snapshot.externalIdentities.map((identityRow) => ({
        ...identityRow,
        createdAt: parseDate(identityRow.createdAt),
        updatedAt: parseDate(identityRow.updatedAt),
        lastLoginAt: parseDate(identityRow.lastLoginAt),
      })),
    )

    console.log(`Inserting ${snapshot.userSkills.length} user skill assignments...`)
    await insertInChunks(
      schema.userSkills,
      snapshot.userSkills.map((skillRow) => ({
        ...skillRow,
        assignedAt: parseDate(skillRow.assignedAt),
      })),
      1000,
    )

    console.log('Updating department managers...')
    for (const departmentRow of snapshot.departments) {
      await db
        .update(schema.departments)
        .set({ managerId: departmentRow.managerId as string | null })
        .where(eq(schema.departments.id, departmentRow.id as string))
    }

    console.log(`Inserting ${snapshot.teams.length} teams...`)
    await insertInChunks(
      schema.teams,
      snapshot.teams.map((teamRow) => ({
        ...teamRow,
        createdAt: parseDate(teamRow.createdAt),
        updatedAt: parseDate(teamRow.updatedAt),
      })),
    )

    console.log(`Inserting ${snapshot.teamMembers.length} team memberships...`)
    await insertInChunks(
      schema.teamMembers,
      snapshot.teamMembers.map((teamMemberRow) => ({
        ...teamMemberRow,
        joinedAt: parseDate(teamMemberRow.joinedAt),
      })),
      1000,
    )

    console.log(`Inserting ${snapshot.projects.length} projects...`)
    await insertInChunks(
      schema.projects,
      snapshot.projects.map((projectRow) => ({
        ...projectRow,
        startDate: parseDate(projectRow.startDate),
        endDate: parseDate(projectRow.endDate),
        createdAt: parseDate(projectRow.createdAt),
        updatedAt: parseDate(projectRow.updatedAt),
      })),
    )

    console.log(`Inserting ${snapshot.projectSkills.length} project skills...`)
    await insertInChunks(schema.projectSkills, snapshot.projectSkills, 1000)

    console.log(`Inserting ${snapshot.projectMembers.length} project memberships...`)
    await insertInChunks(
      schema.projectMembers,
      snapshot.projectMembers.map((projectMemberRow) => ({
        ...projectMemberRow,
        joinedAt: parseDate(projectMemberRow.joinedAt),
        updatedAt: parseDate(projectMemberRow.updatedAt),
      })),
      750,
    )

    console.log(`Inserting ${snapshot.todos.length} todos...`)
    await insertInChunks(
      schema.todos,
      snapshot.todos.map((todoRow) => ({
        ...todoRow,
        dueDate: parseDate(todoRow.dueDate),
        completedAt: parseDate(todoRow.completedAt),
        createdAt: parseDate(todoRow.createdAt),
        updatedAt: parseDate(todoRow.updatedAt),
      })),
      500,
    )

    console.log(`Inserting ${snapshot.todoDependencies.length} todo dependencies...`)
    await insertInChunks(schema.todoDependencies, snapshot.todoDependencies, 1000)

    console.log(`Inserting ${snapshot.transactions.length} transactions...`)
    await insertInChunks(
      schema.transactions,
      snapshot.transactions.map((transactionRow) => ({
        ...transactionRow,
        date: parseDate(transactionRow.date),
        approvedAt: parseDate(transactionRow.approvedAt),
      })),
      500,
    )

    console.log('✅ Database imported successfully!')
    console.log(
      JSON.stringify(
        {
          users: snapshot.users.length,
          projects: snapshot.projects.length,
          todos: snapshot.todos.length,
          transactions: snapshot.transactions.length,
          teams: snapshot.teams.length,
        },
        null,
        2,
      ),
    )
  } catch (error) {
    console.error('❌ Error importing database snapshot:', error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

seed()
