import { i18n } from '@/shared/lib/i18n'
import { useTQuery, useTQInfinite, useTQMutation } from '@/shared/lib/query'
import type { Todo } from '../model/types'
import { getTodosFn, getTodoByIdFn, createTodoFn, updateTodoFn, deleteTodoFn } from './todos.fn'

export const todoKeys = {
  all: ['todos'] as const,
  lists: () => [...todoKeys.all, 'list'] as const,
  infinite: () => [...todoKeys.lists(), 'infinite'] as const,
  details: () => [...todoKeys.all, 'detail'] as const,
  detail: (id: string) => [...todoKeys.details(), id] as const,
}

export const useInfiniteTodos = (limit = 10) => {
  return useTQInfinite(
    [...todoKeys.infinite(), { limit }],
    ({ pageParam }) => getTodosFn({ data: { pageParam, limit } }),
    {
      initialPageParam: 1,
      getNextPageParam: (lastPage) => lastPage.nextPage,
    },
  )
}

export const useTodos = (params?: { page?: number; limit?: number }) => {
  return useTQuery([...todoKeys.lists(), params], () =>
    getTodosFn({ data: { pageParam: params?.page, limit: params?.limit } }),
  )
}

export const useTodo = (id: string) => {
  return useTQuery(todoKeys.detail(id), () => getTodoByIdFn({ data: id }))
}

export const useCreateTodo = (options?: Parameters<typeof useTQMutation>[2]) => {
  return useTQMutation(['todos', 'create'], (data) => createTodoFn({ data }), {
    invalidateKeys: [todoKeys.all],
    successMessage: i18n.t('todos.toast.created'),
    ...options,
  })
}

export const useUpdateTodo = (options?: Parameters<typeof useTQMutation>[2]) => {
  return useTQMutation(
    ['todos', 'update'],
    ({ id, data }: { id: string; data: Partial<Todo> }) => updateTodoFn({ data: { id, data } }),
    {
      invalidateKeys: [todoKeys.all],
      successMessage: i18n.t('todos.toast.updated'),
      ...options,
    },
  )
}

export const useDeleteTodo = (options?: Parameters<typeof useTQMutation>[2]) => {
  return useTQMutation(['todos', 'delete'], (id) => deleteTodoFn({ data: id }), {
    invalidateKeys: [todoKeys.all],
    successMessage: i18n.t('todos.toast.deleted'),
    ...options,
  })
}
