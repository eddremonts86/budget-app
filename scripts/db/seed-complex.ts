import { randomUUID } from 'crypto'
import * as dotenv from 'dotenv'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../../src/shared/lib/db/schema'
import { DataGenerator } from './utils/data-generator'

dotenv.config()

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL is not defined')
}

const client = postgres(connectionString)
const db = drizzle(client, { schema })
const gen = new DataGenerator()

async function seed() {
  console.log('🌱 Starting complex seed...')

  try {
    console.log('🧹 Cleaning existing data...')
    await db.delete(schema.transactions)
    await db.delete(schema.todos)
    await db.delete(schema.projects)
    await db.delete(schema.teams)
    await db.delete(schema.departments)
    await db.delete(schema.users)
    await db.delete(schema.categories)

    console.log('👤 Generating 50 users...')
    const usersData = []
    const jobTitles = [
      'Project Manager',
      'Product Owner',
      'Tech Lead',
      'Senior Developer',
      'Frontend Developer',
      'Backend Developer',
      'Full Stack Developer',
      'QA Engineer',
      'UI/UX Designer',
      'DevOps Engineer',
      'Business Analyst',
    ]
    const departments = ['Engineering', 'Product', 'Design', 'QA', 'Operations']

    for (let i = 0; i < 50; i++) {
      const name = gen.fullName()
      const isManager = i < 5
      const jobTitle = isManager ? 'Engineering Manager' : gen.randomItem(jobTitles)
      const email = `${name.toLowerCase().replace(' ', '.')}.${i}@example.com`

      usersData.push({
        id: `user_${randomUUID()}`,
        name,
        email,
        role: i < 3 ? 'admin' : 'user',
        jobTitle,
        department: gen.randomItem(departments),
        hireDate: gen.randomDate(new Date('2020-01-01'), new Date()),
        experienceLevel: ['Junior', 'Mid', 'Senior', 'Lead'][gen.randomInt(0, 3)],
        skills: gen.randomItems(
          ['React', 'Node', 'TypeScript', 'SQL', 'Python', 'AWS', 'Docker'],
          gen.randomInt(2, 5),
        ),
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name.replace(' ', '')}`,
      })
    }

    const managers = usersData.slice(0, 5)
    usersData.forEach((u, i) => {
      if (i >= 5) {
        ;(u as any).reportsTo = managers[i % 5].id
      }
    })

    await db.insert(schema.users).values(usersData as any)
    console.log('✅ Users created')

    console.log('🏢 Generating 5 departments...')
    const departmentsData = []
    const deptNames = ['Engineering', 'Product', 'Design', 'Sales', 'Marketing']
    const locations = ['New York', 'London', 'Berlin', 'Tokyo', 'Remote']

    for (let i = 0; i < 5; i++) {
      departmentsData.push({
        id: `dept_${randomUUID()}`,
        name: deptNames[i],
        managerId: usersData[i].id,
        budget: gen.randomInt(50000, 1000000),
        location: gen.randomItem(locations),
      })
    }
    await db.insert(schema.departments).values(departmentsData as any)
    console.log('✅ Departments created')

    console.log('👥 Generating 8 teams...')
    const teamsData = []
    const teamNames = [
      'Web Development',
      'Mobile Innovation',
      'Platform Core',
      'Data Analytics',
      'Security Ops',
      'Customer Experience',
      'Growth Hacking',
      'Legacy Migration',
    ]

    for (let i = 0; i < 8; i++) {
      const lead = usersData[gen.randomInt(0, 10)]
      const members = gen.randomItems(usersData, gen.randomInt(4, 6)).map((u) => u.id)

      teamsData.push({
        id: `team_${randomUUID()}`,
        name: teamNames[i],
        description: `Responsible for ${teamNames[i]} initiatives and deliverables.`,
        specialization: ['Frontend', 'Backend', 'Fullstack', 'DevOps', 'Mobile'][
          gen.randomInt(0, 4)
        ],
        leadId: lead.id,
        members,
      })
    }
    await db.insert(schema.teams).values(teamsData as any)
    console.log('✅ Teams created')

    console.log('🚀 Generating 10 projects...')
    const projectsData = []
    const projectNames = [
      'Inventory Management System',
      'E-commerce App Redesign',
      'Customer Portal v2',
      'Internal HR Dashboard',
      'Payment Gateway Integration',
      'AI Recommendation Engine',
      'Mobile App Refactor',
      'Cloud Infrastructure Migration',
      'Analytics Pipeline',
      'Corporate Website Refresh',
    ]
    const projectStatuses = ['planning', 'active', 'on_hold', 'completed', 'active']

    for (let i = 0; i < 10; i++) {
      const status = gen.randomItem(projectStatuses)
      const startDate = gen.randomDate(new Date('2023-01-01'), new Date('2024-01-01'))
      const endDate = new Date(startDate)
      endDate.setMonth(endDate.getMonth() + gen.randomInt(3, 12))

      const assignedTeams = gen.randomItems(teamsData, gen.randomInt(1, 3)).map((t) => t.id)

      projectsData.push({
        id: `proj_${randomUUID()}`,
        name: projectNames[i],
        description: `Strategic project focusing on ${projectNames[i]} to improve business outcomes.`,
        status,
        priority: ['low', 'medium', 'high'][gen.randomInt(0, 2)],
        budget: gen.randomInt(10000, 500000),
        startDate,
        endDate,
        technologies: gen.randomItems(['React', 'Node', 'Postgres', 'Redis', 'AWS'], 3),
        departmentId: gen.randomItem(departmentsData).id,
        team: assignedTeams,
      })
    }
    await db.insert(schema.projects).values(projectsData as any)
    console.log('✅ Projects created')

    console.log('🏷️ Generating 15 categories...')
    const categoriesData: Array<{
      id: string
      name: string
      description: string
      color: string
      sla: number
      parentId: string | null
    }> = []
    const mainCats = ['Development', 'Design', 'QA', 'DevOps', 'Management']
    const subCats = [
      'Frontend',
      'Backend',
      'UI',
      'UX',
      'Unit Tests',
      'E2E Tests',
      'CI/CD',
      'Infrastructure',
      'Planning',
      'Reporting',
    ]

    for (let i = 0; i < 5; i++) {
      categoriesData.push({
        id: `cat_main_${i}`,
        name: mainCats[i],
        description: `Tasks related to ${mainCats[i]}`,
        color: gen.randomItem([
          '#ef4444',
          '#f97316',
          '#eab308',
          '#22c55e',
          '#3b82f6',
          '#8b5cf6',
          '#ec4899',
        ]),
        sla: 24,
        parentId: null,
      })
    }

    for (let i = 0; i < 10; i++) {
      const parent = categoriesData[i % 5]
      categoriesData.push({
        id: `cat_sub_${i}`,
        name: subCats[i],
        description: `Specific ${subCats[i]} tasks`,
        color: parent.color,
        sla: 12,
        parentId: parent.id,
      })
    }
    await db.insert(schema.categories).values(categoriesData as any)
    console.log('✅ Categories created')

    console.log('📝 Generating 1234 tasks...')
    const todosData = []
    const taskVerbs = [
      'Implement',
      'Fix',
      'Design',
      'Review',
      'Update',
      'Refactor',
      'Test',
      'Deploy',
      'Analyze',
      'Document',
    ]
    const taskNouns = [
      'API',
      'UI',
      'Database',
      'Auth',
      'Login',
      'Dashboard',
      'Reports',
      'Settings',
      'Profile',
      'Search',
      'Filter',
      'Navigation',
    ]

    for (let i = 0; i < 1234; i++) {
      const project = projectsData[gen.randomInt(0, projectsData.length - 1)]
      const category = categoriesData[gen.randomInt(0, categoriesData.length - 1)]
      const assignee = usersData[gen.randomInt(0, usersData.length - 1)]
      const creator = usersData[gen.randomInt(0, usersData.length - 1)]

      const rand = Math.random()
      let priority = 'medium'
      if (rand < 0.2) priority = 'high'
      else if (rand > 0.8) priority = 'low'

      const estimatedTime = gen.randomInt(1, 40)
      const actualTime =
        Math.random() > 0.3 ? Math.floor(estimatedTime * (0.8 + Math.random() * 0.4)) : null

      const statuses = ['pending', 'in_progress', 'completed', 'pending', 'in_progress']
      const status = gen.randomItem(statuses)

      const createdAt = gen.randomDate(new Date(project.startDate!), new Date())
      const dueDate = new Date(createdAt)
      dueDate.setDate(dueDate.getDate() + gen.randomInt(1, 14))

      todosData.push({
        id: `todo_${randomUUID()}`,
        title: `${gen.randomItem(taskVerbs)} ${gen.randomItem(taskNouns)} ${i}`,
        description: `Detailed description for task ${i}. Includes acceptance criteria and notes.`,
        status: status as any,
        priority: priority as any,
        complexity: gen.randomInt(1, 5),
        estimatedTime,
        actualTime,
        dueDate,
        acceptanceCriteria: '- Criteria 1\n- Criteria 2\n- Criteria 3',
        projectId: project.id,
        categoryId: category.id,
        assignedTo: assignee.id,
        createdBy: creator.id,
        createdAt,
        updatedAt: new Date(),
        completedAt: status === 'completed' ? gen.randomDate(createdAt, new Date()) : null,
        dependencies: i > 0 && Math.random() < 0.1 ? [todosData[gen.randomInt(0, i - 1)].id] : null,
      })
    }

    const chunkSize = 100
    for (let i = 0; i < todosData.length; i += chunkSize) {
      const chunk = todosData.slice(i, i + chunkSize)
      await db.insert(schema.todos).values(chunk as any)
    }
    console.log('✅ Tasks created')

    console.log('🎉 Seed completed successfully!')
  } catch (error) {
    console.error('❌ Seed failed:', error)
  } finally {
    await client.end()
  }
}

seed()
