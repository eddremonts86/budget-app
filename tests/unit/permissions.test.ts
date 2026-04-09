import { describe, it, expect } from 'vitest'
import { canModifyTodo } from '@/modules/tasks'

describe('canModifyTodo', () => {
  const baseTodo = { createdBy: 'user_1', assignedTo: 'user_2' }

  // Admin access
  it('should allow admin to modify any todo', () => {
    expect(canModifyTodo(baseTodo, 'user_99', 'admin')).toBe(true)
  })

  it('should allow admin even if they are not creator or assignee', () => {
    expect(canModifyTodo({ createdBy: 'a', assignedTo: 'b' }, 'admin_user', 'admin')).toBe(true)
  })

  // Creator access
  it('should allow creator to modify their own todo', () => {
    expect(canModifyTodo(baseTodo, 'user_1', 'user')).toBe(true)
  })

  // Assignee access
  it('should allow assignee to modify assigned todo', () => {
    expect(canModifyTodo(baseTodo, 'user_2', 'user')).toBe(true)
  })

  // Denied access
  it('should deny unrelated user from modifying', () => {
    expect(canModifyTodo(baseTodo, 'user_3', 'user')).toBe(false)
  })

  it('should deny when currentUserId is null', () => {
    expect(canModifyTodo(baseTodo, null, 'user')).toBe(false)
  })

  it('should deny when currentUserId is null even for admin role', () => {
    expect(canModifyTodo(baseTodo, null, 'admin')).toBe(false)
  })

  // Edge cases
  it('should default role to user when not specified', () => {
    expect(canModifyTodo(baseTodo, 'user_1')).toBe(true)
    expect(canModifyTodo(baseTodo, 'user_3')).toBe(false)
  })

  it('should handle todo where creator and assignee are the same', () => {
    const selfTodo = { createdBy: 'user_1', assignedTo: 'user_1' }
    expect(canModifyTodo(selfTodo, 'user_1', 'user')).toBe(true)
    expect(canModifyTodo(selfTodo, 'user_2', 'user')).toBe(false)
  })

  it('should handle empty string userId', () => {
    expect(canModifyTodo(baseTodo, '', 'user')).toBe(false)
  })
})
