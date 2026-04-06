import { i18n } from '@/shared/lib/i18n'
import { useTQuery, useTQMutation } from '@/shared/lib/query'
import type { CreateRecurrenceRuleInput } from '../model/schema'
import type { BudgetRecurrenceRule } from '../model/types'
import {
  getBudgetRecurrenceRulesFn,
  createRecurrenceRuleFn,
  updateRecurrenceRuleFn,
  deleteRecurrenceRuleFn,
} from './budget-recurrences.fn'
import { budgetKeys } from './budgets.queries'

export function useBudgetRecurrenceRules(budgetId: string) {
  return useTQuery<BudgetRecurrenceRule[]>(
    budgetKeys.recurrences(budgetId),
    () => getBudgetRecurrenceRulesFn({ data: budgetId }),
    { cache: 'realtime', enabled: !!budgetId },
  )
}

export function useCreateRecurrenceRule(budgetId: string) {
  return useTQMutation(
    ['budgets', 'recurrences', 'create'],
    (data: CreateRecurrenceRuleInput) => createRecurrenceRuleFn({ data }),
    {
      invalidateKeys: [budgetKeys.recurrences(budgetId), budgetKeys.detail(budgetId)],
      successMessage: i18n.t('budgets.messages.recurrenceCreated'),
    },
  )
}

export function useUpdateRecurrenceRule(budgetId: string) {
  return useTQMutation(
    ['budgets', 'recurrences', 'update'],
    (data: {
      id: string
      status?: 'active' | 'paused' | 'completed'
      description?: string | null
      amount?: number
      pausedReason?: string | null
    }) => updateRecurrenceRuleFn({ data }),
    {
      invalidateKeys: [budgetKeys.recurrences(budgetId)],
    },
  )
}

export function useDeleteRecurrenceRule(budgetId: string) {
  return useTQMutation(
    ['budgets', 'recurrences', 'delete'],
    (id: string) => deleteRecurrenceRuleFn({ data: id }),
    {
      invalidateKeys: [budgetKeys.recurrences(budgetId)],
      successMessage: i18n.t('budgets.messages.recurrenceDeleted'),
    },
  )
}
