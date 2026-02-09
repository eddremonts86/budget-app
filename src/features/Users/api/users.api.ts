import { apiClient } from '@/shared/lib/api'
import type { User } from '../model/types'

interface JsonServerResponse<T> {
  data: T[]
  items: number
  next: number | null
  prev: number | null
  first: number
  last: number
  pages: number
}

export const usersApi = {
  getAll: async ({ pageParam = 1, limit = 10 }: { pageParam?: number; limit?: number } = {}) => {
    const { data: response } = await apiClient.get<JsonServerResponse<User>>('/users', {
      params: {
        _page: pageParam,
        _per_page: limit,
      },
    })
    return {
      data: response.data,
      nextPage: response.next ?? undefined,
      totalCount: response.items,
    }
  },
  getById: async (id: string) => {
    const { data } = await apiClient.get<User>(`/users/${id}`)
    return data
  },
  create: async (user: Omit<User, 'id'>) => {
    const { data } = await apiClient.post<User>('/users', user)
    return data
  },
  update: async (id: string, user: Partial<User>) => {
    const { data } = await apiClient.patch<User>(`/users/${id}`, user)
    return data
  },
  delete: async (id: string) => {
    await apiClient.delete(`/users/${id}`)
  },
}
