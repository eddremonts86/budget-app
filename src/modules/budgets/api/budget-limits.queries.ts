import { i18n } from '@/shared/lib/i18n'
import { useTQuery, useTQMutation } from '@/shared/lib/query'
import type { BudgetCategoryLimit } from '../model/types'
import type { UpsertBudgetCategoryLimitInput } from '../model/schema'
import {
  getBudgetCategoryLimitsFn,
  upsertBudgetCategoryLimitFn,
  deleteBudgetCategoryLimitFn,
} from './budget-limits.fn'
import { budgetKeys } from './budgets.queries'

export function useBudgetCategoryLimits(budgetId: string) {
  return useTQuery<BudgetCategoryLimit[]>(
    budgetKeys.limits(budgetId),
    () => getBudgetCategoryLimitsFn({ data: budgetId }),
    { cache: 'realtime', enabled: !!budgetId },
  )
}

export function useUpsertBudgetCategoryLimit(budgetId: string) {
  return useTQMutation(
    ['budgets', 'limits', 'upsert'],
    (data: UpsertBudgetCategoryLimitInput) => upsertBudgetCategoryLimitFn({ data }),
    {
      invalidateKeys: [budgetKeys.limits(budgetId), budgetKeys.detail(budgetId)],
      successMessage: i18n.t('budgets.messages.limitSet'),
    },
  )
}

export function useDeleteBudgetCategoryLimit(budgetId: string) {
  return useTQMutation(
    ['budgets', 'limits', 'delete'],
    (data: { budgetId: string; categoryId: string }) => deleteBudgetCategoryLimitFn({ data }),
    {
      invalidateKeys: [budgetKeys.limits(budgetId)],
    },
  )
}
