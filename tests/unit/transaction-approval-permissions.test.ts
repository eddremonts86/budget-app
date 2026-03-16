import { describe, expect, it } from 'vitest'
import {
  canEditTransactionInHistory,
  canApproveTransaction,
  canApproveTransactions,
  getAppRoleKey,
  getTransactionsPendingApprovalForUser,
} from '@/modules/users/model/permissions'

describe('transaction approval permissions', () => {
  it('normalizes admin and project manager roles', () => {
    expect(getAppRoleKey({ roleId: 'role_admin' })).toBe('admin')
    expect(getAppRoleKey({ roleId: 'role_project_manager' })).toBe('project_manager')
    expect(getAppRoleKey({ roleName: 'Project Manager' })).toBe('project_manager')
    expect(getAppRoleKey({ roleName: 'user' })).toBe('user')
  })

  it('allows admins to approve any pending transaction', () => {
    expect(
      canApproveTransaction(
        { status: 'Pending', assignedAdminId: 'manager_1' },
        'admin_1',
        'admin',
      ),
    ).toBe(true)
  })

  it('allows project managers to approve only their assigned pending transactions', () => {
    expect(
      canApproveTransaction(
        { status: 'Pending', assignedAdminId: 'manager_1' },
        'manager_1',
        'project_manager',
      ),
    ).toBe(true)

    expect(
      canApproveTransaction(
        { status: 'Pending', assignedAdminId: 'manager_2' },
        'manager_1',
        'project_manager',
      ),
    ).toBe(false)
  })

  it('denies regular users and non-pending transactions', () => {
    expect(canApproveTransactions('user')).toBe(false)
    expect(
      canApproveTransaction(
        { status: 'Approved', assignedAdminId: 'manager_1' },
        'admin_1',
        'admin',
      ),
    ).toBe(false)
    expect(
      canApproveTransaction({ status: 'Pending', assignedAdminId: 'manager_1' }, 'user_1', 'user'),
    ).toBe(false)
  })

  it('filters pending approvals according to role scope', () => {
    const transactions = [
      { id: '1', status: 'Pending' as const, assignedAdminId: 'manager_1' },
      { id: '2', status: 'Pending' as const, assignedAdminId: 'manager_2' },
      { id: '3', status: 'Approved' as const, assignedAdminId: 'manager_1' },
    ]

    expect(getTransactionsPendingApprovalForUser(transactions, 'admin_1', 'admin')).toHaveLength(2)
    expect(
      getTransactionsPendingApprovalForUser(transactions, 'manager_1', 'project_manager'),
    ).toEqual([{ id: '1', status: 'Pending', assignedAdminId: 'manager_1' }])
    expect(getTransactionsPendingApprovalForUser(transactions, 'user_1', 'user')).toHaveLength(0)
  })

  it('limits history editing to admins and assigned project managers', () => {
    const pendingAssigned = { id: '1', status: 'Pending' as const, assignedAdminId: 'manager_1' }
    const pendingUnassigned = {
      id: '2',
      status: 'Pending' as const,
      assignedAdminId: 'manager_2',
    }
    const approvedAssigned = {
      id: '3',
      status: 'Approved' as const,
      assignedAdminId: 'manager_1',
    }

    expect(canEditTransactionInHistory(pendingAssigned, 'admin_1', 'admin')).toBe(true)
    expect(canEditTransactionInHistory(pendingAssigned, 'manager_1', 'project_manager')).toBe(true)
    expect(canEditTransactionInHistory(pendingUnassigned, 'manager_1', 'project_manager')).toBe(
      false,
    )
    expect(canEditTransactionInHistory(approvedAssigned, 'manager_1', 'project_manager')).toBe(
      false,
    )
    expect(canEditTransactionInHistory(pendingAssigned, 'user_1', 'user')).toBe(false)
  })
})
