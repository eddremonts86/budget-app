import { i18n } from '@/shared/lib/i18n'
import { useTQuery, useTQMutation } from '@/shared/lib/query'
import type { CreateBudgetMemberInput } from '../model/schema'
import type { BudgetMember } from '../model/types'
import {
  getBudgetMembersFn,
  addBudgetMemberFn,
  updateBudgetMemberRoleFn,
  removeBudgetMemberFn,
} from './budget-members.fn'
import { budgetKeys } from './budgets.queries'

export function useBudgetMembers(budgetId: string) {
  return useTQuery<BudgetMember[]>(
    budgetKeys.members(budgetId),
    () => getBudgetMembersFn({ data: budgetId }),
    { cache: 'realtime', enabled: !!budgetId },
  )
}

export function useAddBudgetMember(budgetId: string) {
  return useTQMutation(
    ['budgets', 'members', 'add'],
    (data: CreateBudgetMemberInput) => addBudgetMemberFn({ data }),
    {
      invalidateKeys: [budgetKeys.members(budgetId)],
      successMessage: i18n.t('budgets.messages.memberAdded'),
    },
  )
}

export function useUpdateBudgetMemberRole(budgetId: string) {
  return useTQMutation(
    ['budgets', 'members', 'role'],
    (data: { budgetId: string; userId: string; role: 'admin' | 'contributor' | 'viewer' }) =>
      updateBudgetMemberRoleFn({ data }),
    {
      invalidateKeys: [budgetKeys.members(budgetId)],
    },
  )
}

export function useRemoveBudgetMember(budgetId: string) {
  return useTQMutation(
    ['budgets', 'members', 'remove'],
    (data: { budgetId: string; userId: string }) => removeBudgetMemberFn({ data }),
    {
      invalidateKeys: [budgetKeys.members(budgetId)],
      successMessage: i18n.t('budgets.messages.memberRemoved'),
    },
  )
}
