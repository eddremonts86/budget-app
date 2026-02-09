import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import type { Todo } from '../types/todo.types'
import { TodoItem } from './TodoItem'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

describe('TodoItem', () => {
  const baseTodo: Todo = {
    id: 'todo-1',
    title: 'Primera tarea',
    description: 'Descripción',
    status: 'pending',
    priority: 'medium',
    dueDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  it('renders todo content', () => {
    render(<TodoItem todo={baseTodo} onDelete={vi.fn()} />)
    expect(screen.getByText('Primera tarea')).toBeTruthy()
    expect(screen.getByText('Descripción')).toBeTruthy()
    expect(screen.getByText('todo.status.pending')).toBeTruthy()
  })

  it('calls handlers', () => {
    const onDelete = vi.fn()
    const onEdit = vi.fn()

    render(<TodoItem todo={baseTodo} onDelete={onDelete} onEdit={onEdit} />)

    fireEvent.click(screen.getByLabelText('common.edit'))
    fireEvent.click(screen.getByLabelText('common.delete'))

    expect(onEdit).toHaveBeenCalledTimes(1)
    expect(onDelete).toHaveBeenCalledTimes(1)
  })
})
