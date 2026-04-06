import { createFileRoute } from '@tanstack/react-router'
import { BudgetsPage } from '@/modules/budgets'

export const Route = createFileRoute('/_dashboard/dashboard/budgets/')({
  component: BudgetsPage,
})
