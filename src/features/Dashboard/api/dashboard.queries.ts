import { useTQuery } from '@/shared/lib/query'
import { dashboardApi } from './dashboard.api'

export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
  transactions: () => [...dashboardKeys.all, 'transactions'] as const,
  upcomingTodos: () => [...dashboardKeys.all, 'upcomingTodos'] as const,
  usersWorkload: () => [...dashboardKeys.all, 'usersWorkload'] as const,
}

export const useDashboardStats = () => {
  return useTQuery(dashboardKeys.stats(), dashboardApi.getStats)
}

export const useRecentTransactions = () => {
  return useTQuery(dashboardKeys.transactions(), dashboardApi.getRecentTransactions)
}

export const useUpcomingTodos = () => {
  return useTQuery(dashboardKeys.upcomingTodos(), dashboardApi.getUpcomingTodos, {
    select: (data) => {
      // Filter tasks due in the next 7 days
      const now = new Date()
      const nextWeek = new Date()
      nextWeek.setDate(now.getDate() + 7)

      return data
        .filter((todo) => {
          if (!todo.dueDate) return false
          const dueDate = new Date(todo.dueDate)
          return dueDate >= now && dueDate <= nextWeek
        })
        .sort((a, b) => {
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
  return useTQuery(dashboardKeys.usersWorkload(), dashboardApi.getUsersWorkload)
}
