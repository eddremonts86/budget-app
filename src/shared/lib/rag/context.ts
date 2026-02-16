import fs from 'fs/promises'
import path from 'path'

// ---------------------------------------------------------------------------
// Intent Detection
// ---------------------------------------------------------------------------

type Intent =
  | 'users'
  | 'todos'
  | 'transactions'
  | 'categories'
  | 'dashboard'
  | 'analytics'
  | 'projects'
  | 'team'
  | 'settings'
  | 'help'
  | 'navigation'
  | 'status'

// ---------------------------------------------------------------------------
// Action Detection (CRUD operations)
// ---------------------------------------------------------------------------

type ActionType = 'create' | 'edit' | 'delete'
type ActionEntity = 'todo' | 'user' | 'transaction' | 'category'

interface ActionIntent {
  action: ActionType
  entity: ActionEntity
}

const ACTION_KEYWORDS: Record<ActionType, string[]> = {
  create: [
    'crea',
    'crear',
    'create',
    'add',
    'añadir',
    'añade',
    'agregar',
    'agrega',
    'nueva',
    'nuevo',
    'new',
    'registra',
    'registrar',
    'genera',
    'generar',
    'haz',
    'hazme',
    'pon',
    'ponme',
    'make',
  ],
  edit: [
    'edita',
    'editar',
    'edit',
    'update',
    'actualiza',
    'actualizar',
    'modifica',
    'modificar',
    'cambia',
    'cambiar',
    'change',
    'modify',
  ],
  delete: [
    'elimina',
    'eliminar',
    'delete',
    'remove',
    'borra',
    'borrar',
    'quita',
    'quitar',
    'remueve',
    'remover',
  ],
}

const ENTITY_KEYWORDS: Record<ActionEntity, string[]> = {
  todo: ['tarea', 'tareas', 'task', 'tasks', 'todo', 'todos', 'pendiente'],
  user: ['usuario', 'usuarios', 'user', 'users', 'miembro', 'member'],
  transaction: [
    'transacción',
    'transaccion',
    'transacciones',
    'transaction',
    'transactions',
    'pago',
    'pagos',
  ],
  category: ['categoría', 'categoria', 'categorias', 'category', 'categories'],
}

function detectActionIntent(query: string): ActionIntent | null {
  const lowerQuery = query.toLowerCase()

  let detectedAction: ActionType | null = null
  let detectedEntity: ActionEntity | null = null

  for (const [action, keywords] of Object.entries(ACTION_KEYWORDS)) {
    if (keywords.some((kw) => lowerQuery.includes(kw))) {
      detectedAction = action as ActionType
      break
    }
  }

  if (!detectedAction) return null

  for (const [entity, keywords] of Object.entries(ENTITY_KEYWORDS)) {
    if (keywords.some((kw) => lowerQuery.includes(kw))) {
      detectedEntity = entity as ActionEntity
      break
    }
  }

  if (!detectedEntity) return null

  return { action: detectedAction, entity: detectedEntity }
}

// ---------------------------------------------------------------------------

const INTENT_KEYWORDS: Record<Intent, string[]> = {
  users: [
    'user',
    'usuario',
    'usuarios',
    'admin',
    'administrador',
    'rol',
    'role',
    'miembro',
    'member',
  ],
  todos: [
    'task',
    'tasks',
    'tarea',
    'tareas',
    'todo',
    'todos',
    'pendiente',
    'pendientes',
    'resolver',
    'completar',
    'falta',
    'faltan',
    'prioridad',
    'priority',
    'urgente',
    'importante',
    'hoy',
    'mañana',
    'vencida',
    'overdue',
    'progreso',
    'progress',
    'in_progress',
  ],
  transactions: [
    'transaction',
    'transactions',
    'transacción',
    'transacciones',
    'transaccion',
    'payment',
    'pago',
    'pagos',
    'amount',
    'monto',
    'dinero',
    'revenue',
    'ingreso',
    'cliente',
    'customer',
  ],
  categories: [
    'category',
    'categories',
    'categoría',
    'categorias',
    'categoria',
    'color',
    'etiqueta',
    'label',
  ],
  dashboard: [
    'dashboard',
    'panel',
    'inicio',
    'home',
    'estadísticas',
    'estadisticas',
    'stats',
    'suscripciones',
    'subscriptions',
    'ventas',
    'sales',
    'activos',
    'active',
    'revenue',
    'ingresos',
  ],
  analytics: [
    'analytics',
    'analíticas',
    'analiticas',
    'chart',
    'gráfico',
    'grafico',
    'views',
    'vistas',
    'reporte',
    'report',
  ],
  projects: ['project', 'projects', 'proyecto', 'proyectos'],
  team: ['team', 'equipo', 'miembros', 'members'],
  settings: [
    'settings',
    'configuración',
    'configuracion',
    'ajustes',
    'idioma',
    'language',
    'tema',
    'theme',
    'dark',
    'light',
    'oscuro',
    'claro',
  ],
  help: ['help', 'ayuda', 'asistente', 'assistant', 'chat', 'ia', 'ai'],
  navigation: [
    'donde',
    'dónde',
    'where',
    'cómo llego',
    'como llego',
    'how to find',
    'navigate',
    'navegar',
    'ir a',
    'go to',
    'página',
    'pagina',
    'page',
    'sección',
    'seccion',
    'section',
    'menú',
    'menu',
    'sidebar',
    'barra lateral',
    'ver lista',
    'ver la lista',
    'ver los',
    'ver las',
    'lista de',
    'encontrar',
    'find',
    'acceder',
    'access',
    'abrir',
    'open',
    'mostrar',
    'show',
    'url',
    'enlace',
    'link',
  ],
  status: ['status', 'estado', 'system', 'sistema', 'health', 'salud'],
}

