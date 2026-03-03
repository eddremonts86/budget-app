import { randomUUID } from 'crypto'
import * as dotenv from 'dotenv'
import { count } from 'drizzle-orm'
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
type NewTeam = typeof schema.teams.$inferInsert
type NewTeamMember = typeof schema.teamMembers.$inferInsert
type NewTodo = typeof schema.todos.$inferInsert
type NewTransaction = typeof schema.transactions.$inferInsert
type TodoStatus = NonNullable<NewTodo['status']>
type TodoPriority = NonNullable<NewTodo['priority']>
type TransactionStatus = NonNullable<NewTransaction['status']>

async function massiveSeed() {
  console.log('🏗️  Iniciando población masiva de datos sintéticos...')

  try {
    // 1. Obtener datos existentes para relaciones
    const users = await db.select().from(schema.users)
    const projects = await db.select().from(schema.projects)
    const roles = await db.select().from(schema.roles)

    if (users.length === 0 || projects.length === 0) {
      throw new Error(
        'Se requiere que las tablas principales (users, projects) tengan datos antes de este seed.',
      )
    }

    // 2. Poblar Categorías (si están vacías)
    const existingCats = await db.select().from(schema.categories)
    let categoriesData = existingCats
    if (existingCats.length === 0) {
      console.log('📂 Generando categorías...')
      const mainCats = [
        {
          id: randomUUID(),
          name: 'Desarrollo AI',
          color: '#3b82f6',
          description: 'Tareas de implementación de modelos',
        },
        {
          id: randomUUID(),
          name: 'Infraestructura',
          color: '#ef4444',
          description: 'Servidores y despliegue',
        },
        {
          id: randomUUID(),
          name: 'Diseño Creativo',
          color: '#ec4899',
          description: 'Generación de assets visuales',
        },
        {
          id: randomUUID(),
          name: 'Análisis de Datos',
          color: '#10b981',
          description: 'Procesamiento de datasets publicitarios',
        },
        {
          id: randomUUID(),
          name: 'Gestión de Clientes',
          color: '#f59e0b',
          description: 'Comunicación y estrategia',
        },
      ]
      await db.insert(schema.categories).values(mainCats)
      categoriesData = await db.select().from(schema.categories)
    }

    // 3. Poblar Teams (Nuevas tablas)
    console.log('👥 Generando 50 equipos...')
    const teamsToInsert: NewTeam[] = []
    for (let i = 0; i < 50; i++) {
      const lead = gen.randomItem(users)
      teamsToInsert.push({
        id: randomUUID(),
        name: `${gen.randomItem(['Squad', 'Team', 'Unit', 'Force'])} ${gen.randomItem(['AI', 'Data', 'Creative', 'Cyber', 'Neural'])} ${i}`,
        description: gen.generateDescription(),
        specialization: gen.randomItem([
          'NLP',
          'Computer Vision',
          'Generative Media',
          'Predictive Ads',
          'AdTech Ops',
        ]),
        leadId: lead.id,
      })
    }
    await db.insert(schema.teams).values(teamsToInsert)
    const allTeams = await db.select().from(schema.teams)

    // 4. Poblar Team Members (Relación N:M)
    console.log('🔗 Asignando miembros a equipos (500-800 registros)...')
    const teamMembersToInsert: NewTeamMember[] = []
    const usedPairs = new Set()
    for (const team of allTeams) {
      const memberCount = gen.randomInt(5, 15)
      const potentialMembers = gen.randomItems(users, memberCount)
      for (const member of potentialMembers) {
        const pairKey = `${team.id}-${member.id}`
        if (!usedPairs.has(pairKey)) {
          teamMembersToInsert.push({
            teamId: team.id,
            userId: member.id,
            joinedAt: gen.randomDate(new Date('2023-01-01'), new Date()),
          })
          usedPairs.add(pairKey)
        }
      }
    }
    await db.insert(schema.teamMembers).values(teamMembersToInsert)

    // 5. Poblar Todos (800-1000 registros)
    console.log('📝 Generando 800-1000 tareas (Todos)...')
    const todosToInsert: NewTodo[] = []
    const todoStatuses: TodoStatus[] = ['pending', 'in_progress', 'completed', 'blocked', 'testing']
    const todoPriorities: TodoPriority[] = ['low', 'medium', 'high']
    for (let i = 0; i < 900; i++) {
      const project = gen.randomItem(projects)
      const creator = gen.randomItem(users)
      const assignee = gen.randomBoolean(0.9) ? gen.randomItem(users) : null
      const category = gen.randomItem(categoriesData)
      const status = gen.randomItem(todoStatuses)

      const isCompleted = status === 'completed'

      todosToInsert.push({
        id: randomUUID(),
        title: gen.generateTaskTitle(),
        description: gen.randomBoolean(0.7) ? gen.generateDescription() : null,
        status,
        priority: gen.randomItem(todoPriorities),
        complexity: gen.randomInt(1, 10),
        estimatedTime: gen.randomInt(2, 40),
        actualTime: isCompleted ? gen.randomInt(1, 50) : null,
        dueDate: gen.randomDate(new Date(), new Date('2026-12-31')),
        completedAt: isCompleted ? new Date() : null,
        createdBy: creator.id,
        assignedTo: assignee?.id || null,
        projectId: project.id,
        categoryId: category.id,
      })
    }
    // Insert in chunks to avoid large payload errors
    for (let i = 0; i < todosToInsert.length; i += 100) {
      await db.insert(schema.todos).values(todosToInsert.slice(i, i + 100))
    }

    // 6. Poblar Transactions (500-700 registros)
    console.log('💰 Generando 600 transacciones...')
    const transactionsToInsert: NewTransaction[] = []
    const transactionStatuses: TransactionStatus[] = ['Approved', 'Pending', 'Rejected']
    for (let i = 0; i < 600; i++) {
      const user = gen.randomItem(users)
      const project = gen.randomBoolean(0.6) ? gen.randomItem(projects) : null
      const category = gen.randomItem(categoriesData)
      const status = gen.randomItem(transactionStatuses)
      const admin =
        status !== 'Pending'
          ? gen.randomItem(
              users.filter((u) => u.roleId !== roles.find((r) => r.name === 'User')?.id),
            )
          : null

      transactionsToInsert.push({
        id: randomUUID(),
        customerName: gen.fullName(),
        customerEmail: gen.email(gen.fullName()),
        status,
        date: gen.randomDate(new Date('2023-01-01'), new Date()),
        amount: gen.randomInt(500, 50000),
        paymentMethod: gen.randomItem(['Credit Card', 'Bank Transfer', 'Crypto', 'PayPal']),
        description: `Servicio de IA: ${gen.randomItem(['NLP API', 'Dataset Processing', 'Model Training', 'Strategic Consulting'])}`,
        userId: user.id,
        projectId: project?.id || null,
        categoryId: category.id,
        assignedAdminId: admin?.id || null,
        approvedBy: status === 'Approved' ? admin?.id : null,
        approvedAt: status === 'Approved' ? new Date() : null,
        rejectionReason:
          status === 'Rejected' ? 'Presupuesto excedido o falta de documentación' : null,
      })
    }
    for (let i = 0; i < transactionsToInsert.length; i += 100) {
      await db.insert(schema.transactions).values(transactionsToInsert.slice(i, i + 100))
    }

    // 7. Resumen e Integridad
    console.log('\n✅ Proceso de población masiva completado.')
    console.log('-----------------------------------------')

    const summary = [
      {
        table: 'Categories',
        count: (await db.select({ val: count() }).from(schema.categories))[0].val,
      },
      { table: 'Teams', count: (await db.select({ val: count() }).from(schema.teams))[0].val },
      {
        table: 'Team Members',
        count: (await db.select({ val: count() }).from(schema.teamMembers))[0].val,
      },
      {
        table: 'Todos (Tareas)',
        count: (await db.select({ val: count() }).from(schema.todos))[0].val,
      },
      {
        table: 'Transactions',
        count: (await db.select({ val: count() }).from(schema.transactions))[0].val,
      },
      {
        table: 'Users (Total)',
        count: (await db.select({ val: count() }).from(schema.users))[0].val,
      },
      {
        table: 'Projects (Total)',
        count: (await db.select({ val: count() }).from(schema.projects))[0].val,
      },
    ]

    console.table(summary)
  } catch (error) {
    console.error('❌ Error durante el seed masivo:', error)
    throw error
  } finally {
    await client.end()
  }
}

massiveSeed()
