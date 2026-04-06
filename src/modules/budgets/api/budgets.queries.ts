import { i18n } from '@/shared/lib/i18n'
import { useTQuery, useTQMutation } from '@/shared/lib/query'
import type { CreateBudgetInput, UpdateBudgetInput } from '../model/schema'
import type { Budget, BudgetDashboardData, BudgetHealthSummary } from '../model/types'
import {
  getBudgetsFn,
  getBudgetByIdFn,
  createBudgetFn,
  updateBudgetFn,
  deleteBudgetFn,
  getMyBudgetsDashboardFn,
  getBudgetHealthFn,
} from './budgets.fn'

export const budgetKeys = {
  all: ['budgets'] as const,
  lists: () => [...budgetKeys.all, 'list'] as const,
  list: (filters?: object) => [...budgetKeys.lists(), filters] as const,
  detail: (id: string) => [...budgetKeys.all, 'detail', id] as const,
  health: (id: string) => [...budgetKeys.all, 'health', id] as const,
  dashboard: () => [...budgetKeys.all, 'dashboard'] as const,
  members: (budgetId: string) => [...budgetKeys.all, 'members', budgetId] as const,
  limits: (budgetId: string) => [...budgetKeys.all, 'limits', budgetId] as const,
  recurrences: (budgetId: string) => [...budgetKeys.all, 'recurrences', budgetId] as const,
  analytics: (budgetId: string) => [...budgetKeys.all, 'analytics', budgetId] as const,
  spendingByCategory: (budgetId: string) =>
    [...budgetKeys.all, 'spending-by-category', budgetId] as const,
  monthlyTrend: (budgetId: string, months: number) =>
    [...budgetKeys.all, 'monthly-trend', budgetId, months] as const,
  memberSpending: (budgetId: string) => [...budgetKeys.all, 'member-spending', budgetId] as const,
}

export function useBudgets(filters?: { scope?: string; status?: string }) {
  return useTQuery<(Budget & { health: BudgetHealthSummary })[]>(
    budgetKeys.list(filters),
    () =>
      getBudgetsFn({
        data: filters as
          | {
              scope?: 'personal' | 'project' | 'department' | 'company'
              status?: 'active' | 'closed' | 'archived'
            }
          | undefined,
      }),
    { cache: 'realtime' },
  )
}

export function useBudget(id: string) {
  return useTQuery(budgetKeys.detail(id), () => getBudgetByIdFn({ data: id }), {
    cache: 'realtime',
    enabled: !!id,
  })
}

export function useBudgetHealth(id: string) {
  return useTQuery<BudgetHealthSummary | null>(
    budgetKeys.health(id),
    () => getBudgetHealthFn({ data: id }),
    { cache: 'realtime', enabled: !!id },
  )
}

export function useMyBudgetsDashboard() {
  return useTQuery<BudgetDashboardData>(budgetKeys.dashboard(), () => getMyBudgetsDashboardFn(), {
    cache: 'realtime',
  })
}

export function useCreateBudget() {
  return useTQMutation(
    ['budgets', 'create'],
    (data: CreateBudgetInput) => createBudgetFn({ data }),
    {
      invalidateKeys: [budgetKeys.lists(), budgetKeys.dashboard()],
      successMessage: i18n.t('budgets.messages.created'),
    },
  )
}

export function useUpdateBudget() {
  return useTQMutation(
    ['budgets', 'update'],
    (data: UpdateBudgetInput) => updateBudgetFn({ data }),
    {
      invalidateKeys: [budgetKeys.all],
      successMessage: i18n.t('budgets.messages.updated'),
    },
  )
}

export function useDeleteBudget() {
  return useTQMutation(['budgets', 'delete'], (id: string) => deleteBudgetFn({ data: id }), {
    invalidateKeys: [budgetKeys.lists(), budgetKeys.dashboard()],
    successMessage: i18n.t('budgets.messages.deleted'),
  })
}
