import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_dashboard/dashboard/budgets')({
  component: () => <Outlet />,
})
