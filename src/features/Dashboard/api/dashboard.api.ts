import { apiClient } from '@/shared/lib/api'
import type { DashboardStats, Transaction } from '../model/types'

export const dashboardApi = {
  getStats: async () => {
    const { data } = await apiClient.get<DashboardStats>('/dashboardStats')
    return data
  },
  getTransactions: async () => {
    const { data } = await apiClient.get<Transaction[]>('/recentTransactions')
    return data
  },
}
