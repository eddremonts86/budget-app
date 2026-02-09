import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Todo } from '../types/todo.types'
import { useTodoList } from './useTodoList'

const mutateMock = vi.hoisted(() =>
  vi.fn((_id: string, { onSettled }: { onSettled: () => void }) => {
    onSettled()
  }),
)

vi.mock('../api', () => ({
  useDeleteTodo: () => ({
    mutate: mutateMock,
  }),
}))

type TodoPage = { items: Todo[] }
type TodoData = { pages: TodoPage[] }

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

const HookProbe = ({ data }: { data: TodoData | undefined }) => {
  const { todos, editingId, deletingId, handleEdit, handleCancelEdit, handleDelete } =
    useTodoList(data)

  return (
    <div>
      <span data-testid="todos-count">{todos.length}</span>
      <span data-testid="first-title">{todos[0]?.title ?? ''}</span>
      <span data-testid="editing-id">{editingId ?? ''}</span>
      <span data-testid="deleting-id">{deletingId ?? ''}</span>
      <button type="button" onClick={() => handleEdit('1')}>
        edit
      </button>
      <button type="button" onClick={handleCancelEdit}>
        cancel
      </button>
      <button type="button" onClick={() => handleDelete('1')}>
        delete
      </button>
    </div>
  )
}

let root: Root | null = null
let container: HTMLDivElement | null = null

const renderHookProbe = async (data: TodoData | undefined) => {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => {
    root?.render(<HookProbe data={data} />)
  })
}

const getByTestId = (testId: string) => {
  if (!container) throw new Error('Container not initialized')
  const element = container.querySelector(`[data-testid="${testId}"]`)
  if (!element) throw new Error(`Missing element: ${testId}`)
  return element
}

const clickButton = (label: string) => {
  if (!container) throw new Error('Container not initialized')
  const button = Array.from(container.querySelectorAll('button')).find(
    (node) => node.textContent === label,
  )
  if (!button) throw new Error(`Missing button: ${label}`)
  act(() => {
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
}

describe('useTodoList', () => {
  const mockData: TodoData = {
    pages: [
      {
        items: [
          createMockTodo({ id: '1', title: 'Todo 1' }),
          createMockTodo({ id: '2', title: 'Todo 2', status: 'completed' }),
        ],
      },
    ],
  }

  beforeEach(() => {
    mutateMock.mockClear()
  })

  afterEach(async () => {
    if (root && container) {
      await act(async () => {
        root?.unmount()
      })
      container.remove()
    }
    root = null
    container = null
  })

  it('should process data into unique todos', async () => {
    await renderHookProbe(mockData)
    expect(getByTestId('todos-count').textContent).toBe('2')
    expect(getByTestId('first-title').textContent).toBe('Todo 1')
  })

  it('should handle duplicates in data', async () => {
    const duplicateData: TodoData = {
      pages: [
        {
          items: [
            createMockTodo({ id: '1', title: 'Todo 1' }),
            createMockTodo({ id: '1', title: 'Todo 1 Duplicate' }),
          ],
        },
      ],
    }
    await renderHookProbe(duplicateData)
    expect(getByTestId('todos-count').textContent).toBe('1')
    expect(getByTestId('first-title').textContent).toBe('Todo 1')
  })

  it('should manage editing state', async () => {
    await renderHookProbe(mockData)
    clickButton('edit')
    expect(getByTestId('editing-id').textContent).toBe('1')
    clickButton('cancel')
    expect(getByTestId('editing-id').textContent).toBe('')
  })

  it('should manage deleting state', async () => {
    await renderHookProbe(mockData)
    clickButton('delete')
    expect(getByTestId('deleting-id').textContent).toBe('')
    expect(mutateMock).toHaveBeenCalledWith('1', expect.any(Object))
  })
})
