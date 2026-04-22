import { type ColumnDef } from '@tanstack/react-table'
import { Calendar, Clock } from 'lucide-react'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import type { Todo } from '../model/types'
import { TodoActionsMenu, TodoAssignee, TodoPriorityBadge, TodoStatusBadge } from '../ui/components'
import type { UserInfo } from './useUserMap'

export function useTodoColumns(
  userMap: Map<string, UserInfo>,
  canModify: (todo: Todo) => boolean,
  onEdit: (todo: Todo) => void,
  onDelete: (todo: Todo) => void,
): ColumnDef<Todo>[] {
  const { t } = useTranslation()

  return React.useMemo<ColumnDef<Todo>[]>(
    () => [
      {
        accessorKey: 'title',
        header: t('todos.table.title'),
        cell: ({ row }) => {
          const { title, dueDate } = row.original
          return (
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-foreground leading-tight">{title}</span>
              {dueDate && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(dueDate).toLocaleDateString()}
                </span>
              )}
            </div>
          )
        },
      },
      {
        accessorKey: 'status',
        header: t('todos.table.status'),
        cell: ({ row }) => <TodoStatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'priority',
        header: t('todos.table.priority'),
        cell: ({ row }) => <TodoPriorityBadge priority={row.original.priority} />,
      },
      {
        accessorKey: 'assignedTo',
        header: t('todos.table.assignedTo'),
        cell: ({ row }) => (
          <TodoAssignee
            assignee={row.original.assignedTo ? userMap.get(row.original.assignedTo) : undefined}
          />
        ),
      },
      {
        accessorKey: 'createdAt',
        header: t('todos.table.createdAt'),
        cell: ({ row }) => (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-3.5 h-3.5 opacity-50" />
            <span className="text-xs font-medium">
              {row.original.createdAt ? new Date(row.original.createdAt).toLocaleDateString() : '—'}
            </span>
          </div>
        ),
      },
      {
        id: 'actions',
        cell: ({ row }) => (
          <TodoActionsMenu
            todo={row.original}
            canModify={canModify(row.original)}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ),
      },
    ],
    [t, userMap, canModify, onEdit, onDelete],
  )
}
