import { createFileRoute } from '@tanstack/react-router'
import { DashboardPage } from '@/features/Dashboard/components/DashboardPage'

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
})
