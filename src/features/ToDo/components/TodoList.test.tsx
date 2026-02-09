import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TodoList } from './TodoList'
import type { Todo } from '../types/todo.types'

const useTodosInfiniteMock = vi.hoisted(() => vi.fn())
const useTodoListMock = vi.hoisted(() => vi.fn())
const useTodoVirtualizerMock = vi.hoisted(() => vi.fn())

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('../api', () => ({
  useTodosInfinite: (...args: unknown[]) => useTodosInfiniteMock(...args),
}))

vi.mock('../hooks/useTodoList', () => ({
  useTodoList: (...args: unknown[]) => useTodoListMock(...args),
}))

vi.mock('../hooks/useTodoVirtualizer', () => ({
  useTodoVirtualizer: (...args: unknown[]) => useTodoVirtualizerMock(...args),
}))

describe('TodoList', () => {
  const baseTodo: Todo = {
    id: 'todo-1',
    title: 'Tarea 1',
    description: 'Descripción',
    status: 'pending',
    priority: 'medium',
    dueDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  beforeEach(() => {
    useTodosInfiniteMock.mockReset()
    useTodoListMock.mockReset()
    useTodoVirtualizerMock.mockReset()
  })

  it('renders loading state', () => {
    useTodosInfiniteMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    })

    useTodoListMock.mockReturnValue({
      todos: [],
      editingId: null,
      deletingId: null,
      handleEdit: vi.fn(),
      handleCancelEdit: vi.fn(),
      handleDelete: vi.fn(),
    })

    useTodoVirtualizerMock.mockReturnValue({
      parentRef: { current: null },
      rowVirtualizer: { getTotalSize: () => 0, measureElement: vi.fn() },
      virtualItems: [],
    })

    const { container } = render(<TodoList />)
    expect(container.querySelector('.animate-spin')).toBeTruthy()
  })

  it('renders error state', () => {
    useTodosInfiniteMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('fail'),
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    })

    useTodoListMock.mockReturnValue({
      todos: [],
      editingId: null,
      deletingId: null,
      handleEdit: vi.fn(),
      handleCancelEdit: vi.fn(),
      handleDelete: vi.fn(),
    })

    useTodoVirtualizerMock.mockReturnValue({
      parentRef: { current: null },
      rowVirtualizer: { getTotalSize: () => 0, measureElement: vi.fn() },
      virtualItems: [],
    })

    render(<TodoList />)
    expect(screen.getByText('errors:api.serverError')).toBeTruthy()
  })

  it('renders empty state', () => {
    useTodosInfiniteMock.mockReturnValue({
      data: { pages: [] },
      isLoading: false,
      error: null,
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    })

    useTodoListMock.mockReturnValue({
      todos: [],
      editingId: null,
      deletingId: null,
      handleEdit: vi.fn(),
      handleCancelEdit: vi.fn(),
      handleDelete: vi.fn(),
    })

    useTodoVirtualizerMock.mockReturnValue({
      parentRef: { current: null },
      rowVirtualizer: { getTotalSize: () => 0, measureElement: vi.fn() },
      virtualItems: [],
    })

    render(<TodoList />)
    expect(screen.getByText('todo.empty')).toBeTruthy()
  })

  it('renders todo rows', () => {
    useTodosInfiniteMock.mockReturnValue({
      data: { pages: [] },
      isLoading: false,
      error: null,
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    })

    useTodoListMock.mockReturnValue({
      todos: [baseTodo],
      editingId: null,
      deletingId: null,
      handleEdit: vi.fn(),
      handleCancelEdit: vi.fn(),
      handleDelete: vi.fn(),
    })

    useTodoVirtualizerMock.mockReturnValue({
      parentRef: { current: null },
      rowVirtualizer: { getTotalSize: () => 200, measureElement: vi.fn() },
      virtualItems: [{ index: 0, key: 'row-0', start: 0 }],
    })

    render(<TodoList />)
    expect(screen.getByText('Tarea 1')).toBeTruthy()
  })
})
