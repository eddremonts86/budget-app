import { createFileRoute } from '@tanstack/react-router'
import { TransactionsPage } from '@/features/Transactions/components/TransactionsPage'

export const Route = createFileRoute('/_dashboard/dashboard/transactions')({
  component: TransactionsPage,
})
