import { useTQInfinite, useTQMutation, useTQSuspense, useTQuery } from '@/shared/lib/query'
import type { TodoFilters, TodoPage } from '../model'
import { todoApi } from './todo.api'

/**
 * Query keys factory for todos
 * Provides type-safe and consistent query keys
 */
export const todoKeys = {
  all: ['todos'] as const,
  lists: () => [...todoKeys.all, 'list'] as const,
  list: (filters?: TodoFilters) => [...todoKeys.lists(), filters] as const,
  infinite: (filters?: TodoFilters, pageSize = 10) =>
    [...todoKeys.lists(), 'infinite', filters ? { ...filters, pageSize } : { pageSize }] as const,
  details: () => [...todoKeys.all, 'detail'] as const,
  detail: (id: string) => [...todoKeys.details(), id] as const,
}

/**
 * Fetch all todos with optional filters
 */
export function useTodos(filters?: TodoFilters) {
  return useTQuery(todoKeys.list(filters), () => todoApi.getAll(filters), {
    cache: 'standard',
  })
}

/**
 * Fetch todos with server-side pagination for infinite scrolling
 */
export function useTodosInfinite(filters?: TodoFilters, pageSize = 10) {
  return useTQInfinite<TodoPage>(
    todoKeys.infinite(filters, pageSize),
    ({ pageParam = 1 }) => todoApi.getPage(pageParam, pageSize, filters),
    {
      cache: 'standard',
      initialPageParam: 1,
      getNextPageParam: (lastPage) => {
        const loaded = lastPage.page * lastPage.limit
        const hasMore = lastPage.total
          ? loaded < lastPage.total
          : lastPage.items.length === lastPage.limit

        return hasMore ? lastPage.page + 1 : undefined
      },
    },
  )
}

/**
 * Fetch single todo by ID (with Suspense)
 */
export function useTodoSuspense(id: string) {
  return useTQSuspense(todoKeys.detail(id), () => todoApi.getById(id), {
    cache: 'stable',
  })
}

/**
 * Fetch single todo by ID
 */
export function useTodo(id: string) {
  return useTQuery(todoKeys.detail(id), () => todoApi.getById(id), {
    cache: 'stable',
    enabled: Boolean(id),
  })
}

/**
 * Create a new todo
 */
export function useCreateTodo() {
  return useTQMutation(['todos', 'create'], todoApi.create, {
    invalidateKeys: [todoKeys.lists()],
    successMessage: 'todo.messages.created',
  })
}

/**
 * Update an existing todo
 */
export function useUpdateTodo() {
  return useTQMutation(['todos', 'update'], todoApi.update, {
    invalidateKeys: [todoKeys.all],
    successMessage: 'todo.messages.updated',
  })
}

/**
 * Delete a todo
 */
export function useDeleteTodo() {
  return useTQMutation(['todos', 'delete'], todoApi.delete, {
    invalidateKeys: [todoKeys.lists()],
    successMessage: 'todo.messages.deleted',
  })
}