function detectIntent(query: string): Intent[] {
  const intents: Intent[] = []
  const lowerQuery = query.toLowerCase()

  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    if (keywords.some((kw) => lowerQuery.includes(kw))) {
      intents.push(intent as Intent)
    }
  }

  return intents
}

// ---------------------------------------------------------------------------
// Application Knowledge Base (always injected as base context)
// ---------------------------------------------------------------------------

interface AppKnowledge {
  navigation: {
    main: Array<{
      label: string
      labelEs: string
      url: string
      description?: string
      descriptionEs?: string
    }>
    secondary: Array<{
      label: string
      labelEs: string
      url?: string
      action?: string
    }>
  }
  pages: Record<
    string,
    {
      title: string
      titleEs: string
      features: string[]
      actions?: string[]
    }
  >
  commonQuestions: {
    whereToFind: Record<string, string>
    howTo: Record<string, string>
  }
}

let cachedKnowledge: AppKnowledge | null = null

async function loadAppKnowledge(): Promise<AppKnowledge | null> {
  if (cachedKnowledge) return cachedKnowledge

  try {
    const knowledgePath = path.resolve(process.cwd(), 'mocks/app-knowledge.json')
    const content = await fs.readFile(knowledgePath, 'utf-8')
    const data = JSON.parse(content)
    cachedKnowledge = data as AppKnowledge
    return cachedKnowledge
  } catch {
    return null
  }
}

function buildAppNavigationContext(knowledge: AppKnowledge, locale: string): string {
  const isSpanish = locale.startsWith('es')
  const lines = ['[Application Navigation — Available Pages]']

  for (const item of knowledge.navigation.main) {
    const label = isSpanish ? item.labelEs : item.label
    const desc = isSpanish ? (item.descriptionEs ?? item.description) : item.description
    lines.push(`• ${label}: ${item.url}${desc ? ` — ${desc}` : ''}`)
  }

  for (const item of knowledge.navigation.secondary) {
    const label = isSpanish ? item.labelEs : item.label
    if (item.url) {
      lines.push(`• ${label}: ${item.url}`)
    } else if (item.action) {
      lines.push(`• ${label}: ${item.action}`)
    }
  }

  return lines.join('\n')
}

function buildPageContext(knowledge: AppKnowledge, pageUrl: string, locale: string): string {
  const page = knowledge.pages[pageUrl]
  if (!page) return ''

  const isSpanish = locale.startsWith('es')
  const title = isSpanish ? page.titleEs : page.title
  const lines = [`[Page: ${title} (${pageUrl})]`]
  lines.push(`Features: ${page.features.join('; ')}`)
  if (page.actions) {
    lines.push(`Available actions: ${page.actions.join(', ')}`)
  }
  return lines.join('\n')
}

function buildCommonAnswersContext(knowledge: AppKnowledge, intents: Intent[]): string {
  const lines: string[] = []

  // Map intents to whereToFind keys
  const intentToKey: Partial<Record<Intent, string>> = {
    todos: 'tasks',
    users: 'users',
    transactions: 'transactions',
    analytics: 'analytics',
    settings: 'settings',
    projects: 'projects',
    team: 'team',
    categories: 'categories',
    help: 'help',
  }

  for (const intent of intents) {
    const key = intentToKey[intent]
    if (key && knowledge.commonQuestions.whereToFind[key]) {
      lines.push(knowledge.commonQuestions.whereToFind[key])
    }
  }

  return lines.length > 0 ? `[Quick Answers]\n${lines.join('\n')}` : ''
}

