import { randomUUID } from 'crypto'
import * as dotenv from 'dotenv'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../src/shared/lib/db/schema'
import { DataGenerator } from './utils/data-generator'

dotenv.config()

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL is not defined')
}

const client = postgres(connectionString)
const db = drizzle(client, { schema })
const gen = new DataGenerator()
type NewUser = typeof schema.users.$inferInsert
type NewUserSkill = typeof schema.userSkills.$inferInsert
type NewProject = typeof schema.projects.$inferInsert
type NewProjectSkill = typeof schema.projectSkills.$inferInsert
type NewProjectMember = typeof schema.projectMembers.$inferInsert
type ProjectStatus = NonNullable<NewProject['status']>

async function seed() {
  console.log('🚀 Iniciando la generación de datos para la Agencia de IA Publicitaria...')

  try {
    // 1. Limpieza de datos existentes
    console.log('🧹 Limpiando datos antiguos...')
    await db.delete(schema.projectMembers)
    await db.delete(schema.userSkills)
    await db.delete(schema.projectSkills)
    await db.delete(schema.todoDependencies)
    await db.delete(schema.todos)
    await db.delete(schema.transactions)
    await db.delete(schema.projects)
    await db.delete(schema.campaigns)
    await db.delete(schema.clients)
    await db.delete(schema.aiTechnologies)
    await db.delete(schema.departments)
    await db.delete(schema.users)
    await db.delete(schema.roles)
    await db.delete(schema.skills)
    await db.delete(schema.jobTitles)
    await db.delete(schema.experienceLevels)
    await db.delete(schema.categories)

    // 2. Roles, Skills, Job Titles, Experience Levels
    console.log('📦 Generando datos maestros...')

    const rolesData = [
      { id: 'role_admin', name: 'Admin', description: 'Acceso total al sistema' },
      { id: 'role_manager', name: 'Manager', description: 'Gestión de equipos y proyectos' },
      { id: 'role_user', name: 'User', description: 'Acceso estándar' },
    ]
    await db.insert(schema.roles).values(rolesData)

    const skillNames = [
      'Machine Learning',
      'NLP',
      'Computer Vision',
      'PyTorch',
      'TensorFlow',
      'Generative AI',
      'LLMs',
      'Stable Diffusion',
      'Data Analysis',
      'Python',
      'React',
      'Node.js',
      'PostgreSQL',
      'Cloud Architecture',
      'API Design',
      'Digital Marketing',
      'AdTech',
      'RTB Systems',
      'Customer Segmentation',
      'Predictive Analytics',
      'A/B Testing',
      'Prompt Engineering',
    ]
    const skillsData = skillNames.map((name) => ({ id: randomUUID(), name }))
    await db.insert(schema.skills).values(skillsData)

    const jobTitlesData = [
      { id: randomUUID(), name: 'Director of AI Strategy' },
      { id: randomUUID(), name: 'AI Engineering Manager' },
      { id: randomUUID(), name: 'Senior AI Research Scientist' },
      { id: randomUUID(), name: 'AI Solutions Architect' },
      { id: randomUUID(), name: 'Full Stack AI Developer' },
      { id: randomUUID(), name: 'NLP Specialist' },
      { id: randomUUID(), name: 'Computer Vision Engineer' },
      { id: randomUUID(), name: 'Data Scientist' },
      { id: randomUUID(), name: 'Junior AI Developer' },
    ]
    await db.insert(schema.jobTitles).values(jobTitlesData)

    const experienceLevelsData = [
      { id: randomUUID(), name: 'Junior' },
      { id: randomUUID(), name: 'Mid' },
      { id: randomUUID(), name: 'Senior' },
      { id: randomUUID(), name: 'Lead/Director' },
    ]
    await db.insert(schema.experienceLevels).values(experienceLevelsData)

    const aiTechnologiesData = [
      {
        id: randomUUID(),
        name: 'Machine Learning',
        description: 'Algoritmos que aprenden de los datos.',
      },
      {
        id: randomUUID(),
        name: 'NLP',
        description: 'Procesamiento de lenguaje natural para texto y voz.',
      },
      {
        id: randomUUID(),
        name: 'Computer Vision',
        description: 'Análisis y comprensión de imágenes y videos.',
      },
      {
        id: randomUUID(),
        name: 'Generative AI',
        description: 'Creación de contenido original (texto, imagen, audio).',
      },
      {
        id: randomUUID(),
        name: 'Predictive Analytics',
        description: 'Predicción de comportamientos futuros basados en datos históricos.',
      },
    ]
    await db.insert(schema.aiTechnologies).values(aiTechnologiesData)

    const clientsData = [
      {
        id: randomUUID(),
        name: 'Global Ad Group',
        industry: 'Advertising',
        contactEmail: 'contact@globalad.com',
        website: 'https://globalad.com',
      },
      {
        id: randomUUID(),
        name: 'Creative Minds Agency',
        industry: 'Advertising',
        contactEmail: 'hello@creativeminds.io',
        website: 'https://creativeminds.io',
      },
      {
        id: randomUUID(),
        name: 'Data-Driven Marketing Co',
        industry: 'Marketing',
        contactEmail: 'info@datadriven.com',
        website: 'https://datadriven.com',
      },
      {
        id: randomUUID(),
        name: 'Digital Frontier',
        industry: 'Digital Media',
        contactEmail: 'ops@digitalfrontier.net',
        website: 'https://digitalfrontier.net',
      },
    ]
    await db.insert(schema.clients).values(clientsData)

    const campaignsData = clientsData.flatMap((client) => [
      {
        id: randomUUID(),
        name: `Summer AI Launch - ${client.name}`,
        description: 'Campaña estacional optimizada por IA.',
        clientId: client.id,
        budget: gen.randomInt(50000, 200000),
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-08-31'),
      },
      {
        id: randomUUID(),
        name: `Automated Engagement 2024 - ${client.name}`,
        description: 'Estrategia de engagement continuo mediante agentes de IA.',
        clientId: client.id,
        budget: gen.randomInt(100000, 500000),
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      },
    ])
    await db.insert(schema.campaigns).values(campaignsData)

    // 3. Departments (6 departamentos, 25 empleados cada uno = 150 empleados)
    console.log('🏢 Generando 10 departamentos...')
    const deptNames = [
      'AI Research & Innovation',
      'Predictive Marketing Analytics',
      'Creative AI & Generative Media',
      'AdTech Platform Engineering',
      'Customer Intelligence & NLP',
      'AI Strategic Consulting',
      'Data Ethics & Governance',
      'Computer Vision Labs',
      'Robotics & Automation',
      'AI Product Management',
    ]

    const deptsData = deptNames.map((name) => ({
      id: randomUUID(),
      name,
      budget: gen.randomInt(500000, 2000000),
      location: gen.randomItem([
        'New York',
        'San Francisco',
        'London',
        'Remote',
        'Berlin',
        'Tokyo',
      ]),
    }))
    await db.insert(schema.departments).values(deptsData)

    // 4. Users (500 empleados)
    console.log('👥 Generando 500 empleados (50 por departamento)...')
    const usersData: NewUser[] = []
    const userSkillsToInsert: NewUserSkill[] = []

    for (const dept of deptsData) {
      for (let i = 0; i < 50; i++) {
        const name = gen.fullName()
        const email = `${name.toLowerCase().replace(/\s+/g, '.')}.${dept.name.split(' ')[0].toLowerCase()}.${i}@ai-ads-agency.com`

        let role, jobTitle, expLevel, salary

        if (i === 0) {
          // Director (1 por dept)
          role = rolesData.find((r) => r.name === 'Manager')
          jobTitle = jobTitlesData.find((jt) => jt.name === 'Director of AI Strategy')
          expLevel = experienceLevelsData.find((el) => el.name === 'Lead/Director')
          salary = gen.randomInt(150000, 250000)
        } else if (i < 8) {
          // Managers/Leads (7 por dept)
          role = rolesData.find((r) => r.name === 'Manager')
          jobTitle = jobTitlesData.find(
            (jt) => jt.name === 'AI Engineering Manager' || jt.name === 'AI Solutions Architect',
          )
          expLevel = experienceLevelsData.find((el) => el.name === 'Senior')
          salary = gen.randomInt(120000, 180000)
        } else if (i < 35) {
          // Senior/Mid (27 por dept)
          role = rolesData.find((r) => r.name === 'User')
          jobTitle = gen.randomItem(
            jobTitlesData.filter(
              (jt) => !jt.name.includes('Director') && !jt.name.includes('Junior'),
            ),
          )
          expLevel = gen.randomItem(
            experienceLevelsData.filter((el) => el.name === 'Senior' || el.name === 'Mid'),
          )
          salary = gen.randomInt(80000, 140000)
        } else {
          // Junior (15 por dept)
          role = rolesData.find((r) => r.name === 'User')
          jobTitle = jobTitlesData.find((jt) => jt.name === 'Junior AI Developer')
          expLevel = experienceLevelsData.find((el) => el.name === 'Junior')
          salary = gen.randomInt(50000, 80000)
        }

        const userId = randomUUID()
        usersData.push({
          id: userId,
          name,
          email,
          roleId: role?.id,
          jobTitleId: jobTitle?.id,
          experienceLevelId: expLevel?.id,
          departmentId: dept.id,
          salary,
          hireDate: gen.randomDate(new Date('2022-01-01'), new Date()),
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name.replace(/\s+/g, '')}`,
          reportsTo: null,
        })

        // Assign 3-5 random skills
        const userSkills = gen.randomItems(skillsData, gen.randomInt(3, 5))
        userSkills.forEach((skill) => {
          userSkillsToInsert.push({ userId, skillId: skill.id })
        })
      }
    }

    // Set reportsTo (Managers report to Director, others to Managers)
    for (const dept of deptsData) {
      const deptUsers = usersData.filter((u) => u.departmentId === dept.id)
      const director = deptUsers[0]
      const managers = deptUsers.slice(1, 4)
      const rest = deptUsers.slice(4)

      managers.forEach((m) => (m.reportsTo = director.id))
      rest.forEach((u, idx) => (u.reportsTo = managers[idx % managers.length].id))
    }

    await db.insert(schema.users).values(usersData)

    // Set department managers now that users are inserted
    for (const dept of deptsData) {
      const director = usersData.find((u) => u.departmentId === dept.id)
      if (director) {
        await db
          .update(schema.departments)
          .set({ managerId: director.id })
          .where(eq(schema.departments.id, dept.id))
      }
    }

    await db.insert(schema.userSkills).values(userSkillsToInsert)
    console.log('✅ Empleados y habilidades creados')

    // 5. Projects (10 por departamento)
    console.log('🚀 Generando 100 proyectos de IA para publicidad...')
    const projectTemplates = [
      {
        name: 'AI-Driven Audience Segmenter',
        desc: 'Uso de clustering y ML para segmentación de audiencias en tiempo real.',
        tech: ['Machine Learning', 'Data Analysis'],
      },
      {
        name: 'Generative Ad Copy Engine',
        desc: 'Plataforma de generación automática de copys publicitarios usando LLMs.',
        tech: ['NLP', 'Generative AI', 'LLMs'],
      },
      {
        name: 'Visual Brand Guard',
        desc: 'Sistema de visión por computadora para asegurar el cumplimiento de marca en anuncios.',
        tech: ['Computer Vision', 'PyTorch'],
      },
      {
        name: 'Predictive Bid Optimizer',
        desc: 'Optimización de pujas en tiempo real basada en probabilidad de conversión.',
        tech: ['Predictive Analytics', 'RTB Systems'],
      },
      {
        name: 'Dynamic Creative Optimization',
        desc: 'Personalización de elementos visuales de anuncios según el perfil del usuario.',
        tech: ['Generative AI', 'Stable Diffusion'],
      },
      {
        name: 'Sentiment Analysis for Campaigns',
        desc: 'Análisis de reacción en redes sociales para ajustar campañas activas.',
        tech: ['NLP', 'Sentiment Analysis'],
      },
    ]

    const projectsData: NewProject[] = []
    const projectSkillsToInsert: NewProjectSkill[] = []
    const projectMembersToInsert: NewProjectMember[] = []
    const projectStatuses: ProjectStatus[] = ['active', 'planning', 'completed', 'on_hold']

    for (const dept of deptsData) {
      for (let i = 0; i < 10; i++) {
        const template = gen.randomItem(projectTemplates)
        const projectId = randomUUID()
        const startDate = gen.randomDate(new Date('2023-01-01'), new Date())

        const client = gen.randomItem(clientsData)
        const campaign = gen.randomItem(campaignsData.filter((c) => c.clientId === client.id))

        projectsData.push({
          id: projectId,
          name: `${template.name} - ${dept.name.split(' ')[0]} - ${i}`,
          description: template.desc,
          status: gen.randomItem(projectStatuses),
          type: 'external',
          priority: gen.randomItem(['high', 'medium', 'low']),
          budget: gen.randomInt(100000, 1000000),
          startDate,
          departmentId: dept.id,
          clientId: client.id,
          campaignId: campaign.id,
        })

        // Assign template skills
        const projectSkills = skillsData.filter((s) => template.tech.includes(s.name))
        projectSkills.forEach((skill) => {
          projectSkillsToInsert.push({ projectId, skillId: skill.id })
        })

        // Assign random team members from department
        const deptUsers = usersData.filter((u) => u.departmentId === dept.id)
        const team = gen.randomItems(deptUsers, gen.randomInt(3, 8))
        team.forEach((user, idx) => {
          projectMembersToInsert.push({
            id: randomUUID(),
            projectId,
            userId: user.id,
            role: idx === 0 ? 'manager' : 'contributor',
            joinedAt: startDate,
          })
        })
      }
    }
    await db.insert(schema.projects).values(projectsData)
    await db.insert(schema.projectSkills).values(projectSkillsToInsert)
    await db.insert(schema.projectMembers).values(projectMembersToInsert)
    console.log('✅ Proyectos y miembros creados')

    console.log('✨ Seed finalizado con éxito!')
  } catch (error) {
    console.error('❌ Error durante el seed:', error)
    throw error
  } finally {
    await client.end()
  }
}

seed()
