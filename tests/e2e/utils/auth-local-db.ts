import postgres from 'postgres'

const AUTH_E2E_DB_URL =
  process.env.AUTH_E2E_DB_URL ??
  'postgresql://postgres:postgres@127.0.0.1:5433/tanstack_template_auth_e2e'

interface AuthUserRow {
  id: string
  email: string
  name: string
}

interface AppUserRow {
  id: string
  email: string
  name: string
  roleId: string | null
  authUserId: string | null
}

export async function getAuthUserByEmail(email: string): Promise<AuthUserRow | null> {
  const sql = postgres(AUTH_E2E_DB_URL, { max: 1, prepare: false })

  try {
    const rows = await sql<AuthUserRow[]>`
      SELECT id, email, name
      FROM auth_users
      WHERE email = ${email}
      LIMIT 1
    `

    return rows[0] ?? null
  } finally {
    await sql.end({ timeout: 5 })
  }
}

export async function getAppUserByEmail(email: string): Promise<AppUserRow | null> {
  const sql = postgres(AUTH_E2E_DB_URL, { max: 1, prepare: false })

  try {
    const rows = await sql<AppUserRow[]>`
      SELECT id, email, name, role_id as "roleId", auth_user_id as "authUserId"
      FROM users
      WHERE email = ${email}
      LIMIT 1
    `

    return rows[0] ?? null
  } finally {
    await sql.end({ timeout: 5 })
  }
}
