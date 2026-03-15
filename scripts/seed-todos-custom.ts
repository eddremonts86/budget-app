import { randomUUID } from 'node:crypto'
import * as dotenv from 'dotenv'
import { count } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../src/shared/lib/db/schema'

dotenv.config()

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL is not defined')
}

// Check if we are in Docker environment (by hostname 'db') or local
// If local, use localhost:5432
// But DATABASE_URL is usually provided correctly.
// Let's assume DATABASE_URL is correct for the environment where we run the script.
// If running from host machine, we need localhost:5432.
// If .env.docker has db:5432, running from host will fail.
// We should check and replace if needed.
let finalConnectionString = connectionString
if (finalConnectionString.includes('@db:5432') && !process.env.DOCKER_CONTAINER) {
  console.log('Detected db:5432 in DATABASE_URL but running on host. Switching to localhost:5432.')
  finalConnectionString = finalConnectionString.replace('@db:5432', '@localhost:5432')
}

const client = postgres(finalConnectionString)
const db = drizzle(client, { schema })

async function seed() {
  try {
    console.log('🌱 Seeding 150 tasks...')

    // 1. Ensure users exist
    let allUsers = await db.select().from(schema.users)
    if (allUsers.length === 0) {
      console.log('Creating default user...')
      const newUsers = [
        {
          id: randomUUID(),
          name: 'Admin User',
          email: 'admin@example.com',
          role: 'admin' as const,
          avatar: 'https://github.com/shadcn.png',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: randomUUID(),
          name: 'Jane Doe',
          email: 'jane@example.com',
          role: 'user' as const,
          avatar: 'https://github.com/shadcn.png',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: randomUUID(),
          name: 'John Smith',
          email: 'john@example.com',
          role: 'user' as const,
          avatar: 'https://github.com/shadcn.png',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]
      await db.insert(schema.users).values(newUsers)
      allUsers = await db.select().from(schema.users)
    }
    console.log(`Found ${allUsers.length} users.`)

    // 2. Ensure projects exist
    let allProjects = await db.select().from(schema.projects)
    if (allProjects.length === 0) {
      console.log('Creating default projects...')
      const newProjects = [
        {
          id: randomUUID(),
          name: 'Website Redesign',
          description: 'Overhaul of the main website UI/UX',
          status: 'active' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
          technologies: ['React', 'Tailwind', 'Next.js'],
          startDate: new Date(),
          endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)),
        },
        {
          id: randomUUID(),
          name: 'Mobile App',
          description: 'Development of the mobile application',
          status: 'active' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
          technologies: ['React Native', 'Expo', 'TypeScript'],
          startDate: new Date(),
          endDate: new Date(new Date().setMonth(new Date().getMonth() + 6)),
        },
        {
          id: randomUUID(),
          name: 'API Migration',
          description: 'Migrating legacy API to new infrastructure',
          status: 'on_hold' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
          technologies: ['Node.js', 'PostgreSQL', 'Docker'],
          startDate: new Date(),
          endDate: new Date(new Date().setMonth(new Date().getMonth() + 4)),
        },
      ]
      await db.insert(schema.projects).values(newProjects)
      allProjects = await db.select().from(schema.projects)
    }
    console.log(`Found ${allProjects.length} projects.`)

    // 3. Create 150 tasks
    const verbs = [
      'Implement',
      'Fix',
      'Refactor',
      'Design',
      'Test',
      'Deploy',
      'Review',
      'Update',
      'Document',
      'Optimize',
      'Analyze',
      'Debug',
    ]
    const nouns = [
      'Dashboard',
      'Login',
      'API',
      'Database',
      'UI',
      'CI/CD',
      'Authentication',
      'Search',
      'User Profile',
      'Settings',
      'Payments',
      'Reports',
      'Analytics',
      'Navigation',
      'Footer',
      'Header',
      'Sidebar',
      'Modal',
      'Form',
      'Button',
    ]
    const priorities = ['low', 'medium', 'high'] as const
    const statuses = ['pending', 'in_progress', 'completed'] as const

    const newTodos = []
    const now = new Date()

    for (let i = 0; i < 150; i++) {
      const verb = verbs[Math.floor(Math.random() * verbs.length)]
      const noun = nouns[Math.floor(Math.random() * nouns.length)]
      const title = `${verb} ${noun} ${Math.floor(Math.random() * 100)}` // Add number to ensure uniqueness

      // Random due date within next 100 days
      const daysOffset = Math.floor(Math.random() * 100)
      const dueDate = new Date(now.getTime() + daysOffset * 24 * 60 * 60 * 1000)

      // Random priority and status
      const priority = priorities[Math.floor(Math.random() * priorities.length)]
      const status = statuses[Math.floor(Math.random() * statuses.length)]

      // Random assignment
      const assignedUser = allUsers[Math.floor(Math.random() * allUsers.length)]
      const project =
        allProjects.length > 0 ? allProjects[Math.floor(Math.random() * allProjects.length)] : null

      newTodos.push({
        id: randomUUID(),
        title,
        description: `Task to ${verb.toLowerCase()} the ${noun.toLowerCase()} for better performance and usability.`,
        status,
        priority,
        dueDate,
        assignedTo: assignedUser.id,
        createdBy: allUsers[0].id, // Admin created it
        projectId: project?.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }

    // Insert in batches of 50 to avoid huge queries
    const batchSize = 50
    for (let i = 0; i < newTodos.length; i += batchSize) {
      const batch = newTodos.slice(i, i + batchSize)
      // Ensure that assignedTo and createdBy are valid user IDs
      const validBatch = batch.map((todo) => ({
        ...todo,
        assignedTo: todo.assignedTo || allUsers[0].id,
        createdBy: todo.createdBy || allUsers[0].id,
      }))
      await db.insert(schema.todos).values(validBatch)
      console.log(`Inserted batch ${i / batchSize + 1}/${Math.ceil(newTodos.length / batchSize)}`)
    }

    // 4. Seed Transactions
    console.log('🌱 Seeding transactions...')
    const transactionStatuses = ['Pending', 'Approved', 'Rejected'] as const
    const newTransactions = []

    for (let i = 0; i < 20; i++) {
      const amount = Math.floor(Math.random() * 100000) // cents
      const status = transactionStatuses[Math.floor(Math.random() * transactionStatuses.length)]
      const user = allUsers[Math.floor(Math.random() * allUsers.length)]
      const project = allProjects[Math.floor(Math.random() * allProjects.length)]
      // Assign to Admin User (user_1) to ensure visibility in Pending list if status is Pending
      const assignedAdmin = allUsers[0]

      newTransactions.push({
        id: randomUUID(),
        customerName: `Customer ${i + 1}`,
        customerEmail: `customer${i + 1}@example.com`,
        status,
        date: new Date(now.getTime() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000), // Past 30 days
        amount,
        userId: user.id,
        projectId: project.id,
        assignedAdminId: assignedAdmin.id,
        approvedBy: status === 'Approved' ? assignedAdmin.id : null,
        approvedAt: status === 'Approved' ? new Date() : null,
        rejectionReason: status === 'Rejected' ? 'Invalid request' : null,
      })
    }

    // Ensure at least 5 Pending transactions assigned to Admin
    for (let i = 0; i < 5; i++) {
      const assignedAdmin = allUsers[0]
      const project = allProjects[Math.floor(Math.random() * allProjects.length)]
      newTransactions.push({
        id: randomUUID(),
        customerName: `Pending Customer ${i + 1}`,
        customerEmail: `pending${i + 1}@example.com`,
        status: 'Pending' as const,
        date: new Date(),
        amount: 5000 + i * 1000,
        userId: allUsers[1]?.id || allUsers[0].id,
        projectId: project.id,
        assignedAdminId: assignedAdmin.id,
        approvedBy: null,
        approvedAt: null,
        rejectionReason: null,
      })
    }

    await db.insert(schema.transactions).values(newTransactions)
    console.log(`Inserted ${newTransactions.length} transactions.`)

    // 5. Seed Categories
    console.log('🌱 Seeding categories...')
    const existingCategories = await db.select().from(schema.categories)
    if (existingCategories.length === 0) {
      const categoriesData = [
        { id: randomUUID(), name: 'Development', color: '#3b82f6' }, // blue
        { id: randomUUID(), name: 'Design', color: '#ec4899' }, // pink
        { id: randomUUID(), name: 'Marketing', color: '#f59e0b' }, // amber
        { id: randomUUID(), name: 'Sales', color: '#10b981' }, // green
        { id: randomUUID(), name: 'Support', color: '#6366f1' }, // indigo
      ]
      await db.insert(schema.categories).values(categoriesData)
      console.log(`Inserted ${categoriesData.length} categories.`)
    }

    // 6. Seed Teams
    console.log('🌱 Seeding teams...')
    const existingTeams = await db.select().from(schema.teams)
    if (existingTeams.length === 0) {
      const teamsData = [
        {
          id: randomUUID(),
          name: 'Core Team',
          description: 'Main development team',
          members: allUsers.map((u) => u.id),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: randomUUID(),
          name: 'Design Team',
          description: 'UI/UX Design',
          members: [allUsers[0].id],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]
      await db.insert(schema.teams).values(teamsData)
      console.log(`Inserted ${teamsData.length} teams.`)
    }

    const totalTodos = await db.select({ count: count() }).from(schema.todos)
    console.log(`✅ Seed completed! Total tasks: ${totalTodos[0].count}`)
    process.exit(0)
  } catch (error) {
    console.error('❌ Seed failed:', error)
    process.exit(1)
  }
}

seed()
