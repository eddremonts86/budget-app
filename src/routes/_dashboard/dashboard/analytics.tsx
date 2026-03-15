import { createFileRoute } from '@tanstack/react-router'
import { AnalyticsPage } from '@/modules/analytics'

export const Route = createFileRoute('/_dashboard/dashboard/analytics')({
  component: AnalyticsPage,
})
