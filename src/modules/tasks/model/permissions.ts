import type { Todo } from './types'

/**
 * Determines if a user can modify (edit/delete) a given todo.
 *
 * Rules:
 * - Admin users can modify any todo
 * - Regular users can modify todos they created (createdBy) OR are assigned to (assignedTo)
 */
export function canModifyTodo(
  todo: Pick<Todo, 'createdBy' | 'assignedTo'>,
  currentUserId: string | null,
  currentUserRole: 'admin' | 'user' = 'user',
): boolean {
  if (!currentUserId) return false
  if (currentUserRole === 'admin') return true
  return todo.createdBy === currentUserId || todo.assignedTo === currentUserId
}
