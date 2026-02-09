import { createFileRoute } from '@tanstack/react-router'
import { DashboardLayout } from '@/shared/layouts/DashboardLayout/DashboardLayout'

export const Route = createFileRoute('/_dashboard')({
  component: DashboardLayout,
})
