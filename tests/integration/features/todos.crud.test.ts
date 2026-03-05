import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createTodoFn, deleteTodoFn, updateTodoFn } from '@/features/Todos/api/todos.fn'
import { getDb } from '@/shared/lib/db'
import { deleteRagDocument, syncRagDocument } from '@/shared/lib/rag/sync'

vi.mock('@tanstack/react-start', () => ({
  createServerFn: () => {
    const chain: {
      inputValidator: () => typeof chain
      handler: (fn: (args: unknown) => unknown) => (args: unknown) => Promise<unknown>
    } = {
      inputValidator: () => chain,
      handler: (fn) => async (args) => fn(args),
    }
    return chain
  },
}))

vi.mock('@/shared/lib/db', () => ({
  getDb: vi.fn(),
}))

vi.mock('@/shared/lib/rag/sync', () => ({
  syncRagDocument: vi.fn().mockResolvedValue(undefined),
  deleteRagDocument: vi.fn().mockResolvedValue(undefined),
}))

describe('Todos CRUD server functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates a todo', async () => {
    const createdAt = new Date('2026-03-03T10:00:00.000Z')
    const updatedAt = new Date('2026-03-03T10:00:00.000Z')

    const dbMock = {
      insert: vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue([
            {
              id: 'todo-1',
              title: 'Todo One',
              description: 'Do something important',
              status: 'pending',
              priority: 'medium',
              dueDate: new Date('2026-03-20T00:00:00.000Z'),
              projectId: 'project-1',
              assignedTo: 'user-1',
              createdBy: 'user-1',
              createdAt,
              updatedAt,
            },
          ]),
        })),
      })),
      update: vi.fn(),
      delete: vi.fn(),
    }

    vi.mocked(getDb).mockReturnValue(dbMock as never)

    const result = await createTodoFn({
      data: {
        title: 'Todo One',
        description: 'Do something important',
        status: 'pending',
        priority: 'medium',
        dueDate: '2026-03-20T00:00:00.000Z',
        projectId: 'project-1',
        assignedTo: 'user-1',
      },
    })

    expect(dbMock.insert).toHaveBeenCalled()
    expect(syncRagDocument).toHaveBeenCalled()
    expect(result.id).toBe('todo-1')
    expect(result.status).toBe('pending')
  })

  it('updates a todo', async () => {
    const createdAt = new Date('2026-03-03T10:00:00.000Z')
    const updatedAt = new Date('2026-03-03T11:00:00.000Z')

    const dbMock = {
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: vi.fn().mockResolvedValue([
              {
                id: 'todo-1',
                title: 'Todo One Updated',
                description: 'Updated description',
                status: 'in_progress',
                priority: 'high',
                dueDate: new Date('2026-03-21T00:00:00.000Z'),
                projectId: 'project-1',
                assignedTo: 'user-1',
                createdBy: 'user-1',
                createdAt,
                updatedAt,
              },
            ]),
          })),
        })),
      })),
      insert: vi.fn(),
      delete: vi.fn(),
    }

    vi.mocked(getDb).mockReturnValue(dbMock as never)

    const result = await updateTodoFn({
      data: {
        id: 'todo-1',
        data: {
          title: 'Todo One Updated',
          description: 'Updated description',
          status: 'in_progress',
          priority: 'high',
          dueDate: '2026-03-21T00:00:00.000Z',
          projectId: 'project-1',
          assignedTo: 'user-1',
        },
      },
    })

    expect(dbMock.update).toHaveBeenCalled()
    expect(syncRagDocument).toHaveBeenCalled()
    expect(result.id).toBe('todo-1')
    expect(result.status).toBe('in_progress')
  })

  it('deletes a todo', async () => {
    const dbMock = {
      delete: vi.fn(() => ({
        where: vi.fn().mockResolvedValue(undefined),
      })),
      insert: vi.fn(),
      update: vi.fn(),
    }

    vi.mocked(getDb).mockReturnValue(dbMock as never)

    const result = await deleteTodoFn({ data: 'todo-1' })

    expect(dbMock.delete).toHaveBeenCalledTimes(1)
    expect(deleteRagDocument).toHaveBeenCalledWith('todo', 'todo-1')
    expect(result).toEqual({ success: true })
  })
})
