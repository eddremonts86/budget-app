import { createServerFn } from '@tanstack/react-start'
import { and, desc, eq, isNull, notLike, or, sql } from 'drizzle-orm'
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

    const [budgetRow] = await db
      .select({ periodType: budgets.periodType, startDate: budgets.startDate })
      .from(budgets)
      .where(eq(budgets.id, budgetId))
      .limit(1)
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

    const [budgetRow] = await db
      .select({ periodType: budgets.periodType, startDate: budgets.startDate })
      .from(budgets)
      .where(eq(budgets.id, budgetId))
      .limit(1)
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

// --------------------------------------------------------------------------
// Annual report — rows = categories, columns = months
// --------------------------------------------------------------------------
export const getBudgetAnnualReportFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ budgetId: z.string(), year: z.number().int().min(2000).max(2100) }))
  .handler(async ({ data }) => {
    await requireCurrentAppUser()
    const db = await loadDb()

    const startDate = new Date(Date.UTC(data.year, 0, 1))
    const endDate = new Date(Date.UTC(data.year, 11, 31, 23, 59, 59))

    const rows = await db
      .select({
        month: sql<string>`TO_CHAR(${transactions.date}, 'YYYY-MM')`,
        categoryId: transactions.categoryId,
        categoryName: categories.name,
        categoryColor: categories.color,
        expenses: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.amount} < 0 THEN ABS(${transactions.amount}) ELSE 0 END), 0)`,
        income: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.amount} > 0 THEN ${transactions.amount} ELSE 0 END), 0)`,
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(
        and(
          eq(transactions.budgetId, data.budgetId),
          sql`${transactions.date} >= ${startDate.toISOString().slice(0, 23)}`,
          sql`${transactions.date} <= ${endDate.toISOString().slice(0, 23)}`,
        ),
      )
      .groupBy(
        sql`TO_CHAR(${transactions.date}, 'YYYY-MM')`,
        transactions.categoryId,
        categories.name,
        categories.color,
      )
      .orderBy(sql`TO_CHAR(${transactions.date}, 'YYYY-MM')`)

    // All 12 months for the requested year
    const months = Array.from(
      { length: 12 },
      (_, i) => `${data.year}-${String(i + 1).padStart(2, '0')}`,
    )

    // Build per-category maps
    const catMap = new Map<
      string,
      {
        id: string | null
        name: string
        color: string
        expenses: Record<string, number>
        income: Record<string, number>
      }
    >()

    const summaryIncome: Record<string, number> = {}
    const summaryExpenses: Record<string, number> = {}

    for (const row of rows) {
      const key = row.categoryId ?? '__uncategorized__'
      if (!catMap.has(key)) {
        catMap.set(key, {
          id: row.categoryId,
          name: row.categoryName ?? 'Uncategorized',
          color: row.categoryColor ?? '#6b7280',
          expenses: {},
          income: {},
        })
      }
      const cat = catMap.get(key)!
      const exp = Number(row.expenses)
      const inc = Number(row.income)
      cat.expenses[row.month] = (cat.expenses[row.month] ?? 0) + exp
      cat.income[row.month] = (cat.income[row.month] ?? 0) + inc
      summaryIncome[row.month] = (summaryIncome[row.month] ?? 0) + inc
      summaryExpenses[row.month] = (summaryExpenses[row.month] ?? 0) + exp
    }

    const categoryRows = Array.from(catMap.values())
      .map((cat) => ({
        id: cat.id,
        name: cat.name,
        color: cat.color,
        expenses: cat.expenses,
        income: cat.income,
        totalExpenses: Object.values(cat.expenses).reduce((a, b) => a + b, 0),
        totalIncome: Object.values(cat.income).reduce((a, b) => a + b, 0),
      }))
      .sort((a, b) => b.totalExpenses - a.totalExpenses)

    const summaryBalance: Record<string, number> = {}
    for (const m of months) {
      summaryBalance[m] = (summaryIncome[m] ?? 0) - (summaryExpenses[m] ?? 0)
    }

    const totalIncome = Object.values(summaryIncome).reduce((a, b) => a + b, 0)
    const totalExpenses = Object.values(summaryExpenses).reduce((a, b) => a + b, 0)

    // ------------------------------------------------------------------
    // Direct transactions — non-[Auto] entries, grouped by description+month
    // ------------------------------------------------------------------
    const directRows = await db
      .select({
        month: sql<string>`TO_CHAR(${transactions.date}, 'YYYY-MM')`,
        description: transactions.description,
        categoryId: transactions.categoryId,
        categoryName: categories.name,
        categoryColor: categories.color,
        expenses: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.amount} < 0 THEN ABS(${transactions.amount}) ELSE 0 END), 0)`,
        income: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.amount} > 0 THEN ${transactions.amount} ELSE 0 END), 0)`,
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(
        and(
          eq(transactions.budgetId, data.budgetId),
          sql`${transactions.date} >= ${startDate.toISOString().slice(0, 23)}`,
          sql`${transactions.date} <= ${endDate.toISOString().slice(0, 23)}`,
          or(isNull(transactions.description), notLike(transactions.description, '[Auto]%')),
        ),
      )
      .groupBy(
        sql`TO_CHAR(${transactions.date}, 'YYYY-MM')`,
        transactions.description,
        transactions.categoryId,
        categories.name,
        categories.color,
      )
      .orderBy(sql`TO_CHAR(${transactions.date}, 'YYYY-MM')`, transactions.description)

    // Aggregate direct rows into per-description entries
    const directMap = new Map<
      string,
      {
        description: string
        categoryName: string | null
        categoryColor: string | null
        expenses: Record<string, number>
        income: Record<string, number>
      }
    >()
    for (const row of directRows) {
      const key = row.description ?? '__no-desc__'
      if (!directMap.has(key)) {
        directMap.set(key, {
          description: row.description ?? '—',
          categoryName: row.categoryName,
          categoryColor: row.categoryColor,
          expenses: {},
          income: {},
        })
      }
      const entry = directMap.get(key)!
      const exp = Number(row.expenses)
      const inc = Number(row.income)
      if (exp > 0) entry.expenses[row.month] = (entry.expenses[row.month] ?? 0) + exp
      if (inc > 0) entry.income[row.month] = (entry.income[row.month] ?? 0) + inc
    }

    const directTransactions = Array.from(directMap.values()).map((e) => ({
      description: e.description,
      categoryName: e.categoryName,
      categoryColor: e.categoryColor,
      expenses: e.expenses,
      income: e.income,
      totalExpenses: Object.values(e.expenses).reduce((a, b) => a + b, 0),
      totalIncome: Object.values(e.income).reduce((a, b) => a + b, 0),
    }))

    return {
      months,
      categories: categoryRows,
      directTransactions,
      summary: {
        income: summaryIncome,
        expenses: summaryExpenses,
        balance: summaryBalance,
        totalIncome,
        totalExpenses,
        totalBalance: totalIncome - totalExpenses,
      },
    }
  })
