import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/shared/lib/utils'
import type { Todo } from '../../model/types'

interface TodoActionsMenuProps {
  todo: Todo
  canModify: boolean
  onEdit: (todo: Todo) => void
  onDelete: (todo: Todo) => void
  /** Alignment for the dropdown. Default "end". */
  align?: 'start' | 'center' | 'end'
  /** If true, uses a smaller trigger button (for kanban cards). */
  compact?: boolean
}

export function TodoActionsMenu({
  todo,
  canModify,
  onEdit,
  onDelete,
  align = 'end',
  compact = false,
}: TodoActionsMenuProps) {
  const { t } = useTranslation()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            'p-0 rounded-full',
            compact
              ? 'h-6 w-6 text-muted-foreground hover:text-foreground'
              : 'h-9 w-9 hover:bg-secondary/80',
          )}
        >
          <span className="sr-only">{t('common.openMenu')}</span>
          <MoreHorizontal className={compact ? 'h-3 w-3' : 'h-4 w-4'} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        className="w-48 p-2 rounded-2xl shadow-2xl backdrop-blur-xl border-border/40"
      >
        <DropdownMenuLabel className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
          {t('common.actions')}
        </DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => onEdit(todo)}
          className={cn(
            'rounded-lg m-1 gap-2 cursor-pointer focus:bg-primary/5 focus:text-primary',
            !canModify && 'opacity-50',
          )}
        >
          <Pencil className="h-4 w-4" />
          {t('todos.actions.edit')}
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-border/40" />
        <DropdownMenuItem
          className={cn(
            'text-destructive rounded-lg m-1 gap-2 cursor-pointer focus:bg-destructive/5 focus:text-destructive',
            !canModify && 'opacity-50',
          )}
          onClick={() => onDelete(todo)}
        >
          <Trash2 className="h-4 w-4" />
          {t('todos.actions.delete')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
