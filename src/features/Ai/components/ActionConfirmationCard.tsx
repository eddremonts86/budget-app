'use client'

import {
  AlertTriangle,
  Check,
  CreditCard,
  ListTodo,
  Loader2,
  Lock,
  Pencil,
  Tag,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui'
import { categoriesApi } from '@/features/Categories/api/categories.api'
import { todosApi } from '@/features/Todos/api/todos.api'
import { canModifyTodo } from '@/features/Todos/model/permissions'
import { transactionsApi } from '@/features/Transactions/api/transactions.api'
import { usersApi } from '@/features/Users/api/users.api'
import { useSyncAuthUser } from '@/features/Users/hooks/useSyncAuthUser'
import { toast } from '@/shared/lib/toast'
import { cn } from '@/shared/utils/index'
import { useActionStates } from './useActionStates'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CreateTodoAction {
  type: 'create_todo'
  data: {
    title: string
    description: string
    status: 'pending' | 'in_progress' | 'completed'
    priority: 'low' | 'medium' | 'high'
    dueDate: string
    assignedTo?: string
  }
}

interface UpdateTodoAction {
  type: 'update_todo'
  id: string
  data: Partial<CreateTodoAction['data']>
}

interface DeleteTodoAction {
  type: 'delete_todo'
  id: string
}

interface CreateUserAction {
  type: 'create_user'
  data: {
    name: string
    email: string
    role: 'admin' | 'user'
    avatar: string
    createdAt?: string
  }
}

interface UpdateUserAction {
  type: 'update_user'
  id: string
  data: Partial<CreateUserAction['data']>
}

interface DeleteUserAction {
  type: 'delete_user'
  id: string
}

interface CreateTransactionAction {
  type: 'create_transaction'
  data: {
    customer: { name: string; email: string }
    status: 'Approved' | 'Pending' | 'Rejected'
    date: string
    amount: number
  }
}

interface UpdateTransactionAction {
  type: 'update_transaction'
  id: string
  data: Partial<CreateTransactionAction['data']>
}

interface DeleteTransactionAction {
  type: 'delete_transaction'
  id: string
}

interface CreateCategoryAction {
  type: 'create_category'
  data: {
    name: string
    color: string
  }
}

interface UpdateCategoryAction {
  type: 'update_category'
  id: string
  data: Partial<CreateCategoryAction['data']>
}

interface DeleteCategoryAction {
  type: 'delete_category'
  id: string
}

type ActionPayload =
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
// Props
// ---------------------------------------------------------------------------

interface ActionConfirmationCardProps {
  actionJson: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type ActionVerb = 'create' | 'update' | 'delete'

function getActionVerb(type: string): ActionVerb {
  if (type.startsWith('update_')) return 'update'
  if (type.startsWith('delete_')) return 'delete'
  return 'create'
}

function getEntityKey(type: string): string {
  return type.replace(/^(create_|update_|delete_)/, '')
}

function parseActionPayload(json: string): ActionPayload | null {
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

const STATUS_LABELS: Record<string, Record<string, string>> = {
  en: { pending: 'Pending', in_progress: 'In Progress', completed: 'Completed' },
  es: { pending: 'Pendiente', in_progress: 'En Progreso', completed: 'Completado' },
}

const PRIORITY_LABELS: Record<string, Record<string, string>> = {
  en: { low: 'Low', medium: 'Medium', high: 'High' },
  es: { low: 'Baja', medium: 'Media', high: 'Alta' },
}

const FIELD_LABELS: Record<string, Record<string, string>> = {
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

function humanizeValue(key: string, value: unknown, lang: string): string {
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

function humanizeField(key: string, lang: string): string {
  const l = lang.startsWith('es') ? 'es' : 'en'
  return FIELD_LABELS[l][key] || key
}

// ---------------------------------------------------------------------------
// Visual Configuration
// ---------------------------------------------------------------------------

const ENTITY_ICONS = {
  todo: ListTodo,
  user: UserPlus,
  transaction: CreditCard,
  category: Tag,
} as const

interface EntityConfig {
  labels: Record<ActionVerb, { en: string; es: string }>
  color: string
  bgColor: string
  borderColor: string
}

const ENTITY_CONFIGS: Record<string, EntityConfig> = {
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

const DELETE_VISUAL = {
  color: 'from-red-500 to-rose-600',
  bgColor: 'bg-red-50 dark:bg-red-950/30',
  borderColor: 'border-red-200 dark:border-red-800',
}

const UPDATE_VISUAL = {
  color: 'from-cyan-500 to-teal-600',
  bgColor: 'bg-cyan-50 dark:bg-cyan-950/30',
  borderColor: 'border-cyan-200 dark:border-cyan-800',
}

// ---------------------------------------------------------------------------
// Executor
// ---------------------------------------------------------------------------

async function executeAction(
  payload: ActionPayload,
): Promise<{ success: boolean; message: string }> {
  const verb = getActionVerb(payload.type)
  const entity = getEntityKey(payload.type)

  // CREATE
  if (verb === 'create' && 'data' in payload) {
    switch (entity) {
      case 'todo': {
        const result = await todosApi.create(
          (payload as CreateTodoAction).data as Parameters<typeof todosApi.create>[0],
        )
        return { success: true, message: `Task "${result.title}" created with ID ${result.id}` }
      }
      case 'user': {
        const userData = (payload as CreateUserAction).data
        const result = await usersApi.create({
          ...userData,
          createdAt: userData.createdAt || new Date().toISOString(),
        })
        return { success: true, message: `User "${result.name}" created with ID ${result.id}` }
      }
      case 'transaction': {
        const result = await transactionsApi.create({
          ...(payload as CreateTransactionAction).data,
          projectId: 'default',
          userId: 'default',
        })
        return {
          success: true,
          message: `Transaction for "${result.customer.name}" created with ID ${result.id}`,
        }
      }
      case 'category': {
        const result = await categoriesApi.create((payload as CreateCategoryAction).data)
        return { success: true, message: `Category "${result.name}" created with ID ${result.id}` }
      }
    }
  }

  // UPDATE
  if (verb === 'update' && 'id' in payload && 'data' in payload) {
    const { id } = payload as { id: string; data: Record<string, unknown> }
    switch (entity) {
      case 'todo': {
        const result = await todosApi.update(id, (payload as UpdateTodoAction).data)
        return { success: true, message: `Task "${result.title}" updated (ID: ${result.id})` }
      }
      case 'user': {
        const result = await usersApi.update(id, (payload as UpdateUserAction).data)
        return { success: true, message: `User "${result.name}" updated (ID: ${result.id})` }
      }
      case 'transaction': {
        const result = await transactionsApi.update(id, (payload as UpdateTransactionAction).data)
        return { success: true, message: `Transaction updated (ID: ${result.id})` }
      }
      case 'category': {
        const result = await categoriesApi.update(id, (payload as UpdateCategoryAction).data)
        return { success: true, message: `Category "${result.name}" updated (ID: ${result.id})` }
      }
    }
  }

  // DELETE
  if (verb === 'delete' && 'id' in payload) {
    const { id } = payload as { id: string }
    switch (entity) {
      case 'todo': {
        await todosApi.delete(id)
        return { success: true, message: `Task deleted (ID: ${id})` }
      }
      case 'user': {
        await usersApi.delete(id)
        return { success: true, message: `User deleted (ID: ${id})` }
      }
      case 'transaction': {
        await transactionsApi.delete(id)
        return { success: true, message: `Transaction deleted (ID: ${id})` }
      }
      case 'category': {
        await categoriesApi.delete(id)
        return { success: true, message: `Category deleted (ID: ${id})` }
      }
    }
  }

  return { success: false, message: 'Unknown action type' }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Action key hashing
// ---------------------------------------------------------------------------

function hashAction(json: string): string {
  let h = 0
  for (let i = 0; i < json.length; i++) {
    h = (Math.imul(31, h) + json.charCodeAt(i)) | 0
  }
  return String(h)
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ActionConfirmationCard({ actionJson }: ActionConfirmationCardProps) {
  const { i18n } = useTranslation()
  const { syncedUserId, userRole } = useSyncAuthUser()
  const { states: actionStates, saveState: saveActionState } = useActionStates()

  const actionKey = React.useMemo(() => hashAction(actionJson), [actionJson])
  const persisted = actionStates[actionKey] ?? null

  const [status, setStatus] = React.useState<'idle' | 'loading' | 'success' | 'error' | 'denied'>(
    persisted?.status ?? 'idle',
  )
  const [resultMessage, setResultMessage] = React.useState(persisted?.message ?? '')

  const payload = React.useMemo(() => parseActionPayload(actionJson), [actionJson])

  if (!payload) return null

  const verb = getActionVerb(payload.type)
  const entity = getEntityKey(payload.type)
  const entityConfig = ENTITY_CONFIGS[entity]
  if (!entityConfig) return null

  const isSpanish = i18n.language?.startsWith('es')
  const label = isSpanish ? entityConfig.labels[verb].es : entityConfig.labels[verb].en

  // Use verb-specific colors for update/delete
  const visualConfig =
    verb === 'delete'
      ? DELETE_VISUAL
      : verb === 'update'
        ? UPDATE_VISUAL
        : {
            color: entityConfig.color,
            bgColor: entityConfig.bgColor,
            borderColor: entityConfig.borderColor,
          }

  const EntityIcon = ENTITY_ICONS[entity as keyof typeof ENTITY_ICONS] || ListTodo

  const handleConfirm = async () => {
    // Permission check for todo update/delete
    if (entity === 'todo' && (verb === 'update' || verb === 'delete') && 'id' in payload) {
      try {
        const todo = await todosApi.getById((payload as { id: string }).id)
        if (!canModifyTodo(todo, syncedUserId, userRole)) {
          const deniedMsg = isSpanish
            ? 'No tienes permiso. Solo puedes modificar tareas que creaste o que te fueron asignadas.'
            : 'Permission denied. You can only modify tasks you created or are assigned to.'
          setStatus('denied')
          setResultMessage(deniedMsg)
          saveActionState(actionKey, { status: 'denied', message: deniedMsg })
          toast.warning(isSpanish ? 'Sin permisos' : 'Permission denied', {
            description: isSpanish
              ? 'Solo puedes modificar tareas que creaste o te fueron asignadas.'
              : 'You can only modify tasks you created or are assigned to.',
          })
          return
        }
      } catch {
        // If we can't fetch the todo, proceed — the API will handle errors
      }
    }

    setStatus('loading')
    try {
      const result = await executeAction(payload)
      if (result.success) {
        setStatus('success')
        setResultMessage(result.message)
        saveActionState(actionKey, { status: 'success', message: result.message })
        toast.success(isSpanish ? '¡Acción completada!' : 'Action completed!', {
          description: result.message,
        })
      } else {
        setStatus('error')
        setResultMessage(result.message)
        saveActionState(actionKey, { status: 'error', message: result.message })
        toast.error(isSpanish ? 'Error al ejecutar' : 'Execution error', {
          description: result.message,
        })
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      setStatus('error')
      setResultMessage(errorMsg)
      saveActionState(actionKey, { status: 'error', message: errorMsg })
      toast.error(isSpanish ? 'Error al ejecutar' : 'Execution error', {
        description: errorMsg,
      })
    }
  }

  // Build data entries for preview (human-readable)
  const lang = i18n.language || 'en'
  const dataEntries: [string, string][] = []
  if ('data' in payload) {
    const data = (payload as { data: Record<string, unknown> }).data
    for (const [key, value] of Object.entries(data)) {
      if (key === 'avatar' || key === 'createdAt' || key === 'assignedTo' || key === 'createdBy')
        continue
      dataEntries.push([humanizeField(key, lang), humanizeValue(key, value, lang)])
    }
  }

  // Confirm button text
  const confirmText =
    verb === 'delete'
      ? isSpanish
        ? 'Eliminar'
        : 'Delete'
      : verb === 'update'
        ? isSpanish
          ? 'Actualizar'
          : 'Update'
        : isSpanish
          ? 'Confirmar'
          : 'Confirm'

  // Warning text for delete
  const warningText =
    verb === 'delete'
      ? isSpanish
        ? '⚠️ Esta acción no se puede deshacer'
        : '⚠️ This action cannot be undone'
      : null

  return (
    <div
      className={cn(
        'my-3 rounded-xl border-2 overflow-hidden transition-all duration-300',
        visualConfig.borderColor,
        status === 'success' && 'border-green-300 dark:border-green-700',
        status === 'error' && 'border-red-300 dark:border-red-700',
      )}
    >
      {/* Header */}
      <div
        className={cn(
          'flex items-center gap-2 px-4 py-2.5 text-white bg-gradient-to-r',
          visualConfig.color,
        )}
      >
        {verb === 'delete' ? (
          <Trash2 size={16} />
        ) : verb === 'update' ? (
          <Pencil size={16} />
        ) : (
          <EntityIcon size={16} />
        )}
        <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
      </div>

      {/* Data Preview */}
      {dataEntries.length > 0 && (
        <div className={cn('px-4 py-3 space-y-1.5', visualConfig.bgColor)}>
          {dataEntries.map(([key, value]) => (
            <div key={key} className="flex items-start gap-2 text-xs">
              <span className="font-semibold text-muted-foreground min-w-[90px] capitalize">
                {key}:
              </span>
              <span className="text-foreground">{value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Warning for delete */}
      {warningText && status === 'idle' && (
        <div className="px-4 py-2 bg-red-50 dark:bg-red-950/20 border-t border-red-200/30 flex items-center gap-2">
          <AlertTriangle size={14} className="text-red-500" />
          <span className="text-[11px] text-red-600 dark:text-red-400 font-medium">
            {warningText}
          </span>
        </div>
      )}

      {/* Action Footer */}
      <div className="px-4 py-2.5 border-t border-border/30 flex items-center gap-2 bg-background/50">
        {status === 'idle' && (
          <>
            <Button
              size="sm"
              onClick={handleConfirm}
              className={cn(
                'gap-1.5 text-xs font-semibold bg-gradient-to-r text-white',
                visualConfig.color,
              )}
            >
              {verb === 'delete' ? <Trash2 size={14} /> : <Check size={14} />}
              {confirmText}
            </Button>
            <span className="text-[10px] text-muted-foreground">
              {isSpanish ? 'Haz clic para ejecutar esta acción' : 'Click to execute this action'}
            </span>
          </>
        )}

        {status === 'loading' && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 size={14} className="animate-spin" />
            {isSpanish ? 'Ejecutando...' : 'Executing...'}
          </div>
        )}

        {status === 'success' && (
          <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
            <Check size={14} />
            <span className="font-medium">{resultMessage}</span>
          </div>
        )}

        {status === 'error' && (
          <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
            <X size={14} />
            <span className="font-medium">{resultMessage}</span>
          </div>
        )}

        {status === 'denied' && (
          <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
            <Lock size={14} />
            <span className="font-medium">{resultMessage}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export type { ActionPayload }
