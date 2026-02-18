import { apiClient } from '@/shared/lib/api'
import type { Todo } from '../../Todos/model/types'
import type { User } from '../../Users/model/types'
import type { DashboardStats, Transaction } from '../model/types'

interface JsonServerResponse<T> {
  data: T[]
  items: number
  next: number | null
  prev: number | null
  first: number
  last: number
  pages: number
}

export const dashboardApi = {
  getStats: async () => {
    // In a real scenario, this would be a single aggregation endpoint.
    // For now, we'll fetch raw data and aggregate on the client/service layer
    // to simulate "real" metrics instead of static json.

    // Fetch all todos to calculate stats
    const { data: todos } = await apiClient.get<Todo[]>('/todos')
    const { data: users } = await apiClient.get<User[]>('/users')

    // Calculate basic stats
    const totalRevenue = 45231.89 // Hardcoded for now as we don't have revenue model yet
    const revenueChange = 20.1

    const activeUsers = users.length
    const activeUsersChange = 15 // Mock change

    const completedTasks = todos.filter((t) => t.status === 'completed').length
    const pendingTasks = todos.filter(
      (t) => t.status === 'pending' || t.status === 'in_progress',
    ).length

    return {
      revenue: { value: totalRevenue, change: revenueChange, trend: 'up' },
      subscriptions: { value: activeUsers, change: activeUsersChange, trend: 'up' },
      sales: { value: completedTasks, change: 12, trend: 'up', context: 'Completed Tasks' },
      activeNow: { value: pendingTasks, change: -5, trend: 'down', context: 'Pending Tasks' },
    } as DashboardStats
  },

  getRecentTransactions: async () => {
    const { data } = await apiClient.get<Transaction[]>('/recentTransactions')
    return data
  },

  getUpcomingTodos: async () => {
    // Fetch tasks due in the next 7 days
    // Since json-server has limited date filtering, we'll fetch active tasks and filter client-side
    // or use a broader range if supported.
    const { data: response } = await apiClient.get<JsonServerResponse<Todo> | Todo[]>('/todos', {
      params: {
        _sort: 'dueDate',
        status_ne: 'completed', // 'status_ne' is not standard json-server, usually q or filtering by field
        // standard json-server: status=pending&status=in_progress (needs multi-value support or custom middleware)
        _per_page: 50,
      },
    })

    // Client-side filtering for dates will happen in the hook/component
    // to ensure accuracy with current date.
    return Array.isArray(response) ? response : response.data
  },

  getUsersWorkload: async () => {
    const { data: users } = await apiClient.get<User[]>('/users')
    const { data: todos } = await apiClient.get<Todo[]>('/todos')

    return users.map((user) => {
      const userTodos = todos.filter((t) => t.assignedTo === user.id)
      return {
        user,
        total: userTodos.length,
        completed: userTodos.filter((t) => t.status === 'completed').length,
        pending: userTodos.filter((t) => t.status === 'pending').length,
        inProgress: userTodos.filter((t) => t.status === 'in_progress').length,
      }
    })
  },
}
