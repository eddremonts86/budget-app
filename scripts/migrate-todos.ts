import fs from 'fs'
import path from 'path'

const dbPath = path.resolve(process.cwd(), 'mocks/db.json')

interface Todo {
  id: string
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high'
  dueDate: string
  createdBy: string
  assignedTo: string
  projectId?: string
  createdAt: string
  updatedAt: string
}

interface Project {
  id: string
  name: string
}

interface Db {
  todos: Todo[]
  projects: Project[]
  [key: string]: any
}

const realisticTasks = [
  "Implementar autenticación JWT en microservicio de usuarios",
  "Corregir bug de paginación en listado de productos",
  "Optimizar consultas SQL en dashboard de reportes",
  "Actualizar versión de React de 17 a 18 en frontend",
  "Crear pipeline CI/CD para despliegue automático",
  "Refactorizar componentes de UI para accesibilidad",
  "Integrar pasarela de pagos Stripe",
  "Configurar monitoreo con Sentry",
  "Mejorar tiempo de carga inicial (LCP)",
  "Implementar modo oscuro en toda la aplicación",
  "Migrar base de datos a PostgreSQL",
  "Desarrollar API GraphQL para aplicación móvil",
  "Escribir tests unitarios para utilidades de fecha",
  "Configurar caché de Redis para sesiones",
  "Actualizar documentación de API con Swagger"
]

async function migrate() {
  console.log('Starting migration...')
  
  if (!fs.existsSync(dbPath)) {
    console.error('Database file not found at:', dbPath)
    process.exit(1)
  }

  const db: Db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'))
  const projects = db.projects
  const todos = db.todos

  if (!projects || projects.length === 0) {
    console.error('No projects found. Cannot assign tasks.')
    process.exit(1)
  }

  console.log(`Found ${todos.length} todos and ${projects.length} projects.`)

  // Distribute tasks evenly
  // We can just iterate through todos and assign project[i % projects.length]
  // But to be "random but equitable", we can shuffle projects order first or just simple round robin is fine for equitable distribution.
  // The prompt says "randomly but equitably".
  // Let's create a pool of project IDs that repeats enough times, shuffle it, and assign.
  
  let projectPool: string[] = []
  const repeats = Math.ceil(todos.length / projects.length)
  for (let i = 0; i < repeats; i++) {
    for (const project of projects) {
      projectPool.push(project.id)
    }
  }
  
  // Shuffle pool
  projectPool = projectPool.sort(() => Math.random() - 0.5)
  
  // Trim to size
  projectPool = projectPool.slice(0, todos.length)

  let updatedCount = 0
  let renamedCount = 0

  const projectDistribution: Record<string, number> = {}
  projects.forEach(p => projectDistribution[p.name] = 0)

  const newTodos = todos.map((todo, index) => {
    // Assign project
    const projectId = projectPool[index]
    todo.projectId = projectId
    
    const projectName = projects.find(p => p.id === projectId)?.name || 'Unknown'
    projectDistribution[projectName] = (projectDistribution[projectName] || 0) + 1
    updatedCount++

    // Rename if needed
    if (todo.title.toLowerCase().includes('tarea de ejemplo') || todo.title.toLowerCase().includes('configurar tanstack') || todo.title.length < 10) {
      // Pick a random realistic task name
      const newTitle = realisticTasks[index % realisticTasks.length]
      todo.title = newTitle
      todo.description = `Description for ${newTitle}`
      renamedCount++
    }

    return todo
  })

  db.todos = newTodos

  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2))

  console.log('Migration completed successfully.')
  console.log(`- Tasks assigned to projects: ${updatedCount}`)
  console.log(`- Tasks renamed: ${renamedCount}`)
  console.log('Project Distribution:')
  Object.entries(projectDistribution).forEach(([name, count]) => {
    console.log(`  ${name}: ${count}`)
  })
}

migrate()
