import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useCurrentUser } from '@/modules/users'
import { toast } from '@/shared/lib/toast'
import { useDeleteTodo } from '../api/todos.queries'
import { canModifyTodo } from '../model/permissions'
import type { Todo } from '../model/types'

/**
 * Encapsulates the common todo action logic:
 * - Current user identity + role
 * - `canModify` check per todo
 * - Permission-gated edit & toast-confirmed delete
 */
export function useTodoActions(onEdit: (todo: Todo) => void) {
  const { t } = useTranslation()
  const { syncedUserId, userRole } = useCurrentUser()
  const { mutate: deleteTodo } = useDeleteTodo()

  const canModify = React.useCallback(
    (todo: Todo) => canModifyTodo(todo, syncedUserId, userRole),
    [syncedUserId, userRole],
  )

  const handleEdit = React.useCallback(
    (todo: Todo) => {
      if (!canModify(todo)) {
        toast.warning(t('common.noPermission'), {
          description: t('common.noPermissionEdit'),
        })
        return
      }
      onEdit(todo)
    },
    [canModify, onEdit, t],
  )

  const handleDelete = React.useCallback(
    (todo: Todo) => {
      if (!canModify(todo)) {
        toast.warning(t('common.noPermission'), {
          description: t('common.noPermissionDelete'),
        })
        return
      }
      toast.error(t('todos.confirm.delete'), {
        description: t('common.undoWarning'),
        action: {
          label: t('common.delete'),
          onClick: () => deleteTodo(todo.id),
        },
        duration: 10000,
      })
    },
    [canModify, deleteTodo, t],
  )

  return { canModify, handleEdit, handleDelete, syncedUserId, userRole }
}
