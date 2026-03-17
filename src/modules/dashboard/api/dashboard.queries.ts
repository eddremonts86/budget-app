import { useTQuery } from '@/shared/lib/query'
import {
  getDashboardStatsFn,
  getDashboardMetricFn,
  getRecentTransactionsFn,
  getUpcomingTodosFn,
  getUsersWorkloadFn,
  getExpenseDistributionFn,
} from './dashboard.fn'

const DASHBOARD_METRIC_REFRESH_INTERVAL = 20 * 1000
const DASHBOARD_ACTIVITY_REFRESH_INTERVAL = 45 * 1000
const DASHBOARD_CHART_REFRESH_INTERVAL = 90 * 1000

export interface UsersWorkloadFilters {
  projectId?: string
  teamId?: string
}

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
  upcomingTodos: () => [...dashboardKeys.all, 'upcomingTodos'] as const,
  usersWorkload: (filters?: UsersWorkloadFilters) =>
    [...dashboardKeys.all, 'usersWorkload', filters ?? {}] as const,
  expenseDistribution: () => [...dashboardKeys.all, 'expenseDistribution'] as const,
}

export const useExpenseDistribution = () => {
  return useTQuery(
    dashboardKeys.expenseDistribution(),
    () => getExpenseDistributionFn({ data: undefined }),
    {
      cache: 'realtime',
      refetchInterval: DASHBOARD_CHART_REFRESH_INTERVAL,
      refetchOnWindowFocus: true,
    },
  )
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

export const useUpcomingTodos = () => {
  return useTQuery(dashboardKeys.upcomingTodos(), () => getUpcomingTodosFn({ data: undefined }), {
    cache: 'realtime',
    refetchInterval: DASHBOARD_ACTIVITY_REFRESH_INTERVAL,
    refetchOnWindowFocus: true,
    select: (data) => {
      return data.sort((a, b) => {
        // Sort by priority first (high > medium > low)
        const priorityWeight = { high: 3, medium: 2, low: 1 }
        const pA = priorityWeight[a.priority as keyof typeof priorityWeight] || 0
        const pB = priorityWeight[b.priority as keyof typeof priorityWeight] || 0
        if (pA !== pB) return pB - pA

        // Then by date
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      })
    },
  })
}

export const useUsersWorkload = (filters?: UsersWorkloadFilters) => {
  return useTQuery(
    dashboardKeys.usersWorkload(filters),
    () => getUsersWorkloadFn({ data: filters }),
    {
      cache: 'realtime',
      refetchInterval: DASHBOARD_CHART_REFRESH_INTERVAL,
      refetchOnWindowFocus: true,
    },
  )
}
