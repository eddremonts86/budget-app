import { createServerFn } from '@tanstack/react-start'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { requireCurrentAppUser } from '@/modules/users/api/current-user.server'
import { budgetMembers, budgetRecurrenceRules, budgets, users } from '@/shared/lib/db/schema'
import {
  createBudgetMemberSchema,
  updateBudgetMemberRoleSchema,
  removeBudgetMemberSchema,
} from '../model/schema'
import type { BudgetMember } from '../model/types'

async function loadDb() {
  const { getDb } = await import('@/shared/lib/db')
  return getDb()
}

export const getBudgetMembersFn = createServerFn({ method: 'GET' })
  .inputValidator(z.string())
  .handler(async ({ data: budgetId }): Promise<BudgetMember[]> => {
    const db = await loadDb()

    const rows = await db
      .select({
        budgetId: budgetMembers.budgetId,
        userId: budgetMembers.userId,
        role: budgetMembers.role,
        joinedAt: budgetMembers.joinedAt,
        userName: users.name,
        userEmail: users.email,
        userAvatar: users.avatar,
      })
      .from(budgetMembers)
      .leftJoin(users, eq(budgetMembers.userId, users.id))
      .where(eq(budgetMembers.budgetId, budgetId))

    return rows.map((r) => ({
      ...r,
      joinedAt: r.joinedAt.toISOString(),
    }))
  })

export const addBudgetMemberFn = createServerFn({ method: 'POST' })
  .inputValidator(createBudgetMemberSchema)
  .handler(async ({ data }) => {
    const user = await requireCurrentAppUser()
    const db = await loadDb()

    // Verify requester is owner or admin
    const [budgetRow] = await db
      .select({ ownerId: budgets.ownerId })
      .from(budgets)
      .where(eq(budgets.id, data.budgetId))
      .limit(1)
    const isOwner = budgetRow?.ownerId === user.id
    if (!isOwner) {
      const [adminCheck] = await db
        .select({ role: budgetMembers.role })
        .from(budgetMembers)
        .where(
          and(
            eq(budgetMembers.budgetId, data.budgetId),
            eq(budgetMembers.userId, user.id),
            eq(budgetMembers.role, 'admin'),
          ),
        )
        .limit(1)
      if (!adminCheck) throw new Error('Only admins or owners can add members')
    }

    await db
      .insert(budgetMembers)
      .values({
        budgetId: data.budgetId,
        userId: data.userId,
        role: data.role,
        joinedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [budgetMembers.budgetId, budgetMembers.userId],
        set: { role: data.role },
      })

    return { success: true }
  })

export const updateBudgetMemberRoleFn = createServerFn({ method: 'POST' })
  .inputValidator(updateBudgetMemberRoleSchema)
  .handler(async ({ data }) => {
    const user = await requireCurrentAppUser()
    const db = await loadDb()

    const [adminCheck] = await db
      .select({ role: budgetMembers.role })
      .from(budgetMembers)
      .where(
        and(
          eq(budgetMembers.budgetId, data.budgetId),
          eq(budgetMembers.userId, user.id),
          eq(budgetMembers.role, 'admin'),
        ),
      )
      .limit(1)
    if (!adminCheck) throw new Error('Only admins can change member roles')

    await db
      .update(budgetMembers)
      .set({ role: data.role })
      .where(and(eq(budgetMembers.budgetId, data.budgetId), eq(budgetMembers.userId, data.userId)))

    return { success: true }
  })

export const removeBudgetMemberFn = createServerFn({ method: 'POST' })
  .inputValidator(removeBudgetMemberSchema)
  .handler(async ({ data }) => {
    const user = await requireCurrentAppUser()
    const db = await loadDb()

    const [adminCheck] = await db
      .select({ role: budgetMembers.role })
      .from(budgetMembers)
      .where(
        and(
          eq(budgetMembers.budgetId, data.budgetId),
          eq(budgetMembers.userId, user.id),
          eq(budgetMembers.role, 'admin'),
        ),
      )
      .limit(1)
    if (!adminCheck) throw new Error('Only admins can remove members')

    // Pause that user's recurrence rules in this budget
    await db.transaction(async (tx) => {
      await tx
        .update(budgetRecurrenceRules)
        .set({ status: 'paused', pausedReason: 'member-removed' })
        .where(
          and(
            eq(budgetRecurrenceRules.budgetId, data.budgetId),
            eq(budgetRecurrenceRules.userId, data.userId),
            eq(budgetRecurrenceRules.status, 'active'),
          ),
        )

      await tx
        .delete(budgetMembers)
        .where(
          and(eq(budgetMembers.budgetId, data.budgetId), eq(budgetMembers.userId, data.userId)),
        )
    })

    return { success: true }
  })
