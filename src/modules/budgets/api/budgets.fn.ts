import { createServerFn } from '@tanstack/react-start'
import { eq, and, or, inArray, sql, desc } from 'drizzle-orm'
import { z } from 'zod'
import { requireCurrentAppUser } from '@/modules/users/api/current-user.server'
import { budgets, budgetMembers, transactions } from '@/shared/lib/db/schema'
import { getCurrentPeriodBounds, computeHealthStatus } from '../model/period-utils'
import { createBudgetSchema, updateBudgetSchema } from '../model/schema'
import type { Budget, BudgetHealthSummary } from '../model/types'
import { processRecurrenceRulesForBudget } from './budget-recurrences.fn'

async function loadDb() {
  const { getDb } = await import('@/shared/lib/db')
  return getDb()
}

function serializeBudget(row: typeof budgets.$inferSelect): Budget {
  return {
    ...row,
    targetAmount: row.targetAmount ?? null,
    startDate: row.startDate.toISOString(),
    endDate: row.endDate ? row.endDate.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    isActive: row.isActive,
    currency: row.currency ?? 'USD',
  }
}

async function computeBudgetHealth(
  db: ReturnType<typeof import('@/shared/lib/db').getDb>,
  budgetId: string,
  budget: typeof budgets.$inferSelect,
): Promise<BudgetHealthSummary> {
  const period = getCurrentPeriodBounds(budget.periodType, budget.startDate)

  const [agg] = await db
    .select({
      income: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.amount} > 0 THEN ${transactions.amount} ELSE 0 END), 0)`,
      expenses: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.amount} < 0 THEN ABS(${transactions.amount}) ELSE 0 END), 0)`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.budgetId, budgetId),
        sql`${transactions.date} >= ${period.start.toISOString().slice(0, 23)}`,
        sql`${transactions.date} <= ${period.end.toISOString().slice(0, 23)}`,
      ),
    )

  const income = Number(agg?.income ?? 0)
  const expenses = Number(agg?.expenses ?? 0)
  const balance = income - expenses
  const target = budget.targetAmount ?? null
  const { status, usagePct, overBy } = computeHealthStatus(expenses, target)

  return {
    budgetId,
    spent: expenses,
    income,
    balance,
    target,
    remaining: target !== null ? Math.max(0, target - expenses) : null,
    usagePct,
    status,
    overBy,
    periodStart: period.start.toISOString(),
    periodEnd: period.end.toISOString(),
  }
}

export const getBudgetsFn = createServerFn({ method: 'GET' })
  .inputValidator(
    z
      .object({
        scope: z.enum(['personal', 'project', 'department', 'company']).optional(),
        status: z.enum(['active', 'closed', 'archived']).optional(),
      })
      .optional(),
  )
  .handler(async ({ data }) => {
    const user = await requireCurrentAppUser()
    const db = await loadDb()

    // System admins can see all budgets regardless of membership
    const isSystemAdmin = user.roleKey === 'admin'

    const conditions: ReturnType<typeof eq>[] = []

    if (!isSystemAdmin) {
      // Regular users only see budgets they own or are members of
      const memberBudgetIds = await db
        .select({ budgetId: budgetMembers.budgetId })
        .from(budgetMembers)
        .where(eq(budgetMembers.userId, user.id))

      const memberIds = memberBudgetIds.map((m) => m.budgetId)

      conditions.push(
        or(
          eq(budgets.ownerId, user.id),
          memberIds.length > 0 ? inArray(budgets.id, memberIds) : undefined,
        ) as ReturnType<typeof eq>,
      )
    }

    if (data?.scope) conditions.push(eq(budgets.scope, data.scope))
    if (data?.status) conditions.push(eq(budgets.status, data.status))

    const rows = await db
      .select()
      .from(budgets)
      .where(and(...conditions))
      .orderBy(desc(budgets.createdAt))

    // Batch-fetch member counts for all returned budgets
    const memberCountRows =
      rows.length > 0
        ? await db
            .select({
              budgetId: budgetMembers.budgetId,
              count: sql<number>`COUNT(*)`,
            })
            .from(budgetMembers)
            .where(
              inArray(
                budgetMembers.budgetId,
                rows.map((r) => r.id),
              ),
            )
            .groupBy(budgetMembers.budgetId)
        : []

    const memberCountMap: Record<string, number> = {}
    for (const m of memberCountRows) {
      memberCountMap[m.budgetId] = Number(m.count)
    }

    // Compute health for each budget
    const result = await Promise.all(
      rows.map(async (row) => {
        const health = await computeBudgetHealth(db, row.id, row)
        return { ...serializeBudget(row), health, memberCount: memberCountMap[row.id] ?? 0 }
      }),
    )

    return result
  })

