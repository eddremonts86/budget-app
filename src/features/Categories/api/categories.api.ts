import { apiClient } from '@/shared/lib/api'
import type { Category } from '../model/types'

interface JsonServerResponse<T> {
  data: T[]
  items: number
  next: number | null
  prev: number | null
  first: number
  last: number
  pages: number
}

export const categoriesApi = {
  getAll: async ({ pageParam = 1, limit = 10 }: { pageParam?: number; limit?: number } = {}) => {
    const { data: response } = await apiClient.get<JsonServerResponse<Category>>('/categories', {
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
    const { data } = await apiClient.get<Category>(`/categories/${id}`)
    return data
  },
  create: async (category: Omit<Category, 'id'>) => {
    const { data } = await apiClient.post<Category>('/categories', category)
    return data
  },
  update: async (id: string, category: Partial<Category>) => {
    const { data } = await apiClient.patch<Category>(`/categories/${id}`, category)
    return data
  },
  delete: async (id: string) => {
    await apiClient.delete(`/categories/${id}`)
  },
}