// ---------------------------------------------------------------------------
// Dynamic Context (data from mock DB)
// ---------------------------------------------------------------------------

interface MockDb {
  todos?: Array<{
    id: string
    title: string
    description: string
    status: string
    priority: string
    dueDate: string
    createdBy: string
    assignedTo: string
    createdAt: string
    updatedAt: string
  }>
  users?: Array<{
    id: string
    name: string
    email: string
    role: string
    avatar: string
    createdAt: string
  }>
  categories?: Array<{
    id: string
    name: string
    color: string
  }>
  recentTransactions?: Array<{
    id: string
    customer: { name: string; email: string }
    status: string
    date: string
    amount: number
  }>
  dashboardStats?: {
    revenue: { value: number; change: number; trend: string }
    subscriptions: { value: number; change: number; trend: string }
    sales: { value: number; change: number; trend: string }
    activeNow: { value: number; change: number; trend: string }
  }
}

let cachedDb: MockDb | null = null

async function loadMockDb(): Promise<MockDb | null> {
  if (cachedDb) return cachedDb

  try {
    const mockDbPath = path.resolve(process.cwd(), 'mocks/db.json')
    const content = await fs.readFile(mockDbPath, 'utf-8')
    cachedDb = JSON.parse(content) as MockDb
    return cachedDb
  } catch {
    return null
  }
}

function buildDataContext(db: MockDb, intents: Intent[]): string {
  const sections: string[] = []

  if (intents.includes('users') && db.users) {
    sections.push(
      [
        `[Users Data — View at /dashboard/users]`,
        `Total Users: ${db.users.length}`,
        `Users: ${JSON.stringify(db.users.map((u) => ({ name: u.name, email: u.email, role: u.role })))}`,
      ].join('\n'),
    )
  }

  if (
    (intents.includes('transactions') || intents.includes('dashboard')) &&
    db.recentTransactions
  ) {
    sections.push(
      [
        `[Transactions Data — View at /dashboard/transactions]`,
        `Total Transactions: ${db.recentTransactions.length}`,
        `Transactions: ${JSON.stringify(db.recentTransactions.map((t) => ({ customer: t.customer.name, status: t.status, amount: `$${t.amount}`, date: t.date })))}`,
      ].join('\n'),
    )
  }

  if (intents.includes('todos') && db.todos) {
    const statusCounts: Record<string, number> = {}
    const priorityCounts: Record<string, number> = {}
    for (const todo of db.todos) {
      const status = todo.status || 'unknown'
      statusCounts[status] = (statusCounts[status] || 0) + 1
      const priority = todo.priority || 'unknown'
      priorityCounts[priority] = (priorityCounts[priority] || 0) + 1
    }

    // Get high-priority pending tasks as "important for today"
    const highPriorityPending = db.todos
      .filter((t) => t.priority === 'high' && t.status === 'pending')
      .slice(0, 10)

    sections.push(
      [
        `[Tasks/Todos Data — View at /dashboard/todos]`,
        `Total Tasks: ${db.todos.length}`,
        `Tasks by Status: ${JSON.stringify(statusCounts)}`,
        `Tasks by Priority: ${JSON.stringify(priorityCounts)}`,
        highPriorityPending.length > 0
          ? `High-Priority Pending Tasks (most important): ${JSON.stringify(highPriorityPending.map((t) => ({ id: t.id, title: t.title, priority: t.priority, dueDate: t.dueDate })))}`
          : '',
        `Sample Tasks: ${JSON.stringify(db.todos.slice(0, 5).map((t) => ({ id: t.id, title: t.title, status: t.status, priority: t.priority, dueDate: t.dueDate })))}`,
      ]
        .filter(Boolean)
        .join('\n'),
    )
  }

  if (intents.includes('categories') && db.categories) {
    sections.push(
      [
        `[Categories Data — View at /dashboard/categories]`,
        `Total Categories: ${db.categories.length}`,
        `Categories: ${JSON.stringify(db.categories.map((c) => ({ name: c.name, color: c.color })))}`,
      ].join('\n'),
    )
  }

  if (intents.includes('dashboard') && db.dashboardStats) {
    const s = db.dashboardStats
    sections.push(
      [
        `[Dashboard Stats — View at /dashboard]`,
        `Revenue: $${s.revenue.value.toLocaleString()} (${s.revenue.trend === 'up' ? '+' : '-'}${s.revenue.change}%)`,
        `Subscriptions: ${s.subscriptions.value.toLocaleString()} (${s.subscriptions.trend === 'up' ? '+' : '-'}${s.subscriptions.change}%)`,
        `Sales: ${s.sales.value.toLocaleString()} (${s.sales.trend === 'up' ? '+' : '-'}${s.sales.change}%)`,
        `Active Now: ${s.activeNow.value}`,
      ].join('\n'),
    )
  }

  if (intents.includes('status')) {
    sections.push(
      [
        `[System Status]`,
        `Time: ${new Date().toISOString()}`,
        `Environment: ${process.env.NODE_ENV}`,
      ].join('\n'),
    )
  }

  return sections.join('\n\n')
}

