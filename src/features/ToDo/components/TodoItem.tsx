import { Calendar, Flag, Pencil, Trash2 } from 'lucide-react'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Todo } from '../types/todo.types'

interface TodoItemProps {
  todo: Todo
  onDelete: () => void
  onEdit?: () => void
  isDeleting?: boolean
}

const statusVariants = {
  pending: 'warning',
  in_progress: 'info',
  completed: 'success',
} as const

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
        'group relative border-b p-4 transition-all',
        'hover:bg-secondary/20',
        'animate-in fade-in duration-200',
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
            <Badge variant={statusVariants[todo.status]}>
              {t(`todo.status.${todo.status}`)}
            </Badge>
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
            <Button
              variant="ghost"
              size="icon"
              onClick={onEdit}
              className="h-8 w-8"
              aria-label={t('common.edit')}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            disabled={isDeleting}
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            aria-label={t('common.delete')}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
})
