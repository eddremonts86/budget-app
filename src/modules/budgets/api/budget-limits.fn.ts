import { createServerFn } from '@tanstack/react-start'
import { and, eq, sql } from 'drizzle-orm'
import { requireCurrentAppUser } from '@/modules/users/api/current-user.server'
import { budgetCategoryLimits, budgets, categories, transactions } from '@/shared/lib/db/schema'
import { getCurrentPeriodBounds } from '../model/period-utils'
import { upsertBudgetCategoryLimitSchema, deleteBudgetCategoryLimitSchema } from '../model/schema'
import type { BudgetCategoryLimit } from '../model/types'

async function loadDb() {
  const { getDb } = await import('@/shared/lib/db')
  return getDb()
}

export const getBudgetCategoryLimitsFn = createServerFn({ method: 'GET' })
  .inputValidator(String)
  .handler(async ({ data: budgetId }): Promise<BudgetCategoryLimit[]> => {
    await requireCurrentAppUser()
    const db = await loadDb()

    const [budgetRow] = await db
      .select({ periodType: budgets.periodType, startDate: budgets.startDate })
      .from(budgets)
      .where(eq(budgets.id, budgetId))
      .limit(1)
    if (!budgetRow) return []

    const period = getCurrentPeriodBounds(budgetRow.periodType, budgetRow.startDate)

    // Get limits with category info + spent per category
    const limits = await db
      .select({
        budgetId: budgetCategoryLimits.budgetId,
        categoryId: budgetCategoryLimits.categoryId,
        allocatedAmount: budgetCategoryLimits.allocatedAmount,
        categoryName: categories.name,
        categoryColor: categories.color,
      })
      .from(budgetCategoryLimits)
      .leftJoin(categories, eq(budgetCategoryLimits.categoryId, categories.id))
      .where(eq(budgetCategoryLimits.budgetId, budgetId))

    // Compute spent per category
    const spentRows = await db
      .select({
        categoryId: transactions.categoryId,
        spent: sql<number>`COALESCE(SUM(ABS(${transactions.amount})), 0)`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.budgetId, budgetId),
          sql`${transactions.amount} < 0`,
          sql`${transactions.date} >= ${period.start.toISOString().slice(0, 23)}`,
          sql`${transactions.date} <= ${period.end.toISOString().slice(0, 23)}`,
        ),
      )
      .groupBy(transactions.categoryId)

    const spentMap = new Map(spentRows.map((r) => [r.categoryId, Number(r.spent)]))

    return limits.map((l) => ({
      budgetId: l.budgetId,
      categoryId: l.categoryId,
      allocatedAmount: l.allocatedAmount,
      categoryName: l.categoryName ?? undefined,
      categoryColor: l.categoryColor ?? undefined,
      spent: spentMap.get(l.categoryId) ?? 0,
    }))
  })

export const upsertBudgetCategoryLimitFn = createServerFn({ method: 'POST' })
  .inputValidator(upsertBudgetCategoryLimitSchema)
  .handler(async ({ data }) => {
    await requireCurrentAppUser()
    const db = await loadDb()

    // Validate: sum of limits must not exceed budget target
    const [budgetRow] = await db
      .select({ targetAmount: budgets.targetAmount })
      .from(budgets)
      .where(eq(budgets.id, data.budgetId))
      .limit(1)
    if (budgetRow?.targetAmount !== null && budgetRow?.targetAmount !== undefined) {
      const [{ currentTotal }] = await db
        .select({
          currentTotal: sql<number>`COALESCE(SUM(${budgetCategoryLimits.allocatedAmount}), 0)`,
        })
        .from(budgetCategoryLimits)
        .where(
          and(
            eq(budgetCategoryLimits.budgetId, data.budgetId),
            sql`${budgetCategoryLimits.categoryId} != ${data.categoryId}`,
          ),
        )

      if (Number(currentTotal) + data.allocatedAmount > budgetRow.targetAmount) {
        throw new Error(
          `Category limit would exceed budget target. Available: ${budgetRow.targetAmount - Number(currentTotal)} cents.`,
        )
      }
    }

    await db
      .insert(budgetCategoryLimits)
      .values({
        budgetId: data.budgetId,
        categoryId: data.categoryId,
        allocatedAmount: data.allocatedAmount,
      })
      .onConflictDoUpdate({
        target: [budgetCategoryLimits.budgetId, budgetCategoryLimits.categoryId],
        set: { allocatedAmount: data.allocatedAmount },
      })

    return { success: true }
  })

export const deleteBudgetCategoryLimitFn = createServerFn({ method: 'POST' })
  .inputValidator(deleteBudgetCategoryLimitSchema)
  .handler(async ({ data }) => {
    await requireCurrentAppUser()
    const db = await loadDb()

    await db
      .delete(budgetCategoryLimits)
      .where(
        and(
          eq(budgetCategoryLimits.budgetId, data.budgetId),
          eq(budgetCategoryLimits.categoryId, data.categoryId),
        ),
      )

    return { success: true }
  })
