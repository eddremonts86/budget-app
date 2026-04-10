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