// ---------------------------------------------------------------------------
// Action Instructions (injected when user wants to perform an action)
// ---------------------------------------------------------------------------

const ACTION_CREATE_SCHEMAS: Record<ActionEntity, string> = {
  todo: `{"title":"<task title>","description":"<task description>","status":"pending","priority":"medium","dueDate":"<YYYY-MM-DD>","assignedTo":"<userId>"}`,
  user: `{"name":"<user name>","email":"<user email>","role":"user","avatar":"https://api.dicebear.com/7.x/avataaars/svg?seed=<name>","createdAt":"<ISO date>"}`,
  transaction: `{"customer":{"name":"<customer name>","email":"<email>"},"status":"Pending","date":"<YYYY-MM-DD>","amount":<number>}`,
  category: `{"name":"<category name>","color":"<hex color>"}`,
}

const ACTION_UPDATE_SCHEMAS: Record<ActionEntity, string> = {
  todo: `{"title":"<new title>","description":"<new description>","status":"<pending|in_progress|completed>","priority":"<low|medium|high>","dueDate":"<YYYY-MM-DD>","assignedTo":"<userId>"}`,
  user: `{"name":"<new name>","email":"<new email>","role":"<admin|user>"}`,
  transaction: `{"customer":{"name":"<name>","email":"<email>"},"status":"<Approved|Pending|Rejected>","amount":<number>}`,
  category: `{"name":"<new name>","color":"<new hex color>"}`,
}

const ENTITY_LABELS: Record<ActionEntity, { en: string; es: string }> = {
  todo: { en: 'task', es: 'tarea' },
  user: { en: 'user', es: 'usuario' },
  transaction: { en: 'transaction', es: 'transacción' },
  category: { en: 'category', es: 'categoría' },
}

