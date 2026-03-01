import { randomUUID } from 'crypto'
import dotenv from 'dotenv'
import postgres from 'postgres'

dotenv.config()

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('DATABASE_URL is not set')
  process.exit(1)
}

const sql = postgres(DATABASE_URL)

async function seedMembers() {
  try {
    const projects = await sql`SELECT id FROM projects`
    const users = await sql`SELECT id FROM users`

    if (projects.length === 0 || users.length === 0) {
      console.log('No projects or users found to link')
      return
    }

    console.log(`Found ${projects.length} projects and ${users.length} users.`)

    const memberInserts = []
    const roles = ['owner', 'manager', 'contributor', 'viewer']

    for (const project of projects) {
      // Assign 2-5 random users to each project
      const numMembers = Math.floor(Math.random() * 4) + 2
      const shuffledUsers = [...users].sort(() => 0.5 - Math.random())
      const projectUsers = shuffledUsers.slice(0, Math.min(numMembers, users.length))

      for (let i = 0; i < projectUsers.length; i++) {
        memberInserts.push({
          id: randomUUID(),
          project_id: project.id,
          user_id: projectUsers[i].id,
          role: i === 0 ? 'owner' : roles[Math.floor(Math.random() * roles.length)],
          joined_at: new Date(),
          updated_at: new Date(),
        })
      }
    }

    if (memberInserts.length > 0) {
      console.log(`Inserting ${memberInserts.length} project members...`)
      // Bulk insert
      for (const member of memberInserts) {
        await sql`INSERT INTO project_members (id, project_id, user_id, role, joined_at, updated_at) 
                 VALUES (${member.id}, ${member.project_id}, ${member.user_id}, ${member.role}, ${member.joined_at}, ${member.updated_at})`
      }
      console.log('✅ Project members seeded successfully!')
    }
  } catch (error) {
    console.error('Error seeding members:', error)
  } finally {
    await sql.end()
  }
}

seedMembers()
