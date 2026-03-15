'use client'

import { ListTodo } from 'lucide-react'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  createCategoryFn,
  deleteCategoryFn,
  updateCategoryFn,
  type CategoryInput,
} from '@/modules/categories/api/categories.fn'
import {
  createTodoFn,
  deleteTodoFn,
  getTodoByIdFn,
  updateTodoFn,
  type CreateTodoInput,
  type UpdateTodoInput,
} from '@/modules/tasks'
import { canModifyTodo } from '@/modules/tasks'
import {
  createTransactionFn,
  deleteTransactionFn,
  updateTransactionFn,
  type TransactionInput,
} from '@/modules/transactions'
import {
  createUserFn,
  deleteUserFn,
  updateUserFn,
  type UserInput,
} from '@/modules/users'
import { useCurrentUser } from '@/modules/users'
import { toast } from '@/shared/lib/toast'
import { cn } from '@/shared/utils/index'
import { ActionCardContent } from './action-card/ActionCardContent'
import { ActionCardFooter } from './action-card/ActionCardFooter'
import { ActionCardHeader } from './action-card/ActionCardHeader'
import {
  DELETE_VISUAL,
  ENTITY_CONFIGS,
  ENTITY_ICONS,
  UPDATE_VISUAL,
  getActionVerb,
  getEntityKey,
  hashAction,
  humanizeField,
  humanizeValue,
  parseActionPayload,
  type CreateTodoAction,
} from './ActionConfirmationCard.utils'
import { useActionStates } from './useActionStates'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ActionConfirmationCardProps {
  actionJson: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ActionConfirmationCard({ actionJson }: ActionConfirmationCardProps) {
  const { i18n } = useTranslation()
  const { syncedUserId, userRole } = useCurrentUser()
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
        const todo = await getTodoByIdFn({ data: (payload as { id: string }).id })
        if (todo && !canModifyTodo(todo, syncedUserId, userRole)) {
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
        // Continue if todo not found (might be already deleted) or other error
      }
    }

    setStatus('loading')
    try {
      const actionResult = await performAction()
      if (actionResult.success) {
        setStatus('success')
        setResultMessage(
          actionResult.message || (isSpanish ? 'Acción completada' : 'Action completed'),
        )
        saveActionState(actionKey, {
          status: 'success',
          message: actionResult.message || (isSpanish ? 'Acción completada' : 'Action completed'),
        })
        toast.success(isSpanish ? 'Éxito' : 'Success', {
          description:
            actionResult.message || (isSpanish ? 'Acción completada' : 'Action completed'),
        })
      } else {
        setStatus('error')
        setResultMessage(
          actionResult.message || (isSpanish ? 'Error al ejecutar' : 'Error executing action'),
        )
        saveActionState(actionKey, {
          status: 'error',
          message:
            actionResult.message || (isSpanish ? 'Error al ejecutar' : 'Error executing action'),
        })
        toast.error('Error', {
          description:
            actionResult.message || (isSpanish ? 'Error al ejecutar' : 'Error executing action'),
        })
      }
    } catch {
      setStatus('error')
      setResultMessage(isSpanish ? 'Error inesperado' : 'Unexpected error')
      saveActionState(actionKey, {
        status: 'error',
        message: isSpanish ? 'Error inesperado' : 'Unexpected error',
      })
      toast.error('Error', {
        description: isSpanish ? 'Error inesperado' : 'Unexpected error',
      })
    }
  }

  const performAction = async (): Promise<{ success: boolean; message?: string }> => {
    // CREATE
    if (verb === 'create' && 'data' in payload) {
      const { data } = payload as { data: unknown }
      switch (entity) {
        case 'todo': {
          const todoPayload = data as CreateTodoAction['data']
          const todoData = {
            ...todoPayload,
            createdBy: syncedUserId || 'system',
            projectId: todoPayload.projectId || '',
          } as CreateTodoInput

          const newTodo = await createTodoFn({
            data: todoData,
          })
          return { success: true, message: `Task created: ${newTodo.title}` }
        }
        case 'user': {
          const userData = data as UserInput
          const newUser = await createUserFn({ data: userData })
          return { success: true, message: `User created: ${newUser.name}` }
        }
        case 'transaction': {
          const txData = data as TransactionInput
          const newTx = await createTransactionFn({ data: txData })
          return { success: true, message: `Transaction created for ${newTx.customer.name}` }
        }
        case 'category': {
          const catData = data as CategoryInput
          const newCat = await createCategoryFn({ data: catData })
          return { success: true, message: `Category created: ${newCat.name}` }
        }
      }
    }

    // UPDATE
    if (verb === 'update' && 'id' in payload && 'data' in payload) {
      const { id, data } = payload as { id: string; data: unknown }
      switch (entity) {
        case 'todo': {
          await updateTodoFn({ data: { id, data: data as UpdateTodoInput } })
          return { success: true, message: `Task updated (ID: ${id})` }
        }
        case 'user': {
          await updateUserFn({ data: { id, data: data as Partial<UserInput> } })
          return { success: true, message: `User updated (ID: ${id})` }
        }
        case 'transaction': {
          await updateTransactionFn({ data: { id, data: data as Partial<TransactionInput> } })
          return { success: true, message: `Transaction updated (ID: ${id})` }
        }
        case 'category': {
          await updateCategoryFn({ data: { id, data: data as Partial<CategoryInput> } })
          return { success: true, message: `Category updated (ID: ${id})` }
        }
      }
    }

    // DELETE
    if (verb === 'delete' && 'id' in payload) {
      const { id } = payload as { id: string }
      switch (entity) {
        case 'todo': {
          await deleteTodoFn({ data: id })
          return { success: true, message: `Task deleted (ID: ${id})` }
        }
        case 'user': {
          await deleteUserFn({ data: id })
          return { success: true, message: `User deleted (ID: ${id})` }
        }
        case 'transaction': {
          await deleteTransactionFn({ data: id })
          return { success: true, message: `Transaction deleted (ID: ${id})` }
        }
        case 'category': {
          await deleteCategoryFn({ data: id })
          return { success: true, message: `Category deleted (ID: ${id})` }
        }
      }
    }

    return { success: false, message: 'Unknown action type' }
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
      <ActionCardHeader
        verb={verb}
        label={label}
        visualConfig={visualConfig}
        EntityIcon={EntityIcon}
      />

      {/* Content */}
      <ActionCardContent
        dataEntries={dataEntries}
        visualConfig={visualConfig}
        warningText={warningText}
        status={status}
      />

      {/* Footer */}
      <ActionCardFooter
        status={status}
        verb={verb}
        visualConfig={visualConfig}
        onConfirm={handleConfirm}
        onCancel={() => setStatus('denied')}
        resultMessage={resultMessage}
        confirmText={confirmText}
        cancelText={isSpanish ? 'Cancelar' : 'Cancel'}
        isSpanish={isSpanish}
      />
    </div>
  )
}
