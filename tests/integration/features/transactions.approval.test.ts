import { beforeEach, describe, expect, it, vi } from 'vitest'
import { updateTransactionFn } from '@/modules/transactions/api/transactions.fn'
import { requireCurrentAppUser } from '@/modules/users/api/current-user.server'
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

vi.mock('@/modules/users/api/current-user.server', () => ({
  requireCurrentAppUser: vi.fn(),
}))

function createDbMock(existingTransaction: {
  id: string
  status: 'Approved' | 'Pending' | 'Rejected'
  assignedAdminId: string | null
}) {
  const dbTransaction = {
    id: existingTransaction.id,
    customerName: 'Test Customer',
    customerEmail: 'customer@example.com',
    status: existingTransaction.status,
    date: new Date('2026-03-16T10:00:00.000Z'),
    amount: 2500,
    paymentMethod: null,
    description: null,
    userId: 'user-1',
    projectId: 'project-1',
    categoryId: null,
    assignedAdminId: existingTransaction.assignedAdminId,
    approvedBy: null,
    approvedAt: null,
    rejectionReason: null,
  }

  let capturedUpdatePayload: Record<string, unknown> | null = null

  const dbMock = {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn().mockResolvedValue([dbTransaction]),
        })),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn((payload: Record<string, unknown>) => {
        capturedUpdatePayload = payload
        return {
          where: vi.fn(() => ({
            returning: vi.fn().mockResolvedValue([
              {
                ...dbTransaction,
                ...payload,
              },
            ]),
          })),
        }
      }),
    })),
  }

  return { dbMock, getCapturedUpdatePayload: () => capturedUpdatePayload }
}

describe('Transactions approval authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete process.env.VITE_E2E
  })

  it('allows admins to approve any pending transaction', async () => {
    const { dbMock, getCapturedUpdatePayload } = createDbMock({
      id: 'transaction-admin',
      status: 'Pending',
      assignedAdminId: 'manager-2',
    })

    vi.mocked(getDb).mockReturnValue(dbMock as never)
    vi.mocked(requireCurrentAppUser).mockResolvedValue({
      id: 'admin-1',
      name: 'Admin One',
      email: 'admin@example.com',
      roleId: 'role_admin',
      roleName: 'admin',
      roleKey: 'admin',
    })

    const result = await updateTransactionFn({
      data: {
        id: 'transaction-admin',
        data: {
          status: 'Approved',
        },
      },
    })

    expect(dbMock.update).toHaveBeenCalled()
    expect(getCapturedUpdatePayload()).toMatchObject({
      status: 'Approved',
      approvedBy: 'admin-1',
    })
    expect(result.approvedBy).toBe('admin-1')
    expect(result.approvedAt).toBeTruthy()
  })

  it('allows project managers to approve only assigned pending transactions', async () => {
    const { dbMock, getCapturedUpdatePayload } = createDbMock({
      id: 'transaction-pm',
      status: 'Pending',
      assignedAdminId: 'manager-1',
    })

    vi.mocked(getDb).mockReturnValue(dbMock as never)
    vi.mocked(requireCurrentAppUser).mockResolvedValue({
      id: 'manager-1',
      name: 'Manager One',
      email: 'manager@example.com',
      roleId: 'role_project_manager',
      roleName: 'project_manager',
      roleKey: 'project_manager',
    })

    const result = await updateTransactionFn({
      data: {
        id: 'transaction-pm',
        data: {
          status: 'Approved',
        },
      },
    })

    expect(dbMock.update).toHaveBeenCalled()
    expect(getCapturedUpdatePayload()).toMatchObject({
      status: 'Approved',
      approvedBy: 'manager-1',
    })
    expect(result.approvedBy).toBe('manager-1')
  })

  it('rejects project managers approving transactions assigned to someone else', async () => {
    const { dbMock } = createDbMock({
      id: 'transaction-pm-forbidden',
      status: 'Pending',
      assignedAdminId: 'manager-2',
    })

    vi.mocked(getDb).mockReturnValue(dbMock as never)
    vi.mocked(requireCurrentAppUser).mockResolvedValue({
      id: 'manager-1',
      name: 'Manager One',
      email: 'manager@example.com',
      roleId: 'role_project_manager',
      roleName: 'project_manager',
      roleKey: 'project_manager',
    })

    await expect(
      updateTransactionFn({
        data: {
          id: 'transaction-pm-forbidden',
          data: {
            status: 'Approved',
          },
        },
      }),
    ).rejects.toThrow('Forbidden')

    expect(dbMock.update).not.toHaveBeenCalled()
  })
})
