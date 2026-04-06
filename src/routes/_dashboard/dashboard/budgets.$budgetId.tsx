import { createFileRoute } from '@tanstack/react-router'
import { BudgetDetailPage } from '@/modules/budgets'

export const Route = createFileRoute('/_dashboard/dashboard/budgets/$budgetId')({
  component: BudgetDetailPage,
})
