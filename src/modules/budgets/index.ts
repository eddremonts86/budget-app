// Public barrel — only export what other modules should consume
export { BudgetsPage } from './components/BudgetsPage'
export { BudgetDetailPage } from './components/BudgetDetailPage'
export { budgetsModule } from './manifest'
export type {
  Budget,
  BudgetMember,
  BudgetCategoryLimit,
  BudgetRecurrenceRule,
  BudgetHealthSummary,
  BudgetAlert,
  BudgetScope,
  BudgetStatus,
  BudgetPeriodType,
  BudgetMemberRole,
  BudgetHealthStatus,
} from './model/types'
export { useBudgets, useBudget, useMyBudgetsDashboard } from './api/budgets.queries'
