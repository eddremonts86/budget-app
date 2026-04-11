import type { TFunction } from 'i18next'
import type { TodoStatus } from '../api/todos.queries'

export const ALL_STATUSES: { value: TodoStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'testing', label: 'Testing' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

export const STATUS_DOT_COLORS: Record<TodoStatus, string> = {
  pending: 'bg-amber-400',
  in_progress: 'bg-blue-400',
  testing: 'bg-violet-400',
  on_hold: 'bg-yellow-400',
  blocked: 'bg-red-400',
  completed: 'bg-emerald-400',
  cancelled: 'bg-slate-400',
}

/** Badge variant classes keyed by status */
export const STATUS_BADGE_VARIANTS: Record<string, string> = {
  completed: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  in_progress: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  pending: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  on_hold: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  testing: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  blocked: 'bg-destructive/10 text-destructive border-destructive/20',
  cancelled: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20',
}

/** Badge variant classes keyed by priority */
export const PRIORITY_BADGE_VARIANTS: Record<string, string> = {
  high: 'bg-destructive/10 text-destructive border-destructive/20',
  medium: 'bg-primary/10 text-primary border-primary/20',
  low: 'bg-secondary text-secondary-foreground border-transparent',
}

/** Translated status labels */
export function getStatusLabels(t: TFunction): Record<string, string> {
  return {
    completed: t('todos.status.completed'),
    in_progress: t('todos.status.inProgress'),
    pending: t('todos.status.pending'),
    on_hold: t('todos.status.onHold', 'On Hold'),
    testing: t('todos.status.testing', 'Testing'),
    blocked: t('todos.status.blocked', 'Blocked'),
    cancelled: t('todos.status.cancelled', 'Cancelled'),
  }
}

/** Translated priority labels */
export function getPriorityLabels(t: TFunction): Record<string, string> {
  return {
    high: t('todos.priority.high'),
    medium: t('todos.priority.medium'),
    low: t('todos.priority.low'),
  }
}
