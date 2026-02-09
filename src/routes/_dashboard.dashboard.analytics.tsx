import { createFileRoute } from '@tanstack/react-router'
import { AnalyticsPage } from '@/features/Analytics/components/AnalyticsPage'

export const Route = createFileRoute('/_dashboard/dashboard/analytics')({
  component: AnalyticsPage,
})
