import { useTQuery } from '@/shared/lib/query'
import {
  getBudgetSpendingByCategoryFn,
  getBudgetMonthlyTrendFn,
  getBudgetMemberSpendingFn,
  getBudgetAnnualReportFn,
} from './budget-analytics.fn'
import { budgetKeys } from './budgets.queries'

export function useBudgetSpendingByCategory(budgetId: string) {
  return useTQuery(
    budgetKeys.spendingByCategory(budgetId),
    () => getBudgetSpendingByCategoryFn({ data: budgetId }),
    { cache: 'realtime', enabled: !!budgetId },
  )
}

export function useBudgetMonthlyTrend(budgetId: string, months = 6) {
  return useTQuery(
    budgetKeys.monthlyTrend(budgetId, months),
    () => getBudgetMonthlyTrendFn({ data: { budgetId, months } }),
    { cache: 'standard', enabled: !!budgetId },
  )
}

export function useBudgetMemberSpending(budgetId: string) {
  return useTQuery(
    budgetKeys.memberSpending(budgetId),
    () => getBudgetMemberSpendingFn({ data: budgetId }),
    { cache: 'realtime', enabled: !!budgetId },
  )
}

export function useBudgetAnnualReport(budgetId: string, year: number) {
  return useTQuery(
    budgetKeys.annualReport(budgetId, year),
    () => getBudgetAnnualReportFn({ data: { budgetId, year } }),
    { cache: 'standard', enabled: !!budgetId },
  )
}
