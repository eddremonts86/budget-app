import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createUserFn, deleteUserFn, updateUserFn } from '@/features/Users/api/users.fn'
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

describe('Users CRUD server functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates a user', async () => {
    const createdAt = new Date('2026-03-03T10:00:00.000Z')
    const updatedAt = new Date('2026-03-03T10:00:00.000Z')

    const dbMock = {
      insert: vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue([
            {
              id: 'user-1',
              name: 'User One',
              email: 'user1@example.com',
              roleId: 'role_admin',
              avatar: null,
              jobTitleId: null,
              experienceLevelId: null,
              departmentId: null,
              reportsTo: null,
              createdAt,
              updatedAt,
            },
          ]),
        })),
      })),
      update: vi.fn(),
      delete: vi.fn(),
      select: vi.fn(),
    }

    vi.mocked(getDb).mockReturnValue(dbMock as never)

    const result = await createUserFn({
      data: {
        id: 'user-1',
        name: 'User One',
        email: 'user1@example.com',
        roleId: 'role_admin',
        avatar: null,
        jobTitleId: null,
        experienceLevelId: null,
        departmentId: null,
        reportsTo: null,
      },
    })

    expect(dbMock.insert).toHaveBeenCalled()
    expect(result.id).toBe('user-1')
    expect(result.email).toBe('user1@example.com')
  })

  it('updates a user', async () => {
    const createdAt = new Date('2026-03-03T10:00:00.000Z')
    const updatedAt = new Date('2026-03-03T11:00:00.000Z')

    const dbMock = {
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: vi.fn().mockResolvedValue([
              {
                id: 'user-1',
                name: 'User One Updated',
                email: 'user1+updated@example.com',
                roleId: 'role_admin',
                avatar: null,
                jobTitleId: null,
                experienceLevelId: null,
                departmentId: null,
                reportsTo: null,
                createdAt,
                updatedAt,
              },
            ]),
          })),
        })),
      })),
      insert: vi.fn(),
      delete: vi.fn(),
      select: vi.fn(),
    }

    vi.mocked(getDb).mockReturnValue(dbMock as never)

    const result = await updateUserFn({
      data: {
        id: 'user-1',
        data: {
          name: 'User One Updated',
          email: 'user1+updated@example.com',
        },
      },
    })

    expect(dbMock.update).toHaveBeenCalled()
    expect(result.id).toBe('user-1')
    expect(result.name).toBe('User One Updated')
  })

  it('deletes a user', async () => {
    const dbMock = {
      delete: vi.fn(() => ({
        where: vi.fn().mockResolvedValue(undefined),
      })),
      insert: vi.fn(),
      update: vi.fn(),
      select: vi.fn(),
    }

    vi.mocked(getDb).mockReturnValue(dbMock as never)

    const result = await deleteUserFn({ data: 'user-1' })

    expect(dbMock.delete).toHaveBeenCalledTimes(1)
    expect(result).toEqual({ success: true })
  })
})
