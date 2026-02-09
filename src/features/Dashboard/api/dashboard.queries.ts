import { useTQuery } from '@/shared/lib/query'
import { dashboardApi } from './dashboard.api'

export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
  transactions: () => [...dashboardKeys.all, 'transactions'] as const,
}

export const useDashboardStats = () => {
  return useTQuery(dashboardKeys.stats(), dashboardApi.getStats)
}

export const useRecentTransactions = () => {
  return useTQuery(dashboardKeys.transactions(), dashboardApi.getTransactions)
}
