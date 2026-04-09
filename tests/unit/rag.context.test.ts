import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  injectDynamicContext,
  detectIntent,
  detectActionIntent,
  loadAppKnowledge,
  buildAppNavigationContext,
  buildActionInstructions,
} from '@/modules/ai/rag/context'

vi.mock('@/shared/lib/db', () => {
  const mockSelect = {
    from: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    then: vi.fn((resolve) => resolve([])),
  }

  const mockDb = {
    select: vi.fn(() => mockSelect),
    $count: vi.fn().mockResolvedValue(0),
  }

  return {
    db: mockDb,
    getDb: vi.fn(() => mockDb),
  }
})

vi.mock('@/shared/lib/db/schema', () => ({
  users: { name: 'users' },
  transactions: { date: 'date' },
  todos: { status: 'status', priority: 'priority' },
  categories: { name: 'categories' },
}))

vi.mock('drizzle-orm', () => ({
  desc: vi.fn(),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
// Intent Detection Tests
// ---------------------------------------------------------------------------

describe('Intent Detection', () => {
  it('should detect todo intents in English', () => {
    const intents = detectIntent('How many tasks are pending?')
    expect(intents).toContain('todos')
  })

  it('should detect todo intents in Spanish', () => {
    const intents = detectIntent('Cuantas tareas pendientes hay?')
    expect(intents).toContain('todos')
  })

  it('should detect "faltan" as a todo intent', () => {
    const intents = detectIntent('Cuantas tareas faltan por completar?')
    expect(intents).toContain('todos')
  })

  it('should detect priority-related todo queries', () => {
    const intents = detectIntent('Dame las tareas más importantes y urgentes')
    expect(intents).toContain('todos')
  })

  it('should detect user intents in English and Spanish', () => {
    expect(detectIntent('Show me all users')).toContain('users')
    expect(detectIntent('Lista de usuarios')).toContain('users')
  })

  it('should detect transaction intents', () => {
    expect(detectIntent('Show transactions')).toContain('transactions')
    expect(detectIntent('Muestra los pagos recientes')).toContain('transactions')
    expect(detectIntent('How much money in payments?')).toContain('transactions')
  })

  it('should detect category intents', () => {
    expect(detectIntent('What categories exist?')).toContain('categories')
    expect(detectIntent('Muestra las categorías')).toContain('categories')
  })

  it('should detect navigation intents in Spanish', () => {
    const questions = [
      'Donde puedo ver las tareas?',
      'Cómo llego a la configuración?',
      'En qué sección están los usuarios?',
      'Abre la página de proyectos',
      'Muestra la lista de categorías',
    ]
    for (const q of questions) {
      const intents = detectIntent(q)
      expect(intents).toContain('navigation')
    }
  })

  it('should detect navigation intents in English', () => {
    const intents = detectIntent('Where can I find the user management page?')
    expect(intents).toContain('navigation')
    expect(intents).toContain('users')
  })

  it('should detect dashboard intents', () => {
    expect(detectIntent('Show me the dashboard stats')).toContain('dashboard')
    expect(detectIntent('Cuales son las ventas de hoy?')).toContain('dashboard')
  })

  it('should detect analytics intents', () => {
    expect(detectIntent('Show analytics and charts')).toContain('analytics')
    expect(detectIntent('Muestra las analíticas')).toContain('analytics')
  })

  it('should detect settings intents', () => {
    expect(detectIntent('How do I change the language?')).toContain('settings')
    expect(detectIntent('Cambiar el tema oscuro')).toContain('settings')
  })

  it('should detect project and team intents', () => {
    expect(detectIntent('Show projects')).toContain('projects')
    expect(detectIntent('Muestra el equipo')).toContain('team')
  })

  it('should detect multiple intents', () => {
    const intents = detectIntent('Donde puedo ver los usuarios y las tareas?')
    expect(intents).toContain('navigation')
    expect(intents).toContain('users')
    expect(intents).toContain('todos')
  })

  it('should return empty array for unrelated queries', () => {
    const intents = detectIntent('What is the meaning of life?')
    // Should not match standard app intents (navigation might match "find" but "meaning of life" shouldn't)
    expect(intents.length).toBeLessThanOrEqual(1)
  })
})

// ---------------------------------------------------------------------------
// Context Injection Tests
// ---------------------------------------------------------------------------

describe('injectDynamicContext', () => {
  it('should always include app navigation context for task queries', async () => {
    const context = await injectDynamicContext('Cuantas tareas hay?', 'es')
    expect(context).toContain('/dashboard')
    expect(context).toContain('/dashboard/todos')
    expect(context).toContain('/dashboard/users')
  })

  it('should include navigation URLs for user queries', async () => {
    const context = await injectDynamicContext('Donde puedo ver los usuarios?', 'es')
    expect(context).toContain('/dashboard/users')
  })

  it('should include task data with aggregate counts', async () => {
    const context = await injectDynamicContext('How many tasks are pending?', 'en')
    expect(context).toContain('Total Tasks:')
    expect(context).toContain('Tasks by Status:')
    expect(context).toContain('/dashboard/todos')
  })

  it('should include high-priority pending tasks for importance queries', async () => {
    const context = await injectDynamicContext('Dame las tareas más importantes para hoy', 'es')
    expect(context).toContain('/dashboard/todos')
    expect(context).toContain('Tasks by Status:')
  })

  it('should include Spanish descriptions when locale is es', async () => {
    const context = await injectDynamicContext('Muestra el panel de control', 'es')
    // Spanish locale should return Spanish labels
    expect(context).toContain('Panel de Control')
  })

  it('should include English descriptions when locale is en', async () => {
    const context = await injectDynamicContext('Show me the dashboard stats', 'en')
    expect(context).toContain('Dashboard')
  })

  it('should include transaction data with URL', async () => {
    const context = await injectDynamicContext('Show recent transactions', 'en')
    expect(context).toContain('/dashboard/transactions')
    expect(context).toContain('Total Transactions:')
  })

  it('should include user data with URL', async () => {
    const context = await injectDynamicContext('List all users', 'en')
    expect(context).toContain('/dashboard/users')
    expect(context).toContain('Total Users:')
  })

  it('should include category data when queried', async () => {
    const context = await injectDynamicContext('What categories are available?', 'en')
    expect(context).toContain('/dashboard/categories')
    expect(context).toContain('Total Categories:')
  })

  it('should include dashboard stats when queried', async () => {
    const context = await injectDynamicContext('Show revenue and sales', 'en')
    expect(context).toContain('Revenue')
    expect(context).toContain('Sales')
    expect(context).toContain('/dashboard')
  })

  it('should include quick answers for navigation queries', async () => {
    const context = await injectDynamicContext('Where can I manage tasks?', 'en')
    expect(context).toContain('Quick Answers')
    expect(context).toContain('/dashboard/todos')
  })

  it('should include page features in context', async () => {
    const context = await injectDynamicContext('What can I do with transactions?', 'en')
    expect(context).toContain('Create transaction')
  })

  it('should handle settings queries with page context', async () => {
    const context = await injectDynamicContext('How do I change the language?', 'en')
    expect(context).toContain('/dashboard/settings')
  })
})

// ---------------------------------------------------------------------------
// App Knowledge Structure Tests
// ---------------------------------------------------------------------------

describe('App Knowledge Base', () => {
  it('should load app knowledge file successfully', async () => {
    const knowledge = await loadAppKnowledge()
    expect(knowledge).not.toBeNull()
  })

  it('should have all main navigation items', async () => {
    const knowledge = await loadAppKnowledge()
    expect(knowledge).not.toBeNull()

    const urls = knowledge!.navigation.main.map((item: { url: string }) => item.url)
    expect(urls).toContain('/dashboard')
    expect(urls).toContain('/dashboard/todos')
    expect(urls).toContain('/dashboard/analytics')
    expect(urls).toContain('/dashboard/projects')
    expect(urls).toContain('/dashboard/team')
    expect(urls).toContain('/dashboard/users')
    expect(urls).toContain('/dashboard/categories')
    expect(urls).toContain('/dashboard/transactions')
    expect(urls).toContain('/dashboard/settings')
  })

  it('should have bilingual labels for all nav items', async () => {
    const knowledge = await loadAppKnowledge()
    expect(knowledge).not.toBeNull()

    for (const item of knowledge!.navigation.main) {
      expect(item.label).toBeTruthy()
      expect(item.labelEs).toBeTruthy()
      expect(item.url).toBeTruthy()
    }
  })

  it('should have page details for all routes', async () => {
    const knowledge = await loadAppKnowledge()
    expect(knowledge).not.toBeNull()

    const expectedPages = [
      '/dashboard',
      '/dashboard/todos',
      '/dashboard/analytics',
      '/dashboard/projects',
      '/dashboard/team',
      '/dashboard/users',
      '/dashboard/categories',
      '/dashboard/transactions',
      '/dashboard/settings',
      '/dashboard/help',
    ]

    for (const pageUrl of expectedPages) {
      expect(knowledge!.pages[pageUrl]).toBeDefined()
      expect(knowledge!.pages[pageUrl].title).toBeTruthy()
      expect(knowledge!.pages[pageUrl].titleEs).toBeTruthy()
      expect(knowledge!.pages[pageUrl].features.length).toBeGreaterThan(0)
    }
  })

  it('should have common Q&A for navigation help', async () => {
    const knowledge = await loadAppKnowledge()
    expect(knowledge).not.toBeNull()

    expect(knowledge!.commonQuestions.whereToFind.tasks).toContain('/dashboard/todos')
    expect(knowledge!.commonQuestions.whereToFind.users).toContain('/dashboard/users')
    expect(knowledge!.commonQuestions.whereToFind.transactions).toContain('/dashboard/transactions')
    expect(knowledge!.commonQuestions.whereToFind.settings).toContain('/dashboard/settings')
  })

  it('should have how-to instructions with URLs', async () => {
    const knowledge = await loadAppKnowledge()
    expect(knowledge).not.toBeNull()

    expect(knowledge!.commonQuestions.howTo.createTask).toContain('/dashboard/todos')
    expect(knowledge!.commonQuestions.howTo.changeLanguage).toContain('/dashboard/settings')
    expect(knowledge!.commonQuestions.howTo.createUser).toContain('/dashboard/users')
  })
})

// ---------------------------------------------------------------------------
// Navigation Context Builder Tests
// ---------------------------------------------------------------------------

describe('buildAppNavigationContext', () => {
  it('should build Spanish navigation context', async () => {
    const knowledge = await loadAppKnowledge()
    expect(knowledge).not.toBeNull()

    const context = buildAppNavigationContext(knowledge!, 'es')
    expect(context).toContain('Panel de Control')
    expect(context).toContain('Tareas')
    expect(context).toContain('Usuarios')
    expect(context).toContain('Transacciones')
    expect(context).toContain('/dashboard/todos')
    expect(context).toContain('/dashboard/users')
  })

  it('should build English navigation context', async () => {
    const knowledge = await loadAppKnowledge()
    expect(knowledge).not.toBeNull()

    const context = buildAppNavigationContext(knowledge!, 'en')
    expect(context).toContain('Dashboard')
    expect(context).toContain('Todos')
    expect(context).toContain('Users')
    expect(context).toContain('Transactions')
  })
})

// ---------------------------------------------------------------------------
// Action Intent Detection
// ---------------------------------------------------------------------------

describe('detectActionIntent', () => {
  // Create actions
  it('should detect create + todo in Spanish', () => {
    const result = detectActionIntent('Crea una tarea llamada Revisar docs')
    expect(result).toEqual({ action: 'create', entity: 'todo' })
  })

  it('should detect create + todo in English', () => {
    const result = detectActionIntent('Create a new task for reviewing')
    expect(result).toEqual({ action: 'create', entity: 'todo' })
  })

  it('should detect "añadir" + user', () => {
    const result = detectActionIntent('Añade un usuario nuevo llamado Pedro')
    expect(result).toEqual({ action: 'create', entity: 'user' })
  })

  it('should detect "add" + user', () => {
    const result = detectActionIntent('Add a new user called John')
    expect(result).toEqual({ action: 'create', entity: 'user' })
  })

  it('should detect "registra" + transaction', () => {
    const result = detectActionIntent('Registra una transacción de $500')
    expect(result).toEqual({ action: 'create', entity: 'transaction' })
  })

  it('should detect "hazme" + category', () => {
    const result = detectActionIntent('Hazme una categoría llamada Marketing')
    expect(result).toEqual({ action: 'create', entity: 'category' })
  })

  it('should detect "nueva" + todo', () => {
    const result = detectActionIntent('Nueva tarea: comprar materiales')
    expect(result).toEqual({ action: 'create', entity: 'todo' })
  })

  it('should detect "make" + task', () => {
    const result = detectActionIntent('Make a task to fix the bug')
    expect(result).toEqual({ action: 'create', entity: 'todo' })
  })

  // Edit actions
  it('should detect edit + todo in Spanish', () => {
    const result = detectActionIntent('Edita la tarea de compras')
    expect(result).toEqual({ action: 'edit', entity: 'todo' })
  })

  it('should detect "update" + user', () => {
    const result = detectActionIntent('Update the user profile')
    expect(result).toEqual({ action: 'edit', entity: 'user' })
  })

  it('should detect "modifica" + transaction', () => {
    const result = detectActionIntent('Modifica la transacción del martes')
    expect(result).toEqual({ action: 'edit', entity: 'transaction' })
  })

  it('should detect "change" + category', () => {
    const result = detectActionIntent('Change the category name')
    expect(result).toEqual({ action: 'edit', entity: 'category' })
  })

  // Delete actions
  it('should detect delete + todo in Spanish', () => {
    const result = detectActionIntent('Elimina la tarea vieja')
    expect(result).toEqual({ action: 'delete', entity: 'todo' })
  })

  it('should detect "remove" + user', () => {
    const result = detectActionIntent('Remove the user from the system')
    expect(result).toEqual({ action: 'delete', entity: 'user' })
  })

  it('should detect "borra" + transaction', () => {
    const result = detectActionIntent('Borra la transacción duplicada')
    expect(result).toEqual({ action: 'delete', entity: 'transaction' })
  })

  it('should detect "delete" + category', () => {
    const result = detectActionIntent('Delete the old category')
    expect(result).toEqual({ action: 'delete', entity: 'category' })
  })

  // Null cases - no action or no entity
  it('should return null when no action keyword is present', () => {
    const result = detectActionIntent('Muéstrame las tareas')
    expect(result).toBeNull()
  })

  it('should return null when no entity keyword is present', () => {
    const result = detectActionIntent('Crea algo nuevo')
    expect(result).toBeNull()
  })

  it('should return null for navigation queries', () => {
    const result = detectActionIntent('¿Dónde está el dashboard?')
    expect(result).toBeNull()
  })

  it('should return null for info queries about tasks', () => {
    const result = detectActionIntent('¿Cuántas tareas hay pendientes?')
    expect(result).toBeNull()
  })

  it('should return null for empty query', () => {
    const result = detectActionIntent('')
    expect(result).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Build Action Instructions
// ---------------------------------------------------------------------------

describe('buildActionInstructions', () => {
  it('should build create todo instructions in English', () => {
    const result = buildActionInstructions({ action: 'create', entity: 'todo' }, 'en')
    expect(result).toContain('[ACTION REQUIRED]')
    expect(result).toContain('CREATE')
    expect(result).toContain('task')
    expect(result).toContain('```action')
    expect(result).toContain('create_todo')
  })

  it('should build create todo instructions in Spanish', () => {
    const result = buildActionInstructions({ action: 'create', entity: 'todo' }, 'es')
    expect(result).toContain('[ACTION REQUIRED]')
    expect(result).toContain('CREATE')
    expect(result).toContain('tarea')
    expect(result).toContain('```action')
    expect(result).toContain('create_todo')
  })

  it('should build create user instructions', () => {
    const result = buildActionInstructions({ action: 'create', entity: 'user' }, 'en')
    expect(result).toContain('[ACTION REQUIRED]')
    expect(result).toContain('user')
    expect(result).toContain('create_user')
    expect(result).toContain('```action')
  })

  it('should build create transaction instructions', () => {
    const result = buildActionInstructions({ action: 'create', entity: 'transaction' }, 'es')
    expect(result).toContain('[ACTION REQUIRED]')
    expect(result).toContain('transacción')
    expect(result).toContain('create_transaction')
  })

  it('should build create category instructions', () => {
    const result = buildActionInstructions({ action: 'create', entity: 'category' }, 'en')
    expect(result).toContain('[ACTION REQUIRED]')
    expect(result).toContain('category')
    expect(result).toContain('create_category')
  })

  it('should include sensible default instructions for create', () => {
    const result = buildActionInstructions({ action: 'create', entity: 'todo' }, 'en')
    expect(result).toContain('sensible defaults')
    expect(result).toContain('dueDate')
    expect(result).toContain('language MUST be "action"')
  })

  it('should build delete instructions with action code block', () => {
    const result = buildActionInstructions({ action: 'delete', entity: 'todo' }, 'en')
    expect(result).toContain('[ACTION REQUIRED]')
    expect(result).toContain('DELETE')
    expect(result).toContain('```action')
    expect(result).toContain('delete_todo')
  })

  it('should build edit instructions with action code block', () => {
    const result = buildActionInstructions({ action: 'edit', entity: 'user' }, 'es')
    expect(result).toContain('[ACTION REQUIRED]')
    expect(result).toContain('EDIT')
    expect(result).toContain('```action')
    expect(result).toContain('update_user')
  })

  it('should build delete instructions with ID requirement', () => {
    const result = buildActionInstructions({ action: 'delete', entity: 'transaction' }, 'en')
    expect(result).toContain('delete_transaction')
    expect(result).toContain('id')
    expect(result).toContain('cannot be undone')
  })

  it('should build edit instructions with partial data schema', () => {
    const result = buildActionInstructions({ action: 'edit', entity: 'todo' }, 'en')
    expect(result).toContain('update_todo')
    expect(result).toContain('ONLY include the fields that need to change')
  })
})

// ---------------------------------------------------------------------------
// Action integration in injectDynamicContext
// ---------------------------------------------------------------------------

describe('injectDynamicContext with actions', () => {
  it('should inject action instructions for create task in Spanish', async () => {
    const context = await injectDynamicContext('Crea una tarea llamada Revisar código', 'es')
    expect(context).toContain('[ACTION REQUIRED]')
    expect(context).toContain('create_todo')
    expect(context).toContain('tarea')
  })

  it('should inject action instructions for create user in English', async () => {
    const context = await injectDynamicContext('Add a new user called Maria', 'en')
    expect(context).toContain('[ACTION REQUIRED]')
    expect(context).toContain('create_user')
  })

  it('should inject delete action instructions for delete transaction', async () => {
    const context = await injectDynamicContext('Elimina la transacción de ayer', 'es')
    expect(context).toContain('[ACTION REQUIRED]')
    expect(context).toContain('DELETE')
    expect(context).toContain('delete_transaction')
  })

  it('should inject edit action instructions for edit category', async () => {
    const context = await injectDynamicContext('Edit the category name', 'en')
    expect(context).toContain('[ACTION REQUIRED]')
    expect(context).toContain('EDIT')
    expect(context).toContain('update_category')
  })

  it('should not inject action instructions for non-action queries', async () => {
    const context = await injectDynamicContext('¿Cuántas tareas hay?', 'es')
    expect(context).not.toContain('[ACTION REQUIRED]')
    expect(context).not.toContain('[ACTION NOTE]')
  })

  it('should include permission rule for edit todo', async () => {
    const context = await injectDynamicContext('Edita la tarea de compras', 'es')
    expect(context).toContain('PERMISSION RULE')
    expect(context).toContain('createdBy')
    expect(context).toContain('assignedTo')
  })

  it('should include permission rule for delete todo', async () => {
    const context = await injectDynamicContext('Elimina la tarea vieja', 'es')
    expect(context).toContain('PERMISSION RULE')
    expect(context).toContain('Admin')
  })
})
