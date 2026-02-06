import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import type { Todo } from '../src/features/ToDo/types/todo.types'
import { useTodoList } from '../src/features/ToDo/hooks/useTodoList'

// Mock the API hooks
vi.mock('../api', () => ({
  useDeleteTodo: vi.fn(() => ({
    mutate: vi.fn((_id: string, { onSettled }: { onSettled: () => void }) => {
      onSettled()
    }),
  })),
}))

const createMockTodo = (overrides: Partial<Todo>): Todo => ({
  id: '1',
  title: 'Mock Todo',
  description: 'Mock Description',
  status: 'pending',
  priority: 'medium',
  dueDate: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
})

describe('useTodoList', () => {
  const mockData = {
    pages: [
      {
        items: [
          createMockTodo({ id: '1', title: 'Todo 1' }),
          createMockTodo({ id: '2', title: 'Todo 2', status: 'completed' }),
        ],
      },
    ],
  }

  it('should process data into unique todos', () => {
    const { result } = renderHook(() => useTodoList(mockData))
    expect(result.current.todos).toHaveLength(2)
    expect(result.current.todos[0].id).toBe('1')
  })

  it('should handle duplicates in data', () => {
    const duplicateData = {
      pages: [
        {
          items: [
            createMockTodo({ id: '1', title: 'Todo 1' }),
            createMockTodo({ id: '1', title: 'Todo 1 Duplicate' }),
          ],
        },
      ],
    }
    const { result } = renderHook(() => useTodoList(duplicateData))
    expect(result.current.todos).toHaveLength(1)
    expect(result.current.todos[0].title).toBe('Todo 1')
  })

  it('should manage editing state', () => {
    const { result } = renderHook(() => useTodoList(mockData))

    act(() => {
      result.current.handleEdit('1')
    })
    expect(result.current.editingId).toBe('1')

    act(() => {
      result.current.handleCancelEdit()
    })
    expect(result.current.editingId).toBeNull()
  })

  it('should manage deleting state', () => {
    const { result } = renderHook(() => useTodoList(mockData))

    act(() => {
      result.current.handleDelete('1')
    })

    // DeletingId should be null after mutate finishes (mocked as immediate)
    expect(result.current.deletingId).toBeNull()
  })
})
