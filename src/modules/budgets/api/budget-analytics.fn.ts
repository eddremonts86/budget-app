import { createServerFn } from '@tanstack/react-start'
import { and, desc, eq, or, sql } from 'drizzle-orm'
import { z } from 'zod'
import { requireCurrentAppUser } from '@/modules/users/api/current-user.server'
import { budgets, categories, transactions, users } from '@/shared/lib/db/schema'
import { getCurrentPeriodBounds } from '../model/period-utils'

async function loadDb() {
  const { getDb } = await import('@/shared/lib/db')
  return getDb()
}

export const getBudgetSpendingByCategoryFn = createServerFn({ method: 'GET' })
  .inputValidator(z.string())
  .handler(async ({ data: budgetId }) => {
    const user = await requireCurrentAppUser()
    const db = await loadDb()

    const [budgetRow] = await db.select().from(budgets).where(eq(budgets.id, budgetId))
    if (!budgetRow) return []

    const period = getCurrentPeriodBounds(budgetRow.periodType, budgetRow.startDate)

    const rows = await db
      .select({
        categoryId: transactions.categoryId,
        categoryName: categories.name,
        categoryColor: categories.color,
        spent: sql<number>`COALESCE(SUM(ABS(${transactions.amount})), 0)`,
        income: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.amount} > 0 THEN ${transactions.amount} ELSE 0 END), 0)`,
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(
        and(
          eq(transactions.budgetId, budgetId),
          sql`${transactions.date} >= ${period.start.toISOString().slice(0, 23)}`,
          sql`${transactions.date} <= ${period.end.toISOString().slice(0, 23)}`,
          or(eq(transactions.isPrivate, false), eq(transactions.userId, user.id)),
        ),
      )
      .groupBy(transactions.categoryId, categories.name, categories.color)
      .orderBy(desc(sql`SUM(ABS(${transactions.amount}))`))

    return rows.map((r) => ({
      categoryId: r.categoryId,
      categoryName: r.categoryName ?? 'Uncategorized',
      categoryColor: r.categoryColor ?? '#6b7280',
      spent: Number(r.spent),
      income: Number(r.income),
    }))
  })

export const getBudgetMonthlyTrendFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ budgetId: z.string(), months: z.number().min(1).max(24).default(6) }))
  .handler(async ({ data }) => {
    await requireCurrentAppUser()
    const db = await loadDb()

    const now = new Date()
    const startDate = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - data.months + 1, 1),
    )

    const rows = await db
      .select({
        month: sql<string>`TO_CHAR(${transactions.date}, 'YYYY-MM')`,
        income: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.amount} > 0 THEN ${transactions.amount} ELSE 0 END), 0)`,
        expenses: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.amount} < 0 THEN ABS(${transactions.amount}) ELSE 0 END), 0)`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.budgetId, data.budgetId),
          sql`${transactions.date} >= ${startDate.toISOString().slice(0, 23)}`,
        ),
      )
      .groupBy(sql`TO_CHAR(${transactions.date}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${transactions.date}, 'YYYY-MM')`)

    return rows.map((r) => ({
      month: r.month,
      income: Number(r.income),
      expenses: Number(r.expenses),
    }))
  })

export const getBudgetMemberSpendingFn = createServerFn({ method: 'GET' })
  .inputValidator(z.string())
  .handler(async ({ data: budgetId }) => {
    const user = await requireCurrentAppUser()
    const db = await loadDb()

    const [budgetRow] = await db.select().from(budgets).where(eq(budgets.id, budgetId))
    if (!budgetRow) return []

    const period = getCurrentPeriodBounds(budgetRow.periodType, budgetRow.startDate)

    const rows = await db
      .select({
        userId: transactions.userId,
        userName: users.name,
        spent: sql<number>`COALESCE(SUM(ABS(${transactions.amount})), 0)`,
        income: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.amount} > 0 THEN ${transactions.amount} ELSE 0 END), 0)`,
        txCount: sql<number>`COUNT(*)`,
      })
      .from(transactions)
      .leftJoin(users, eq(transactions.userId, users.id))
      .where(
        and(
          eq(transactions.budgetId, budgetId),
          sql`${transactions.date} >= ${period.start.toISOString().slice(0, 23)}`,
          sql`${transactions.date} <= ${period.end.toISOString().slice(0, 23)}`,
          or(eq(transactions.isPrivate, false), eq(transactions.userId, user.id)),
        ),
      )
      .groupBy(transactions.userId, users.name)
      .orderBy(desc(sql`SUM(ABS(${transactions.amount}))`))

    return rows.map((r) => ({
      userId: r.userId,
      userName: r.userName ?? 'Unknown',
      spent: Number(r.spent),
      income: Number(r.income),
      txCount: Number(r.txCount),
    }))
  })
