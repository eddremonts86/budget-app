import { createServerFn } from '@tanstack/react-start'
import { desc, eq } from 'drizzle-orm'
import { z } from 'zod'
// import { db } from '@/shared/lib/db'
import { transactions } from '@/shared/lib/db/schema'
// import type { Transaction } from '../model/types'

export const transactionSchema = z.object({
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  status: z.enum(['Approved', 'Pending', 'Rejected']).default('Pending'),
  date: z.string(), // ISO string
  amount: z.number(),
  userId: z.string().optional(),
  projectId: z.string().optional(),
  assignedAdminId: z.string().optional(),
  approvedBy: z.string().optional(),
  approvedAt: z.string().optional(),
  rejectionReason: z.string().optional(),
})

export type TransactionInput = z.infer<typeof transactionSchema>

export const getTransactionsFn = createServerFn({ method: 'GET' }).handler(
  async ({ data }: { data?: { pageParam?: number; limit?: number } }) => {
    try {
      const { getDb } = await import('@/shared/lib/db')
      const db = getDb()
      const { pageParam, limit: limitParam } = data || {}
      const page = pageParam || 1
      const limit = limitParam || 10
      const offset = (page - 1) * limit

      const [items, total] = await Promise.all([
        db.select().from(transactions).limit(limit).offset(offset).orderBy(desc(transactions.date)),
        db.$count(transactions),
      ])

      const totalPages = Math.ceil(total / limit)
      const nextPage = page < totalPages ? page + 1 : undefined

      return {
        data: items.map((item) => ({
          ...item,
          customer: {
            name: item.customerName,
            email: item.customerEmail,
          },
          date: item.date.toISOString(),
          approvedAt: item.approvedAt ? item.approvedAt.toISOString() : undefined,
        })),
        nextPage,
        totalCount: total,
      }
    } catch (error) {
      console.error('Error in getTransactionsFn:', error)
      throw error
    }
  },
)

export const getTransactionByIdFn = createServerFn({ method: 'GET' }).handler(
  async ({ data: id }: { data: string | undefined }) => {
    try {
      if (!id) throw new Error('ID is required')
      const { getDb } = await import('@/shared/lib/db')
      const db = getDb()
      const result = await db.select().from(transactions).where(eq(transactions.id, id))
      if (!result.length) return null
      const item = result[0]
      return {
        ...item,
        customer: {
          name: item.customerName,
          email: item.customerEmail,
        },
        date: item.date.toISOString(),
        approvedAt: item.approvedAt ? item.approvedAt.toISOString() : undefined,
      }
    } catch (error) {
      console.error('Error in getTransactionByIdFn:', error)
      throw error
    }
  },
)

export const createTransactionFn = createServerFn({ method: 'POST' }).handler(
  async ({ data }: { data: unknown }) => {
    try {
      const { getDb } = await import('@/shared/lib/db')
      const db = getDb()
      // Manual validation
      const parsed = transactionSchema.safeParse(data)
      if (!parsed.success) {
        throw new Error(`Invalid input: ${parsed.error.message}`)
      }
      const input = parsed.data

      const [newItem] = await db
        .insert(transactions)
        .values({
          id: crypto.randomUUID(),
          customerName: input.customerName,
          customerEmail: input.customerEmail,
          status: input.status,
          date: new Date(input.date),
          amount: input.amount,
          userId: input.userId,
          projectId: input.projectId,
          assignedAdminId: input.assignedAdminId,
          approvedBy: input.approvedBy,
          approvedAt: input.approvedAt ? new Date(input.approvedAt) : null,
          rejectionReason: input.rejectionReason,
        })
        .returning()

      return {
        ...newItem,
        customer: {
          name: newItem.customerName,
          email: newItem.customerEmail,
        },
        date: newItem.date.toISOString(),
        approvedAt: newItem.approvedAt ? newItem.approvedAt.toISOString() : undefined,
      }
    } catch (error) {
      console.error('Error in createTransactionFn:', error)
      throw error
    }
  },
)

export const updateTransactionFn = createServerFn({ method: 'POST' }).handler(
  async ({ data }: { data: unknown }) => {
    try {
      const { getDb } = await import('@/shared/lib/db')
      const db = getDb()
      const { id, data: updateData } = data as {
        id: string
        data: unknown
      }

      const parsed = transactionSchema.partial().safeParse(updateData)
      if (!parsed.success) {
        throw new Error(`Invalid input: ${parsed.error.message}`)
      }
      const input = parsed.data

      // Handle specific fields if needed
      const updatePayload: Record<string, unknown> = { ...input }
      if (input.date) updatePayload.date = new Date(input.date)
      if (input.approvedAt) updatePayload.approvedAt = new Date(input.approvedAt)

      const [updatedItem] = await db
        .update(transactions)
        .set(updatePayload)
        .where(eq(transactions.id, id))
        .returning()

      return {
        ...updatedItem,
        customer: {
          name: updatedItem.customerName,
          email: updatedItem.customerEmail,
        },
        date: updatedItem.date.toISOString(),
        approvedAt: updatedItem.approvedAt ? updatedItem.approvedAt.toISOString() : undefined,
      }
    } catch (error) {
      console.error('Error in updateTransactionFn:', error)
      throw error
    }
  },
)

export const deleteTransactionFn = createServerFn({ method: 'POST' }).handler(
  async ({ data: id }: { data: string | undefined }) => {
    try {
      if (!id) throw new Error('ID is required')
      const { getDb } = await import('@/shared/lib/db')
      const db = getDb()
      await db.delete(transactions).where(eq(transactions.id, id))
      return { success: true }
    } catch (error) {
      console.error('Error in deleteTransactionFn:', error)
      throw error
    }
  },
)
