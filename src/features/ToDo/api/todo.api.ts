import { apiClient } from '@/shared/lib/api'
import type { CreateTodoInput, Todo, TodoFilters, TodoPage, UpdateTodoInput } from '../types/todo.types'

export const todoApi = {
  getAll: (filters?: TodoFilters) =>
    apiClient.get<Todo[]>('/todos', { params: filters }).then((r) => r.data),

  getPage: (page: number, limit: number, filters?: TodoFilters): Promise<TodoPage> =>
    apiClient
      .get<Todo[]>('/todos', {
        params: {
          ...filters,
          _page: page,
          _per_page: limit, // JSON Server 1.x uses _per_page
          _limit: limit, // Fallback for older versions
        },
      })
      .then((r) => {
        // JSON Server 1.x might return data in a different structure or use different headers
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const items = Array.isArray(r.data) ? r.data : (r.data as any).data || []
        const total =
          Number(r.headers['x-total-count']) ||
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          Number((r.data as any).items) ||
          items.length

        return {
          items,
          page,
          limit,
          total,
        }
      }),

  getById: (id: string) => apiClient.get<Todo>(`/todos/${id}`).then((r) => r.data),

  create: (data: CreateTodoInput) =>
    apiClient
      .post<Todo>('/todos', {
        ...data,
        id: crypto.randomUUID(),
        status: data.status ?? 'pending',
        description: data.description ?? '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .then((r) => r.data),

  update: ({ id, ...data }: UpdateTodoInput) =>
    apiClient
      .patch<Todo>(`/todos/${id}`, {
        ...data,
        updatedAt: new Date().toISOString(),
      })
      .then((r) => r.data),

  delete: (id: string) => apiClient.delete(`/todos/${id}`),
}
