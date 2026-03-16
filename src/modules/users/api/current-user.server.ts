import { and, eq } from 'drizzle-orm'
import { externalIdentities, roles, users } from '@/shared/lib/db/schema'
import { requireAuthUser } from '@/shared/lib/auth/server'
import { getAppRoleKey, type AppRoleKey } from '../model/permissions'

export interface CurrentAppUser {
  id: string
  name: string
  email: string
  roleId: string | null
  roleName: string | null
  roleKey: AppRoleKey
}

async function loadDb() {
  const { getDb } = await import('@/shared/lib/db')
  return getDb()
}

export async function getCurrentAppUser(): Promise<CurrentAppUser | null> {
  const authUser = await requireAuthUser()

  if (authUser.provider === 'bypass') {
    return {
      id: authUser.userId,
      name: authUser.name ?? 'Local Test User',
      email: authUser.email ?? 'local-test@example.com',
      roleId: 'role_admin',
      roleName: 'admin',
      roleKey: 'admin',
    }
  }

  const db = await loadDb()

  const selectShape = {
    id: users.id,
    name: users.name,
    email: users.email,
    roleId: users.roleId,
    roleName: roles.name,
  }

  const findUserByEmail = async () => {
    if (!authUser.email) {
      return null
    }

    const [record] = await db
      .select(selectShape)
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.email, authUser.email))
      .limit(1)

    return record ?? null
  }

  if (authUser.provider === 'better-auth') {
    const [record] = await db
      .select(selectShape)
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.authUserId, authUser.userId))
      .limit(1)

    const appUser = record ?? (await findUserByEmail())

    if (!appUser) {
      return null
    }

    return {
      ...appUser,
      roleKey: getAppRoleKey(appUser),
    }
  }

  if (authUser.provider === 'clerk') {
    const [record] = await db
      .select(selectShape)
      .from(users)
      .innerJoin(externalIdentities, eq(externalIdentities.userId, users.id))
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(
        and(
          eq(externalIdentities.provider, 'clerk'),
          eq(externalIdentities.externalUserId, authUser.userId),
        ),
      )
      .limit(1)

    const appUser = record ?? (await findUserByEmail())

    if (!appUser) {
      return null
    }

    return {
      ...appUser,
      roleKey: getAppRoleKey(appUser),
    }
  }

  return null
}

export async function requireCurrentAppUser() {
  const appUser = await getCurrentAppUser()

  if (!appUser) {
    throw new Error('Unauthorized')
  }

  return appUser
}
