import { useTQuery } from '@/shared/lib/query'
import { getDashboardStatsFn, getDashboardMetricFn, getRecentTransactionsFn } from './dashboard.fn'

const DASHBOARD_METRIC_REFRESH_INTERVAL = 20 * 1000
const DASHBOARD_ACTIVITY_REFRESH_INTERVAL = 45 * 1000

export type DashboardMetricKey = 'netBalance' | 'revenue' | 'expenses' | 'activeProjects'

interface DashboardValueMetric {
  value: number
  change: number
  trend: 'up' | 'down'
  periodTotal: number
  periodDays: number
}

interface DashboardRevenueMetric extends DashboardValueMetric {
  pendingApprovalTotal: number
}

interface DashboardContextMetric {
  value: number
  change: number
  trend: 'up' | 'down'
  context: string
}

interface DashboardMetricMap {
  netBalance: DashboardValueMetric
  revenue: DashboardRevenueMetric
  expenses: DashboardValueMetric
  activeProjects: DashboardContextMetric
}

export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
  metric: (metric: DashboardMetricKey) => [...dashboardKeys.all, 'metric', metric] as const,
  transactions: () => [...dashboardKeys.all, 'transactions'] as const,
}

export const useDashboardStats = () => {
  return useTQuery(dashboardKeys.stats(), () => getDashboardStatsFn({ data: undefined }), {
    cache: 'realtime',
    refetchInterval: DASHBOARD_ACTIVITY_REFRESH_INTERVAL,
    refetchOnWindowFocus: true,
  })
}

export const useDashboardMetric = <TMetric extends DashboardMetricKey>(metric: TMetric) => {
  return useTQuery<DashboardMetricMap[TMetric]>(
    dashboardKeys.metric(metric),
    () => getDashboardMetricFn({ data: metric }) as Promise<DashboardMetricMap[TMetric]>,
    {
      cache: 'realtime',
      refetchInterval: DASHBOARD_METRIC_REFRESH_INTERVAL,
      refetchOnWindowFocus: true,
    },
  )
}

export const useRecentTransactions = () => {
  return useTQuery(dashboardKeys.transactions(), () => getRecentTransactionsFn({ data: undefined }))
}
