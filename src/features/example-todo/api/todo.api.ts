import { apiClient } from '@/shared/lib/api'
import type { CreateTodoInput, Todo, TodoFilters, TodoPage, UpdateTodoInput } from '../model'

export const todoApi = {
  getAll: (filters?: TodoFilters) =>
    apiClient.get<Todo[]>('/todos', { params: filters }).then((r) => r.data),

  getPage: (page: number, limit: number, filters?: TodoFilters): Promise<TodoPage> =>
    apiClient
      .get<Todo[]>('/todos', { params: { ...filters, _page: page, _limit: limit } })
      .then((r) => ({
        items: r.data,
        page,
        limit,
        total: Number(r.headers['x-total-count'] ?? 0),
      })),

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
