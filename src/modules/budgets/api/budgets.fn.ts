import { createServerFn } from '@tanstack/react-start'
import { eq, and, or, ilike, inArray, sql, desc } from 'drizzle-orm'
import { z } from 'zod'
import { requireCurrentAppUser } from '@/modules/users/api/current-user.server'
import type { getDb } from '@/shared/lib/db/index'
import { loadDb } from '@/shared/lib/db/load'
import { budgets, budgetMembers, transactions } from '@/shared/lib/db/schema'
import { getCurrentPeriodBounds, computeHealthStatus } from '../model/period-utils'
import { createBudgetSchema, updateBudgetSchema } from '../model/schema'
import type { Budget, BudgetHealthSummary } from '../model/types'
import { processRecurrenceRulesForBudget } from './budget-recurrences.fn'

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
  db: ReturnType<typeof getDb>,
  budgetId: string,
  budget: Pick<typeof budgets.$inferSelect, 'periodType' | 'startDate' | 'targetAmount'>,
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

/**
 * Batch-compute health for multiple budgets in a single query per unique period.
 * Groups budgets by (periodType, startDate) to minimize DB round-trips.
 */
async function computeBudgetHealthBatch(
  db: ReturnType<typeof getDb>,
  budgetRows: Pick<
    typeof budgets.$inferSelect,
    'id' | 'periodType' | 'startDate' | 'targetAmount'
  >[],
): Promise<Map<string, BudgetHealthSummary>> {
  if (budgetRows.length === 0) return new Map()

  // Group budgets by their period bounds to batch queries
  const periodGroups = new Map<
    string,
    {
      period: ReturnType<typeof getCurrentPeriodBounds>
      budgets: typeof budgetRows
    }
  >()

  for (const b of budgetRows) {
    const period = getCurrentPeriodBounds(b.periodType, b.startDate)
    const key = `${period.start.toISOString()}|${period.end.toISOString()}`
    if (!periodGroups.has(key)) {
      periodGroups.set(key, { period, budgets: [] })
    }
    periodGroups.get(key)!.budgets.push(b)
  }

  const healthMap = new Map<string, BudgetHealthSummary>()

  // One query per unique period (usually just 1 for same-period budgets)
  await Promise.all(
    Array.from(periodGroups.values()).map(async ({ period, budgets: groupBudgets }) => {
      const budgetIds = groupBudgets.map((b) => b.id)

      const rows = await db
        .select({
          budgetId: transactions.budgetId,
          income: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.amount} > 0 THEN ${transactions.amount} ELSE 0 END), 0)`,
          expenses: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.amount} < 0 THEN ABS(${transactions.amount}) ELSE 0 END), 0)`,
        })
        .from(transactions)
        .where(
          and(
            inArray(transactions.budgetId, budgetIds),
            sql`${transactions.date} >= ${period.start.toISOString().slice(0, 23)}`,
            sql`${transactions.date} <= ${period.end.toISOString().slice(0, 23)}`,
          ),
        )
        .groupBy(transactions.budgetId)

      const aggMap = new Map(rows.map((r) => [r.budgetId, r]))

      for (const b of groupBudgets) {
        const agg = aggMap.get(b.id)
        const income = Number(agg?.income ?? 0)
        const expenses = Number(agg?.expenses ?? 0)
        const balance = income - expenses
        const target = b.targetAmount ?? null
        const { status, usagePct, overBy } = computeHealthStatus(expenses, target)

        healthMap.set(b.id, {
          budgetId: b.id,
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
        })
      }
    }),
  )

  return healthMap
}

