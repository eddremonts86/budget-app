import type { User } from './types'

export type AppRoleKey = 'admin' | 'project_manager' | 'user'

interface RoleLike {
  roleId?: string | null
  roleName?: string | null
}

interface ApprovableTransactionLike {
  id?: string
  status: 'Approved' | 'Pending' | 'Rejected'
  assignedAdminId?: string | null
}

function normalizeRoleName(roleName?: string | null) {
  return (
    roleName
      ?.trim()
      .toLowerCase()
      .replace(/[\s-]+/g, '_') ?? ''
  )
}

export function getAppRoleKey(roleLike?: RoleLike | null): AppRoleKey {
  if (!roleLike) {
    return 'user'
  }

  if (roleLike.roleId === 'role_admin') {
    return 'admin'
  }

  if (roleLike.roleId === 'role_project_manager') {
    return 'project_manager'
  }

  const normalizedRoleName = normalizeRoleName(roleLike.roleName)

  if (normalizedRoleName === 'admin' || normalizedRoleName === 'administrator') {
    return 'admin'
  }

  if (normalizedRoleName === 'project_manager') {
    return 'project_manager'
  }

  return 'user'
}

export function getTodoPermissionRole(roleKey: AppRoleKey): 'admin' | 'user' {
  return roleKey === 'admin' ? 'admin' : 'user'
}

export function isAdminRole(roleKey: AppRoleKey): boolean {
  return roleKey === 'admin'
}

export function canApproveTransactions(roleKey: AppRoleKey): boolean {
  return roleKey === 'admin' || roleKey === 'project_manager'
}

export function canApproveTransaction(
  transaction: ApprovableTransactionLike,
  currentUserId: string | null,
  roleKey: AppRoleKey,
): boolean {
  if (!currentUserId || transaction.status !== 'Pending' || !canApproveTransactions(roleKey)) {
    return false
  }

  if (roleKey === 'admin') {
    return true
  }

  return transaction.assignedAdminId === currentUserId
}

export function getTransactionsPendingApprovalForUser<T extends ApprovableTransactionLike>(
  transactions: T[],
  currentUserId: string | null,
  roleKey: AppRoleKey,
): T[] {
  return transactions.filter((transaction) =>
    canApproveTransaction(transaction, currentUserId, roleKey),
  )
}

export function getAssignableApprovers<T extends RoleLike>(users: T[]): T[] {
  return users.filter((user) => canApproveTransactions(getAppRoleKey(user)))
}

export function canEditTransactionInHistory(
  transaction: ApprovableTransactionLike,
  currentUserId: string | null,
  roleKey: AppRoleKey,
): boolean {
  if (roleKey === 'admin') {
    return true
  }

  if (roleKey === 'project_manager') {
    return canApproveTransaction(transaction, currentUserId, roleKey)
  }

  return false
}

export function isCurrentUser(user: Pick<User, 'id'> | null, currentUserId: string | null) {
  return Boolean(user?.id && currentUserId && user.id === currentUserId)
}
