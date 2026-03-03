import * as dotenv from 'dotenv'
import { sql } from 'drizzle-orm'
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

async function audit() {
  console.log('🔍 Iniciando auditoría de la base de datos...')

  const tables = [
    { name: 'Roles', table: schema.roles },
    { name: 'Users', table: schema.users },
    { name: 'Departments', table: schema.departments },
    { name: 'Skills', table: schema.skills },
    { name: 'JobTitles', table: schema.jobTitles },
    { name: 'ExperienceLevels', table: schema.experienceLevels },
    { name: 'Clients', table: schema.clients },
    { name: 'Campaigns', table: schema.campaigns },
    { name: 'Projects', table: schema.projects },
    { name: 'ProjectMembers', table: schema.projectMembers },
    { name: 'UserSkills', table: schema.userSkills },
    { name: 'ProjectSkills', table: schema.projectSkills },
    { name: 'AITechnologies', table: schema.aiTechnologies },
    { name: 'Categories', table: schema.categories },
    { name: 'Teams', table: schema.teams },
    { name: 'TeamMembers', table: schema.teamMembers },
    { name: 'Todos', table: schema.todos },
    { name: 'Transactions', table: schema.transactions },
  ]

  console.log('\n📊 Resumen de registros por tabla:')
  const summary: Array<{ Tabla: string; Registros: number }> = []

  for (const { name, table } of tables) {
    const result = await db.select({ count: sql`count(*)` }).from(table)
    const count = Number(result[0].count)
    summary.push({ Tabla: name, Registros: count })
  }
  console.table(summary)

  console.log('\n🛡️ Verificando integridad referencial...')
  const anomalies: string[] = []

  // 1. Usuarios sin rol válido
  const orphanUsers = await db.execute(sql`
    SELECT count(*) FROM users u 
    LEFT JOIN roles r ON u.role_id = r.id 
    WHERE r.id IS NULL AND u.role_id IS NOT NULL
  `)
  if (Number(orphanUsers[0].count) > 0) {
    anomalies.push(
      `❌ ${orphanUsers[0].count} usuarios tienen un role_id que no existe en la tabla roles.`,
    )
  }

  // 2. Miembros de proyectos sin usuario o proyecto
  const orphanMembers = await db.execute(sql`
    SELECT count(*) FROM project_members pm 
    LEFT JOIN users u ON pm.user_id = u.id 
    LEFT JOIN projects p ON pm.project_id = p.id 
    WHERE u.id IS NULL OR p.id IS NULL
  `)
  if (Number(orphanMembers[0].count) > 0) {
    anomalies.push(`❌ ${orphanMembers[0].count} registros en project_members son huérfanos.`)
  }

  // 3. Todos sin autor o asignado
  const orphanTodos = await db.execute(sql`
    SELECT count(*) FROM todos t 
    LEFT JOIN users u1 ON t.created_by = u1.id 
    LEFT JOIN users u2 ON t.assigned_to = u2.id 
    WHERE (u1.id IS NULL AND t.created_by IS NOT NULL)
       OR (u2.id IS NULL AND t.assigned_to IS NOT NULL)
  `)
  if (Number(orphanTodos[0].count) > 0) {
    anomalies.push(
      `❌ ${orphanTodos[0].count} tareas (todos) tienen un autor o asignado inexistente.`,
    )
  }

  // 4. Transacciones sin usuario o admin
  const orphanTransactions = await db.execute(sql`
    SELECT count(*) FROM transactions t 
    LEFT JOIN users u1 ON t.user_id = u1.id 
    LEFT JOIN users u2 ON t.assigned_admin_id = u2.id
    WHERE (u1.id IS NULL AND t.user_id IS NOT NULL)
       OR (u2.id IS NULL AND t.assigned_admin_id IS NOT NULL)
  `)
  if (Number(orphanTransactions[0].count) > 0) {
    anomalies.push(`❌ ${orphanTransactions[0].count} transacciones tienen un usuario inexistente.`)
  }

  if (anomalies.length === 0) {
    console.log('✅ No se detectaron anomalías de integridad referencial.')
  } else {
    console.log('⚠️ Se detectaron las siguientes anomalías:')
    anomalies.forEach((a) => console.log(a))
  }

  console.log('\n✨ Auditoría finalizada.')
  process.exit(0)
}

audit().catch((err) => {
  console.error('❌ Error durante la auditoría:', err)
  process.exit(1)
})