export const getBudgetsFn = createServerFn({ method: 'GET' })
  .inputValidator(
    z
      .object({
        scope: z.enum(['personal', 'project', 'department', 'company']).optional(),
        status: z.enum(['active', 'closed', 'archived']).optional(),
        search: z.string().optional(),
        pageParam: z.number().optional(),
        limit: z.number().optional(),
      })
      .optional(),
  )
  .handler(async ({ data }) => {
    const user = await requireCurrentAppUser()
    const db = await loadDb()

    const page = data?.pageParam || 1
    const limit = Math.min(data?.limit || 20, 100)
    const offset = (page - 1) * limit

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
    if (data?.search) conditions.push(ilike(budgets.name, `%${data.search}%`))

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const [rows, totalResult] = await Promise.all([
      db
        .select()
        .from(budgets)
        .where(whereClause)
        .orderBy(desc(budgets.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`COUNT(*)` })
        .from(budgets)
        .where(whereClause),
    ])

    const total = Number(totalResult[0]?.count ?? 0)

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

    // Batch-compute health for all budgets on this page (single query)
    const healthMap = await computeBudgetHealthBatch(db, rows)

    const result = rows.map((row) => ({
      ...serializeBudget(row),
      health: healthMap.get(row.id)!,
      memberCount: memberCountMap[row.id] ?? 0,
    }))

    const totalPages = Math.ceil(total / limit)
    const nextPage = page < totalPages ? page + 1 : undefined

    return {
      data: result,
      nextPage,
      totalCount: total,
    }
  })

export const getBudgetByIdFn = createServerFn({ method: 'GET' })
  .inputValidator(z.string())
  .handler(async ({ data: id }) => {
    const user = await requireCurrentAppUser()
    const db = await loadDb()

    const [row] = await db.select().from(budgets).where(eq(budgets.id, id)).limit(1)
    if (!row) return null

    // System admins can access any budget directly
    const isSystemAdmin = user.roleKey === 'admin'

    if (!isSystemAdmin) {
      // Regular users must be owner or a budget member
      const [membership] = await db
        .select({ budgetId: budgetMembers.budgetId })
        .from(budgetMembers)
        .where(and(eq(budgetMembers.budgetId, id), eq(budgetMembers.userId, user.id)))
        .limit(1)

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
    if (!id) throw new Error('Budget ID is required')

    const [row] = await db
      .select({
        ownerId: budgets.ownerId,
        periodType: budgets.periodType,
        startDate: budgets.startDate,
      })
      .from(budgets)
      .where(eq(budgets.id, id))
      .limit(1)
    if (!row) throw new Error('Budget not found')

    const isSystemAdmin = user.roleKey === 'admin'

    if (!isSystemAdmin && row.ownerId !== user.id) {
      // Must be a budget-level admin member
      const [mem] = await db
        .select({ role: budgetMembers.role })
        .from(budgetMembers)
        .where(
          and(
            eq(budgetMembers.budgetId, id),
            eq(budgetMembers.userId, user.id),
            eq(budgetMembers.role, 'admin'),
          ),
        )
        .limit(1)
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

    const [row] = await db
      .select({ ownerId: budgets.ownerId })
      .from(budgets)
      .where(eq(budgets.id, id))
      .limit(1)
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

    const [row] = await db
      .select({
        ownerId: budgets.ownerId,
        periodType: budgets.periodType,
        startDate: budgets.startDate,
        targetAmount: budgets.targetAmount,
      })
      .from(budgets)
      .where(eq(budgets.id, budgetId))
      .limit(1)
    if (!row) return null

    // System admins can access health for any budget
    const isSystemAdmin = user.roleKey === 'admin'

    if (!isSystemAdmin) {
      const [membership] = await db
        .select({ budgetId: budgetMembers.budgetId })
        .from(budgetMembers)
        .where(and(eq(budgetMembers.budgetId, budgetId), eq(budgetMembers.userId, user.id)))
        .limit(1)

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
    .limit(50)

  // Batch-compute health for all budgets (single query instead of N+1)
  const healthMap = await computeBudgetHealthBatch(db, rows)

  const budgetsWithHealth = rows.map((row) => ({
    ...serializeBudget(row),
    health: healthMap.get(row.id)!,
  }))

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
