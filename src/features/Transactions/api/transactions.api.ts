import { apiClient } from '@/shared/lib/api'
import type { Transaction } from '../model/types'

interface JsonServerResponse<T> {
  data: T[]
  items: number
  next: number | null
  prev: number | null
  first: number
  last: number
  pages: number
}

export const transactionsApi = {
  getAll: async ({ pageParam = 1, limit = 10 }: { pageParam?: number; limit?: number } = {}) => {
    const { data: response } = await apiClient.get<JsonServerResponse<Transaction>>(
      '/recentTransactions',
      {
        params: {
          _page: pageParam,
          _per_page: limit,
        },
      },
    )
    return {
      data: response.data,
      nextPage: response.next ?? undefined,
      totalCount: response.items,
    }
  },
  getById: async (id: string) => {
    const { data } = await apiClient.get<Transaction>(`/recentTransactions/${id}`)
    return data
  },
  create: async (transaction: Omit<Transaction, 'id'>) => {
    const { data } = await apiClient.post<Transaction>('/recentTransactions', transaction)
    return data
  },
  update: async (id: string, transaction: Partial<Transaction>) => {
    const { data } = await apiClient.patch<Transaction>(`/recentTransactions/${id}`, transaction)
    return data
  },
  delete: async (id: string) => {
    await apiClient.delete(`/recentTransactions/${id}`)
  },
}
