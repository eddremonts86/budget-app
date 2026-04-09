import { createServerFn } from '@tanstack/react-start'
import { and, eq, sql, desc } from 'drizzle-orm'
import { z } from 'zod'
import { requireCurrentAppUser } from '@/modules/users/api/current-user.server'
import { budgetRecurrenceRules, transactions, budgets, categories } from '@/shared/lib/db/schema'
import { computeNextDate } from '../model/period-utils'
import { createRecurrenceRuleSchema, updateRecurrenceRuleSchema } from '../model/schema'
import type { BudgetRecurrenceRule } from '../model/types'

const MAX_CATCHUP_ITERATIONS = 24

async function loadDb() {
  const { getDb } = await import('@/shared/lib/db')
  return getDb()
}

function serializeRule(
  row: typeof budgetRecurrenceRules.$inferSelect & {
    categoryName?: string | null
    categoryColor?: string | null
  },
): BudgetRecurrenceRule {
  return {
    id: row.id,
    budgetId: row.budgetId,
    categoryId: row.categoryId,
    userId: row.userId,
    amount: row.amount,
    frequency: row.frequency,
    interval: row.interval,
    description: row.description,
    startDate: row.startDate.toISOString(),
    nextDate: row.nextDate.toISOString(),
    lastRunAt: row.lastRunAt ? row.lastRunAt.toISOString() : null,
    status: row.status,
    pausedReason: row.pausedReason,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    categoryName: row.categoryName ?? undefined,
    categoryColor: row.categoryColor ?? undefined,
  }
}

export const getBudgetRecurrenceRulesFn = createServerFn({ method: 'GET' })
  .inputValidator(z.string())
  .handler(async ({ data: budgetId }): Promise<BudgetRecurrenceRule[]> => {
    await requireCurrentAppUser()
    const db = await loadDb()

    const rows = await db
      .select({
        id: budgetRecurrenceRules.id,
        budgetId: budgetRecurrenceRules.budgetId,
        categoryId: budgetRecurrenceRules.categoryId,
        userId: budgetRecurrenceRules.userId,
        amount: budgetRecurrenceRules.amount,
        frequency: budgetRecurrenceRules.frequency,
        interval: budgetRecurrenceRules.interval,
        description: budgetRecurrenceRules.description,
        startDate: budgetRecurrenceRules.startDate,
        nextDate: budgetRecurrenceRules.nextDate,
        lastRunAt: budgetRecurrenceRules.lastRunAt,
        status: budgetRecurrenceRules.status,
        pausedReason: budgetRecurrenceRules.pausedReason,
        createdAt: budgetRecurrenceRules.createdAt,
        updatedAt: budgetRecurrenceRules.updatedAt,
        categoryName: categories.name,
        categoryColor: categories.color,
      })
      .from(budgetRecurrenceRules)
      .leftJoin(categories, eq(budgetRecurrenceRules.categoryId, categories.id))
      .where(eq(budgetRecurrenceRules.budgetId, budgetId))
      .orderBy(desc(budgetRecurrenceRules.createdAt))

    return rows.map(serializeRule)
  })

export const createRecurrenceRuleFn = createServerFn({ method: 'POST' })
  .inputValidator(createRecurrenceRuleSchema)
  .handler(async ({ data }) => {
    const user = await requireCurrentAppUser()
    const db = await loadDb()

    const id = crypto.randomUUID()
    const startDate = new Date(data.startDate)

    const [rule] = await db
      .insert(budgetRecurrenceRules)
      .values({
        id,
        budgetId: data.budgetId,
        categoryId: data.categoryId ?? null,
        userId: user.id,
        amount: data.amount,
        frequency: data.frequency,
        interval: data.interval ?? 1,
        description: data.description ?? null,
        startDate,
        nextDate: startDate,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()

    return serializeRule(rule)
  })

export const updateRecurrenceRuleFn = createServerFn({ method: 'POST' })
  .inputValidator(updateRecurrenceRuleSchema)
  .handler(async ({ data }) => {
    await requireCurrentAppUser()
    const db = await loadDb()

    const { id, ...updateData } = data

    const [updated] = await db
      .update(budgetRecurrenceRules)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(budgetRecurrenceRules.id, id))
      .returning()

    return serializeRule(updated)
  })

export const deleteRecurrenceRuleFn = createServerFn({ method: 'POST' })
  .inputValidator(z.string())
  .handler(async ({ data: id }) => {
    await requireCurrentAppUser()
    const db = await loadDb()

    await db.delete(budgetRecurrenceRules).where(eq(budgetRecurrenceRules.id, id))
    return { success: true }
  })

/**
 * Process due recurrence rules for a specific budget (called lazily on page load).
 * Uses catch-up limit to prevent explosion.
 */
export async function processRecurrenceRulesForBudget(budgetId: string) {
  const { getDb } = await import('@/shared/lib/db')
  const db = getDb()

  const now = new Date()

  const dueRules = await db
    .select()
    .from(budgetRecurrenceRules)
    .where(
      and(
        eq(budgetRecurrenceRules.budgetId, budgetId),
        eq(budgetRecurrenceRules.status, 'active'),
        sql`${budgetRecurrenceRules.nextDate} <= ${now.toISOString().slice(0, 23)}`,
      ),
    )

  let processed = 0

  for (const rule of dueRules) {
    await db.transaction(async (tx) => {
      let currentDate = rule.nextDate
      let iterations = 0

      while (currentDate <= now && iterations < MAX_CATCHUP_ITERATIONS) {
        await tx.insert(transactions).values({
          id: crypto.randomUUID(),
          budgetId: rule.budgetId,
          categoryId: rule.categoryId,
          userId: rule.userId,
          amount: rule.amount,
          date: currentDate,
          description: `[Auto] ${rule.description ?? 'Recurring transaction'}`,
          status: 'Approved',
          isPrivate: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        })

        currentDate = computeNextDate(rule.frequency, rule.interval, currentDate)
        iterations++
        processed++
      }

      if (iterations >= MAX_CATCHUP_ITERATIONS && currentDate <= now) {
        console.warn(`[Recurrence] Rule ${rule.id} hit catch-up limit. Pausing.`)
        await tx
          .update(budgetRecurrenceRules)
          .set({ status: 'paused', pausedReason: 'catch-up-limit', updatedAt: new Date() })
          .where(eq(budgetRecurrenceRules.id, rule.id))
      } else {
        await tx
          .update(budgetRecurrenceRules)
          .set({ nextDate: currentDate, lastRunAt: new Date(), updatedAt: new Date() })
          .where(eq(budgetRecurrenceRules.id, rule.id))
      }
    })
  }

  return { processed }
}

/**
 * Process ALL due recurrence rules across all budgets (for external cron).
 */
export const processAllRecurrencesFn = createServerFn({ method: 'POST' }).handler(async () => {
  const { getDb } = await import('@/shared/lib/db')
  const db = getDb()

  const activeBudgets = await db
    .select({ id: budgets.id })
    .from(budgets)
    .where(eq(budgets.status, 'active'))

  let totalProcessed = 0
  for (const budget of activeBudgets) {
    const result = await processRecurrenceRulesForBudget(budget.id)
    totalProcessed += result.processed
  }

  return { processed: totalProcessed }
})
