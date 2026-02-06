import { Calendar, Flag, Pencil, Trash2 } from 'lucide-react'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib/utils'
import type { Todo } from '../model'

interface TodoItemProps {
  todo: Todo
  onDelete: () => void
  onEdit?: () => void
  isDeleting?: boolean
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
}

const priorityColors = {
  low: 'text-gray-500',
  medium: 'text-yellow-500',
  high: 'text-red-500',
}

export const TodoItem = memo(function TodoItem({
  todo,
  onDelete,
  onEdit,
  isDeleting,
}: TodoItemProps) {
  const { t } = useTranslation()

  return (
    <div
      className={cn(
        'group relative rounded-lg border p-4 transition-all',
        'hover:shadow-md hover:border-primary/50',
        'animate-in fade-in slide-in-from-bottom-2 duration-300',
        todo.status === 'completed' && 'opacity-60',
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3
              className={cn('font-medium truncate', todo.status === 'completed' && 'line-through')}
            >
              {todo.title}
            </h3>
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                statusColors[todo.status],
              )}
            >
              {t(`todo.status.${todo.status}`)}
            </span>
          </div>

          {todo.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{todo.description}</p>
          )}

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(todo.dueDate).toLocaleDateString()}
            </span>
            <span className={cn('flex items-center gap-1', priorityColors[todo.priority])}>
              <Flag className="h-3 w-3" />
              {t(`todo.priority.${todo.priority}`)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="p-2 rounded-md hover:bg-secondary transition-colors"
              aria-label={t('common.edit')}
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onDelete}
            disabled={isDeleting}
            className="p-2 rounded-md hover:bg-destructive/10 text-destructive transition-colors disabled:opacity-50"
            aria-label={t('common.delete')}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
})
