import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createProjectFn,
  deleteProjectFn,
  updateProjectFn,
} from '@/features/Projects/api/projects.fn'
import { getDb } from '@/shared/lib/db'

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

describe('Projects CRUD server functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates a project', async () => {
    const createdAt = new Date('2026-03-03T10:00:00.000Z')
    const updatedAt = new Date('2026-03-03T10:00:00.000Z')

    const dbMock = {
      insert: vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue([
            {
              id: 'project-new',
              name: 'New Project',
              description: 'Initial description',
              startDate: new Date('2026-03-01T00:00:00.000Z'),
              endDate: new Date('2026-12-31T00:00:00.000Z'),
              status: 'active',
              type: 'internal',
              priority: 'medium',
              budget: 10000,
              departmentId: null,
              createdAt,
              updatedAt,
            },
          ]),
        })),
      })),
      delete: vi.fn(),
      update: vi.fn(),
      select: vi.fn(),
    }

    vi.mocked(getDb).mockReturnValue(dbMock as never)

    const result = await createProjectFn({
      data: {
        name: 'New Project',
        description: 'Initial description',
        startDate: '2026-03-01T00:00:00.000Z',
        endDate: '2026-12-31T00:00:00.000Z',
        skills: [],
        status: 'active',
        type: 'internal',
        priority: 'medium',
        budget: 10000,
        departmentId: null,
        team: [],
      },
    })

    expect(dbMock.insert).toHaveBeenCalled()
    expect(result.id).toBe('project-new')
    expect(result.name).toBe('New Project')
  })

  it('updates a project', async () => {
    const createdAt = new Date('2026-03-03T10:00:00.000Z')
    const updatedAt = new Date('2026-03-03T11:00:00.000Z')

    const dbMock = {
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: vi.fn().mockResolvedValue([
              {
                id: 'project-1',
                name: 'Project Updated',
                description: 'Updated description',
                startDate: new Date('2026-03-01T00:00:00.000Z'),
                endDate: new Date('2026-12-31T00:00:00.000Z'),
                status: 'completed',
                type: 'internal',
                priority: 'high',
                budget: 20000,
                departmentId: null,
                createdAt,
                updatedAt,
              },
            ]),
          })),
        })),
      })),
      delete: vi.fn(),
      insert: vi.fn(),
      select: vi.fn(),
    }

    vi.mocked(getDb).mockReturnValue(dbMock as never)

    const result = await updateProjectFn({
      data: {
        id: 'project-1',
        data: {
          name: 'Project Updated',
          description: 'Updated description',
          status: 'completed',
          priority: 'high',
          budget: 20000,
        },
      },
    })

    expect(dbMock.update).toHaveBeenCalled()
    expect(result.id).toBe('project-1')
    expect(result.status).toBe('completed')
  })

  it('deletes a project', async () => {
    const dbMock = {
      delete: vi.fn(() => ({
        where: vi.fn().mockResolvedValue(undefined),
      })),
      insert: vi.fn(),
      update: vi.fn(),
      select: vi.fn(),
    }

    vi.mocked(getDb).mockReturnValue(dbMock as never)

    const result = await deleteProjectFn({ data: 'project-1' })

    expect(dbMock.delete).toHaveBeenCalledTimes(2)
    expect(result).toEqual({ success: true })
  })
})