function buildActionInstructions(actionIntent: ActionIntent, locale: string): string {
  const isSpanish = locale.startsWith('es')
  const entityLabel = isSpanish
    ? ENTITY_LABELS[actionIntent.entity].es
    : ENTITY_LABELS[actionIntent.entity].en

  if (actionIntent.action === 'create') {
    const schema = ACTION_CREATE_SCHEMAS[actionIntent.entity]
    return [
      `[ACTION REQUIRED]`,
      `The user wants to CREATE a new ${entityLabel}.`,
      `Extract the details from their message and generate a response that:`,
      `1. Confirms what you understood from their request`,
      `2. Includes a fenced code block with language "action" containing a JSON object with the action details`,
      `3. The JSON must follow this EXACT format:`,
      '```action',
      `{"type":"create_${actionIntent.entity}","data":${schema}}`,
      '```',
      `4. Fill in the data fields based on what the user provided. Use sensible defaults for missing fields.`,
      `5. For dueDate, use today's date (${new Date().toISOString().split('T')[0]}) if not specified.`,
      `6. For assignedTo, use the current user's ID from the context data if available.`,
      `7. After the code block, tell the user to click the button to confirm the creation.`,
      `IMPORTANT: The code block language MUST be "action" (not json, not javascript). This triggers the UI button.`,
    ].join('\n')
  }

  if (actionIntent.action === 'edit') {
    const schema = ACTION_UPDATE_SCHEMAS[actionIntent.entity]
    return [
      `[ACTION REQUIRED]`,
      `The user wants to EDIT/UPDATE a ${entityLabel}.`,
      `You MUST find the item to update from the data context provided above.`,
      `Match the item by title, name, or ID mentioned in the user's message.`,
      `Generate a response that:`,
      `1. Confirms which ${entityLabel} you identified and what changes will be made`,
      `2. Includes a fenced code block with language "action" containing:`,
      '```action',
      `{"type":"update_${actionIntent.entity}","id":"<item id>","data":${schema}}`,
      '```',
      `3. ONLY include the fields that need to change in the data object. Omit unchanged fields.`,
      `4. The "id" field is REQUIRED — get it from the data context above.`,
      `5. After the code block, tell the user to click the button to confirm the update.`,
      `IMPORTANT: The code block language MUST be "action" (not json, not javascript). This triggers the UI button.`,
      `If you cannot identify which ${entityLabel} to update, ask the user to clarify.`,
      `PERMISSION RULE: For tasks, only the creator (createdBy) or assignee (assignedTo) can update. Admins can update any task. If the task does not belong to the current user, warn them the action may be denied.`,
    ].join('\n')
  }

  if (actionIntent.action === 'delete') {
    return [
      `[ACTION REQUIRED]`,
      `The user wants to DELETE a ${entityLabel}.`,
      `You MUST find the item to delete from the data context provided above.`,
      `Match the item by title, name, or ID mentioned in the user's message.`,
      `Generate a response that:`,
      `1. Confirms which ${entityLabel} will be deleted and shows its details`,
      `2. Includes a fenced code block with language "action" containing:`,
      '```action',
      `{"type":"delete_${actionIntent.entity}","id":"<item id>"}`,
      '```',
      `3. The "id" field is REQUIRED — get it from the data context above.`,
      `4. After the code block, warn the user this action cannot be undone and tell them to click confirm.`,
      `IMPORTANT: The code block language MUST be "action" (not json, not javascript). This triggers the UI button.`,
      `If you cannot identify which ${entityLabel} to delete, ask the user to clarify.`,
      `PERMISSION RULE: For tasks, only the creator (createdBy) or assignee (assignedTo) can delete. Admins can delete any task. If the task does not belong to the current user, warn them the action may be denied.`,
    ].join('\n')
  }

  return ''
}

// ---------------------------------------------------------------------------
// Main Export
// ---------------------------------------------------------------------------

export async function injectDynamicContext(query: string, locale: string = 'en'): Promise<string> {
  const intents = detectIntent(query)
  const actionIntent = detectActionIntent(query)
  const contextParts: string[] = []

  try {
    // 1. Always inject app navigation context so the AI knows about the app structure
    const knowledge = await loadAppKnowledge()
    if (knowledge) {
      contextParts.push(buildAppNavigationContext(knowledge, locale))

      // If asking about navigation or "where to find", add quick answers
      if (intents.includes('navigation') || intents.length > 0) {
        const quickAnswers = buildCommonAnswersContext(knowledge, intents)
        if (quickAnswers) contextParts.push(quickAnswers)
      }

      // Add specific page context for matched intents
      const intentToUrl: Partial<Record<Intent, string>> = {
        dashboard: '/dashboard',
        todos: '/dashboard/todos',
        analytics: '/dashboard/analytics',
        projects: '/dashboard/projects',
        team: '/dashboard/team',
        users: '/dashboard/users',
        categories: '/dashboard/categories',
        transactions: '/dashboard/transactions',
        settings: '/dashboard/settings',
        help: '/dashboard/help',
      }

      for (const intent of intents) {
        const url = intentToUrl[intent]
        if (url) {
          const pageCtx = buildPageContext(knowledge, url, locale)
          if (pageCtx) contextParts.push(pageCtx)
        }
      }
    }

    // 2. Inject dynamic data from mock DB for data-related intents
    if (intents.length > 0) {
      const db = await loadMockDb()
      if (db) {
        const dataCtx = buildDataContext(db, intents)
        if (dataCtx) contextParts.push(dataCtx)
      }
    }

    // 3. Inject action instructions when user wants to perform a CRUD operation
    if (actionIntent) {
      const actionInstructions = buildActionInstructions(actionIntent, locale)
      if (actionInstructions) contextParts.push(actionInstructions)
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error injecting dynamic context:', error)
  }

  return contextParts.join('\n\n')
}

// Export for testing
export {
  detectIntent,
  detectActionIntent,
  loadAppKnowledge,
  loadMockDb,
  buildDataContext,
  buildAppNavigationContext,
  buildActionInstructions,
}
export type { Intent, ActionIntent, ActionType, ActionEntity, AppKnowledge, MockDb }
