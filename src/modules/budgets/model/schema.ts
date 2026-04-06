import { z } from 'zod'

export const createBudgetSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional().nullable(),
  scope: z.enum(['personal', 'project', 'department', 'company']),
  projectId: z.string().optional().nullable(),
  departmentId: z.string().optional().nullable(),
  targetAmount: z.number().int().min(0).max(99_999_999_99).optional().nullable(),
  currency: z.string().length(3).default('USD'),
  periodType: z.enum(['monthly', 'quarterly', 'semiannual', 'annual', 'one_time']),
  startDate: z.string(),
  endDate: z.string().optional().nullable(),
})

export const updateBudgetSchema = createBudgetSchema.partial().extend({
  id: z.string().optional(),
  name: z.string().min(1).max(100).optional(),
  status: z.enum(['active', 'closed', 'archived']).optional(),
  isActive: z.boolean().optional(),
})

export const createBudgetMemberSchema = z.object({
  budgetId: z.string(),
  userId: z.string(),
  role: z.enum(['admin', 'contributor', 'viewer']).default('contributor'),
})

export const updateBudgetMemberRoleSchema = z.object({
  budgetId: z.string(),
  userId: z.string(),
  role: z.enum(['admin', 'contributor', 'viewer']),
})

export const removeBudgetMemberSchema = z.object({
  budgetId: z.string(),
  userId: z.string(),
})

export const upsertBudgetCategoryLimitSchema = z.object({
  budgetId: z.string(),
  categoryId: z.string(),
  allocatedAmount: z.number().int().min(0).max(99_999_999_99),
})

export const deleteBudgetCategoryLimitSchema = z.object({
  budgetId: z.string(),
  categoryId: z.string(),
})

export const createRecurrenceRuleSchema = z.object({
  budgetId: z.string(),
  categoryId: z.string().optional().nullable(),
  amount: z.number().int().min(-99_999_999).max(99_999_999),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'semiannual', 'annual']),
  interval: z.number().int().min(1).max(12).default(1),
  description: z.string().max(200).optional().nullable(),
  startDate: z.string(),
})

export const updateRecurrenceRuleSchema = z.object({
  id: z.string(),
  status: z.enum(['active', 'paused', 'completed']).optional(),
  description: z.string().max(200).optional().nullable(),
  amount: z.number().int().optional(),
})

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>
export type CreateBudgetMemberInput = z.infer<typeof createBudgetMemberSchema>
export type UpsertBudgetCategoryLimitInput = z.infer<typeof upsertBudgetCategoryLimitSchema>
export type CreateRecurrenceRuleInput = z.infer<typeof createRecurrenceRuleSchema>
