import { apiClient } from '@/shared/lib/api'
import type { Todo } from '../model/types'

interface JsonServerResponse<T> {
  data: T[]
  items: number
  next: number | null
  prev: number | null
  first: number
  last: number
  pages: number
}

export const todosApi = {
  getAll: async ({ pageParam = 1, limit = 10 }: { pageParam?: number; limit?: number } = {}) => {
    const { data: response } = await apiClient.get<JsonServerResponse<Todo>>('/todos', {
      params: {
        _page: pageParam,
        _per_page: limit,
        _sort: '-createdAt',
      },
    })

    return {
      data: response.data,
      nextPage: response.next ?? undefined,
      totalCount: response.items,
    }
  },
  getById: async (id: string) => {
    const { data } = await apiClient.get<Todo>(`/todos/${id}`)
    return data
  },
  create: async (todo: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString()
    const { data } = await apiClient.post<Todo>('/todos', {
      ...todo,
      createdAt: now,
      updatedAt: now,
    })
    return data
  },
  update: async (id: string, todo: Partial<Todo>) => {
    const { data } = await apiClient.patch<Todo>(`/todos/${id}`, {
      ...todo,
      updatedAt: new Date().toISOString(),
    })
    return data
  },
  delete: async (id: string) => {
    await apiClient.delete(`/todos/${id}`)
  },
}