export const getBudgetByIdFn = createServerFn({ method: 'GET' })
  .inputValidator(z.string())
  .handler(async ({ data: id }) => {
    const user = await requireCurrentAppUser()
    const db = await loadDb()

    const [row] = await db.select().from(budgets).where(eq(budgets.id, id))
    if (!row) return null

    // System admins can access any budget directly
    const isSystemAdmin = user.roleKey === 'admin'

    if (!isSystemAdmin) {
      // Regular users must be owner or a budget member
      const [membership] = await db
        .select()
        .from(budgetMembers)
        .where(and(eq(budgetMembers.budgetId, id), eq(budgetMembers.userId, user.id)))

      if (row.ownerId !== user.id && !membership) return null
    }

    const [memberCount] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(budgetMembers)
      .where(eq(budgetMembers.budgetId, id))

    // Process any due recurring rules so health reflects them
    await processRecurrenceRulesForBudget(id)

    const health = await computeBudgetHealth(db, id, row)

    return {
      ...serializeBudget(row),
      health,
      memberCount: Number(memberCount?.count ?? 0),
    }
  })

export const createBudgetFn = createServerFn({ method: 'POST' })
  .inputValidator(createBudgetSchema)
  .handler(async ({ data }) => {
    const user = await requireCurrentAppUser()
    const db = await loadDb()

    const id = crypto.randomUUID()

    return await db.transaction(async (tx) => {
      const [budget] = await tx
        .insert(budgets)
        .values({
          id,
          name: data.name,
          description: data.description ?? null,
          scope: data.scope,
          projectId: data.projectId ?? null,
          departmentId: data.departmentId ?? null,
          ownerId: user.id,
          targetAmount: data.targetAmount ?? null,
          currency: data.currency ?? 'USD',
          periodType: data.periodType,
          startDate: new Date(data.startDate),
          endDate: data.endDate ? new Date(data.endDate) : null,
          status: 'active',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning()

      // Auto-add owner as admin member
      await tx.insert(budgetMembers).values({
        budgetId: id,
        userId: user.id,
        role: 'admin',
        joinedAt: new Date(),
      })

      return serializeBudget(budget)
    })
  })

export const updateBudgetFn = createServerFn({ method: 'POST' })
  .inputValidator(updateBudgetSchema)
  .handler(async ({ data }) => {
    const user = await requireCurrentAppUser()
    const db = await loadDb()

    const { id, ...updateData } = data

    const [row] = await db.select().from(budgets).where(eq(budgets.id, id))
    if (!row) throw new Error('Budget not found')

    const isSystemAdmin = user.roleKey === 'admin'

    if (!isSystemAdmin && row.ownerId !== user.id) {
      // Must be a budget-level admin member
      const [mem] = await db
        .select()
        .from(budgetMembers)
        .where(
          and(
            eq(budgetMembers.budgetId, id),
            eq(budgetMembers.userId, user.id),
            eq(budgetMembers.role, 'admin'),
          ),
        )
      if (!mem) throw new Error('Forbidden')
    }

    // Guard: only block if periodType or startDate are actually changing
    const maybeChangingPeriod =
      updateData.periodType !== undefined || updateData.startDate !== undefined
    if (maybeChangingPeriod) {
      const [{ txCount }] = await db
        .select({ txCount: sql<number>`COUNT(*)` })
        .from(transactions)
        .where(eq(transactions.budgetId, id))

      if (Number(txCount) > 0) {
        if (updateData.periodType && updateData.periodType !== row.periodType) {
          throw new Error('Cannot change period type when budget has existing transactions.')
        }
        const newStart = updateData.startDate?.split('T')[0]
        const existingStart = row.startDate.toISOString().split('T')[0]
        if (newStart && newStart !== existingStart) {
          throw new Error('Cannot change start date when budget has existing transactions.')
        }
      }
    }

    const [updated] = await db
      .update(budgets)
      .set({
        ...updateData,
        startDate: updateData.startDate ? new Date(updateData.startDate) : undefined,
        endDate: updateData.endDate ? new Date(updateData.endDate) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(budgets.id, id))
      .returning()

    return serializeBudget(updated)
  })

export const deleteBudgetFn = createServerFn({ method: 'POST' })
  .inputValidator(z.string())
  .handler(async ({ data: id }) => {
    const user = await requireCurrentAppUser()
    const db = await loadDb()

    const [row] = await db.select().from(budgets).where(eq(budgets.id, id))
    if (!row) throw new Error('Budget not found')

    const isSystemAdmin = user.roleKey === 'admin'
    if (!isSystemAdmin && row.ownerId !== user.id)
      throw new Error('Only the owner can delete a budget')

    await db.delete(budgets).where(eq(budgets.id, id))
    return { success: true }
  })

export const getBudgetHealthFn = createServerFn({ method: 'GET' })
  .inputValidator(z.string())
  .handler(async ({ data: budgetId }) => {
    const user = await requireCurrentAppUser()
    const db = await loadDb()

    const [row] = await db.select().from(budgets).where(eq(budgets.id, budgetId))
    if (!row) return null

    // System admins can access health for any budget
    const isSystemAdmin = user.roleKey === 'admin'

    if (!isSystemAdmin) {
      const [membership] = await db
        .select()
        .from(budgetMembers)
        .where(and(eq(budgetMembers.budgetId, budgetId), eq(budgetMembers.userId, user.id)))

      if (row.ownerId !== user.id && !membership) return null
    }

    return computeBudgetHealth(db, budgetId, row)
  })

export const getMyBudgetsDashboardFn = createServerFn({ method: 'GET' }).handler(async () => {
  const user = await requireCurrentAppUser()
  const db = await loadDb()

  const memberBudgetIds = await db
    .select({ budgetId: budgetMembers.budgetId })
    .from(budgetMembers)
    .where(eq(budgetMembers.userId, user.id))

  const memberIds = memberBudgetIds.map((m) => m.budgetId)

  const rows = await db
    .select()
    .from(budgets)
    .where(
      and(
        eq(budgets.status, 'active'),
        or(
          eq(budgets.ownerId, user.id),
          memberIds.length > 0 ? inArray(budgets.id, memberIds) : undefined,
        ),
      ),
    )
    .orderBy(desc(budgets.createdAt))

  const budgetsWithHealth = await Promise.all(
    rows.map(async (row) => {
      const health = await computeBudgetHealth(db, row.id, row)
      return { ...serializeBudget(row), health }
    }),
  )

  const totalIncome = budgetsWithHealth.reduce((sum, b) => sum + (b.health?.income ?? 0), 0)
  const totalExpenses = budgetsWithHealth.reduce((sum, b) => sum + (b.health?.spent ?? 0), 0)
  const overBudgetCount = budgetsWithHealth.filter((b) => b.health?.status === 'over_budget').length

  return {
    totalBalance: totalIncome - totalExpenses,
    totalIncome,
    totalExpenses,
    overBudgetCount,
    budgets: budgetsWithHealth,
  }
})

export { computeBudgetHealth }
