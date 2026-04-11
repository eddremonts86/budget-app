import { keepPreviousData } from '@tanstack/react-query'
import { i18n } from '@/shared/lib/i18n'
import { useTQuery, useTQInfinite, useTQMutation } from '@/shared/lib/query'
import {
  getTodosFn,
  getTodoByIdFn,
  createTodoFn,
  updateTodoFn,
  deleteTodoFn,
  getUpcomingTodosFn,
  getTodosByDateRangeFn,
  type CreateTodoInput,
  type UpdateTodoInput,
} from './todos.fn'

export const todoKeys = {
  all: ['todos'] as const,
  lists: () => [...todoKeys.all, 'list'] as const,
  infinite: () => [...todoKeys.lists(), 'infinite'] as const,
  dateRange: (startDate: string, endDate: string, assignedTo?: string, status?: TodoStatus) =>
    [...todoKeys.lists(), 'date-range', { startDate, endDate, assignedTo, status }] as const,
  details: () => [...todoKeys.all, 'detail'] as const,
  detail: (id: string) => [...todoKeys.details(), id] as const,
}

export type TodoStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'on_hold'
  | 'testing'
  | 'blocked'
  | 'cancelled'

export const useInfiniteTodos = (
  limit = 10,
  status?: TodoStatus,
  assignedTo?: string,
  options?: { enabled?: boolean },
  search?: string,
) => {
  return useTQInfinite(
    [...todoKeys.infinite(), { limit, status, assignedTo, search }],
    ({ pageParam }) => getTodosFn({ data: { pageParam, limit, status, assignedTo, search } }),
    {
      initialPageParam: 1,
      getNextPageParam: (lastPage) => lastPage?.nextPage,
      cache: 'stable' as const,
      enabled: options?.enabled !== false,
      placeholderData: keepPreviousData,
    },
  )
}

export const useSearchTodos = (search?: string, limit = 20) => {
  return useTQuery(
    [...todoKeys.lists(), 'search', { search, limit }],
    () => getTodosFn({ data: { limit, search } }),
    {
      cache: 'standard' as const,
      enabled: (search?.length ?? 0) >= 2,
    },
  )
}

/** Infinite paginated todos with optional search – used by dependencies picker */
export const useInfiniteDepsSearch = (limit = 20, search?: string) => {
  return useTQInfinite(
    [...todoKeys.infinite(), 'deps', { limit, search }],
    ({ pageParam }) => getTodosFn({ data: { pageParam, limit, search } }),
    {
      initialPageParam: 1,
      getNextPageParam: (lastPage) => lastPage?.nextPage,
      placeholderData: keepPreviousData,
    },
  )
}

export const useTodos = (params?: {
  page?: number
  limit?: number
  status?: TodoStatus
  assignedTo?: string
  enabled?: boolean
}) => {
  return useTQuery(
    [...todoKeys.lists(), params],
    () =>
      getTodosFn({
        data: {
          pageParam: params?.page,
          limit: params?.limit,
          status: params?.status,
          assignedTo: params?.assignedTo,
        },
      }),
    {
      cache: 'stable' as const,
      enabled: params?.enabled !== false,
    },
  )
}

export const useTodo = (id: string) => {
  return useTQuery(todoKeys.detail(id), () => getTodoByIdFn({ data: id }))
}

export const useTodosByDateRange = (
  startDate: string,
  endDate: string,
  assignedTo?: string,
  status?: TodoStatus,
) => {
  return useTQuery(
    todoKeys.dateRange(startDate, endDate, assignedTo, status),
    () => getTodosByDateRangeFn({ data: { startDate, endDate, assignedTo, status } }),
    {
      cache: 'stable', // calendar data changes rarely within a session
      enabled: Boolean(startDate && endDate),
    },
  )
}

export const useCreateTodo = (options?: Parameters<typeof useTQMutation>[2]) => {
  return useTQMutation(['todos', 'create'], (data: CreateTodoInput) => createTodoFn({ data }), {
    invalidateKeys: [todoKeys.all],
    successMessage: i18n.t('todos.toast.created'),
    ...options,
  })
}

export const useUpdateTodo = (options?: Parameters<typeof useTQMutation>[2]) => {
  return useTQMutation(
    ['todos', 'update'],
    ({ id, data }: { id: string; data: UpdateTodoInput }) => updateTodoFn({ data: { id, data } }),
    {
      invalidateKeys: [todoKeys.all],
      successMessage: i18n.t('todos.toast.updated'),
      ...options,
    },
  )
}

export const useDeleteTodo = (options?: Parameters<typeof useTQMutation>[2]) => {
  return useTQMutation(['todos', 'delete'], (id: string) => deleteTodoFn({ data: id }), {
    invalidateKeys: [todoKeys.all],
    successMessage: i18n.t('todos.toast.deleted'),
    ...options,
  })
}

const UPCOMING_TODOS_REFRESH_INTERVAL = 45 * 1000

export const useUpcomingTodos = () => {
  return useTQuery(['todos', 'upcoming'] as const, () => getUpcomingTodosFn({ data: undefined }), {
    cache: 'realtime',
    refetchInterval: UPCOMING_TODOS_REFRESH_INTERVAL,
    refetchOnWindowFocus: true,
    select: (data) => {
      const sortedItems = [...data.items].sort((a, b) => {
        const priorityWeight = { high: 3, medium: 2, low: 1 }
        const pA = priorityWeight[a.priority as keyof typeof priorityWeight] || 0
        const pB = priorityWeight[b.priority as keyof typeof priorityWeight] || 0
        if (pA !== pB) return pB - pA
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      })
      return { ...data, items: sortedItems }
    },
  })
}
