import { randomUUID } from 'node:crypto'
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

interface SeedAppUserInput {
  id?: string
  email: string
  name: string
  roleId: string
}

interface SeedProjectInput {
  id?: string
  name: string
  description?: string | null
}

interface SeedTransactionInput {
  id?: string
  customerName: string
  customerEmail: string
  amount: number
  userId: string
  projectId?: string | null
  assignedAdminId?: string | null
}

interface TransactionRow {
  id: string
  status: 'Approved' | 'Pending' | 'Rejected'
  assignedAdminId: string | null
  approvedBy: string | null
  rejectionReason: string | null
}

export async function seedAppUser(input: SeedAppUserInput): Promise<AppUserRow> {
  const sql = postgres(AUTH_E2E_DB_URL, { max: 1, prepare: false })
  const userId = input.id ?? randomUUID()

  try {
    const rows = await sql<AppUserRow[]>`
      INSERT INTO users (id, name, email, role_id)
      VALUES (${userId}, ${input.name}, ${input.email}, ${input.roleId})
      ON CONFLICT (email) DO UPDATE
      SET
        name = EXCLUDED.name,
        role_id = EXCLUDED.role_id,
        updated_at = NOW()
      RETURNING id, email, name, role_id as "roleId", auth_user_id as "authUserId"
    `

    return rows[0]!
  } finally {
    await sql.end({ timeout: 5 })
  }
}

export async function seedProject(input: SeedProjectInput) {
  const sql = postgres(AUTH_E2E_DB_URL, { max: 1, prepare: false })
  const projectId = input.id ?? randomUUID()

  try {
    const rows = await sql<{ id: string; name: string }[]>`
      INSERT INTO projects (id, name, description)
      VALUES (${projectId}, ${input.name}, ${input.description ?? null})
      RETURNING id, name
    `

    return rows[0]!
  } finally {
    await sql.end({ timeout: 5 })
  }
}

export async function seedTransaction(input: SeedTransactionInput) {
  const sql = postgres(AUTH_E2E_DB_URL, { max: 1, prepare: false })
  const transactionId = input.id ?? randomUUID()

  try {
    const rows = await sql<{ id: string }[]>`
      INSERT INTO transactions (
        id,
        customer_name,
        customer_email,
        status,
        date,
        amount,
        user_id,
        project_id,
        assigned_admin_id
      )
      VALUES (
        ${transactionId},
        ${input.customerName},
        ${input.customerEmail},
        'Pending',
        NOW(),
        ${input.amount},
        ${input.userId},
        ${input.projectId ?? null},
        ${input.assignedAdminId ?? null}
      )
      RETURNING id
    `

    return rows[0]!
  } finally {
    await sql.end({ timeout: 5 })
  }
}

export async function getTransactionById(id: string): Promise<TransactionRow | null> {
  const sql = postgres(AUTH_E2E_DB_URL, { max: 1, prepare: false })

  try {
    const rows = await sql<TransactionRow[]>`
      SELECT
        id,
        status,
        assigned_admin_id as "assignedAdminId",
        approved_by as "approvedBy",
        rejection_reason as "rejectionReason"
      FROM transactions
      WHERE id = ${id}
      LIMIT 1
    `

    return rows[0] ?? null
  } finally {
    await sql.end({ timeout: 5 })
  }
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
