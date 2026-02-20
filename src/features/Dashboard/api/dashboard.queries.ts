import { useTQuery } from '@/shared/lib/query'
import {
  getDashboardStatsFn,
  getRecentTransactionsFn,
  getUpcomingTodosFn,
  getUsersWorkloadFn,
} from './dashboard.fn'

export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
  transactions: () => [...dashboardKeys.all, 'transactions'] as const,
  upcomingTodos: () => [...dashboardKeys.all, 'upcomingTodos'] as const,
  usersWorkload: () => [...dashboardKeys.all, 'usersWorkload'] as const,
}

export const useDashboardStats = () => {
  return useTQuery(dashboardKeys.stats(), async () => {
    console.log('useDashboardStats: calling getDashboardStatsFn')
    try {
      const result = await getDashboardStatsFn()
      console.log('useDashboardStats: result', result)
      return result
    } catch (error) {
      console.error('useDashboardStats: error', error)
      throw error
    }
  })
}

export const useRecentTransactions = () => {
  return useTQuery(dashboardKeys.transactions(), () => getRecentTransactionsFn())
}

export const useUpcomingTodos = () => {
  return useTQuery(dashboardKeys.upcomingTodos(), () => getUpcomingTodosFn(), {
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

export const useUsersWorkload = () => {
  return useTQuery(dashboardKeys.usersWorkload(), () => getUsersWorkloadFn())
}
