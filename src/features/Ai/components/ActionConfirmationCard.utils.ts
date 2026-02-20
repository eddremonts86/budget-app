import {
  CreditCard,
  ListTodo,
  Tag,
  UserPlus,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CreateTodoAction {
  type: 'create_todo'
  data: {
    title: string
    description: string
    status: 'pending' | 'in_progress' | 'completed'
    priority: 'low' | 'medium' | 'high'
    dueDate: string
    assignedTo?: string
    projectId?: string
  }
}

export interface UpdateTodoAction {
  type: 'update_todo'
  id: string
  data: Partial<CreateTodoAction['data']>
}

export interface DeleteTodoAction {
  type: 'delete_todo'
  id: string
}

export interface CreateUserAction {
  type: 'create_user'
  data: {
    name: string
    email: string
    role: 'admin' | 'user'
    avatar: string
    createdAt?: string
  }
}

export interface UpdateUserAction {
  type: 'update_user'
  id: string
  data: Partial<CreateUserAction['data']>
}

export interface DeleteUserAction {
  type: 'delete_user'
  id: string
}

export interface CreateTransactionAction {
  type: 'create_transaction'
  data: {
    customer: { name: string; email: string }
    status: 'Approved' | 'Pending' | 'Rejected'
    date: string
    amount: number
  }
}

export interface UpdateTransactionAction {
  type: 'update_transaction'
  id: string
  data: Partial<CreateTransactionAction['data']>
}

export interface DeleteTransactionAction {
  type: 'delete_transaction'
  id: string
}

export interface CreateCategoryAction {
  type: 'create_category'
  data: {
    name: string
    color: string
  }
}

export interface UpdateCategoryAction {
  type: 'update_category'
  id: string
  data: Partial<CreateCategoryAction['data']>
}

export interface DeleteCategoryAction {
  type: 'delete_category'
  id: string
}

export type ActionPayload =
  | CreateTodoAction
  | UpdateTodoAction
  | DeleteTodoAction
  | CreateUserAction
  | UpdateUserAction
  | DeleteUserAction
  | CreateTransactionAction
  | UpdateTransactionAction
  | DeleteTransactionAction
  | CreateCategoryAction
  | UpdateCategoryAction
  | DeleteCategoryAction

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export type ActionVerb = 'create' | 'update' | 'delete'

export function getActionVerb(type: string): ActionVerb {
  if (type.startsWith('update_')) return 'update'
  if (type.startsWith('delete_')) return 'delete'
  return 'create'
}

export function getEntityKey(type: string): string {
  return type.replace(/^(create_|update_|delete_)/, '')
}

export function parseActionPayload(json: string): ActionPayload | null {
  try {
    const parsed = JSON.parse(json)
    if (!parsed || typeof parsed.type !== 'string') return null

    const verb = getActionVerb(parsed.type)

    if (verb === 'create' && parsed.data) {
      return parsed as ActionPayload
    }
    if (verb === 'update' && parsed.id && parsed.data) {
      return parsed as ActionPayload
    }
    if (verb === 'delete' && parsed.id) {
      return parsed as ActionPayload
    }
    return null
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Human-readable labels
// ---------------------------------------------------------------------------

export const STATUS_LABELS: Record<string, Record<string, string>> = {
  en: { pending: 'Pending', in_progress: 'In Progress', completed: 'Completed' },
  es: { pending: 'Pendiente', in_progress: 'En Progreso', completed: 'Completado' },
}

export const PRIORITY_LABELS: Record<string, Record<string, string>> = {
  en: { low: 'Low', medium: 'Medium', high: 'High' },
  es: { low: 'Baja', medium: 'Media', high: 'Alta' },
}

export const FIELD_LABELS: Record<string, Record<string, string>> = {
  en: {
    title: 'Title',
    description: 'Description',
    status: 'Status',
    priority: 'Priority',
    dueDate: 'Due Date',
    assignedTo: 'Assigned To',
    name: 'Name',
    email: 'Email',
    role: 'Role',
    color: 'Color',
    amount: 'Amount',
    date: 'Date',
    customer: 'Customer',
  },
  es: {
    title: 'Título',
    description: 'Descripción',
    status: 'Estado',
    priority: 'Prioridad',
    dueDate: 'Fecha límite',
    assignedTo: 'Asignado a',
    name: 'Nombre',
    email: 'Correo',
    role: 'Rol',
    color: 'Color',
    amount: 'Monto',
    date: 'Fecha',
    customer: 'Cliente',
  },
}

export function humanizeValue(key: string, value: unknown, lang: string): string {
  const l = lang.startsWith('es') ? 'es' : 'en'
  if (key === 'status' && typeof value === 'string' && STATUS_LABELS[l][value]) {
    return STATUS_LABELS[l][value]
  }
  if (key === 'priority' && typeof value === 'string' && PRIORITY_LABELS[l][value]) {
    return PRIORITY_LABELS[l][value]
  }
  if (key === 'dueDate' && typeof value === 'string') {
    try {
      return new Date(value).toLocaleDateString(l === 'es' ? 'es-ES' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } catch {
      return String(value)
    }
  }
  if (key === 'amount' && typeof value === 'number') {
    return `$${value.toLocaleString()}`
  }
  if (key === 'customer' && typeof value === 'object' && value !== null) {
    return (value as { name: string }).name
  }
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

export function humanizeField(key: string, lang: string): string {
  const l = lang.startsWith('es') ? 'es' : 'en'
  return FIELD_LABELS[l][key] || key
}

// ---------------------------------------------------------------------------
// Visual Configuration
// ---------------------------------------------------------------------------

export const ENTITY_ICONS = {
  todo: ListTodo,
  user: UserPlus,
  transaction: CreditCard,
  category: Tag,
} as const

export interface EntityConfig {
  labels: Record<ActionVerb, { en: string; es: string }>
  color: string
  bgColor: string
  borderColor: string
}

export const ENTITY_CONFIGS: Record<string, EntityConfig> = {
  todo: {
    labels: {
      create: { en: 'Create Task', es: 'Crear Tarea' },
      update: { en: 'Update Task', es: 'Actualizar Tarea' },
      delete: { en: 'Delete Task', es: 'Eliminar Tarea' },
    },
    color: 'from-blue-500 to-indigo-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
  user: {
    labels: {
      create: { en: 'Create User', es: 'Crear Usuario' },
      update: { en: 'Update User', es: 'Actualizar Usuario' },
      delete: { en: 'Delete User', es: 'Eliminar Usuario' },
    },
    color: 'from-emerald-500 to-green-600',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
  },
  transaction: {
    labels: {
      create: { en: 'Create Transaction', es: 'Crear Transacción' },
      update: { en: 'Update Transaction', es: 'Actualizar Transacción' },
      delete: { en: 'Delete Transaction', es: 'Eliminar Transacción' },
    },
    color: 'from-amber-500 to-orange-600',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    borderColor: 'border-amber-200 dark:border-amber-800',
  },
  category: {
    labels: {
      create: { en: 'Create Category', es: 'Crear Categoría' },
      update: { en: 'Update Category', es: 'Actualizar Categoría' },
      delete: { en: 'Delete Category', es: 'Eliminar Categoría' },
    },
    color: 'from-purple-500 to-violet-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    borderColor: 'border-purple-200 dark:border-purple-800',
  },
} as const

export const DELETE_VISUAL = {
  color: 'from-red-500 to-rose-600',
  bgColor: 'bg-red-50 dark:bg-red-950/30',
  borderColor: 'border-red-200 dark:border-red-800',
}

export const UPDATE_VISUAL = {
  color: 'from-cyan-500 to-teal-600',
  bgColor: 'bg-cyan-50 dark:bg-cyan-950/30',
  borderColor: 'border-cyan-200 dark:border-cyan-800',
}

export function hashAction(json: string): string {
  let h = 0
  for (let i = 0; i < json.length; i++) {
    h = (Math.imul(31, h) + json.charCodeAt(i)) | 0
  }
  return String(h)
}
