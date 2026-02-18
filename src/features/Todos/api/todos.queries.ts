import { i18n } from '@/shared/lib/i18n'
import { useTQuery, useTQInfinite, useTQMutation } from '@/shared/lib/query'
import { todosApi } from './todos.api'

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
    ({ pageParam }) => todosApi.getAll({ pageParam, limit }),
    {
      initialPageParam: 1,
      getNextPageParam: (lastPage) => lastPage.nextPage,
    },
  )
}

export const useTodo = (id: string) => {
  return useTQuery(todoKeys.detail(id), () => todosApi.getById(id))
}

export const useCreateTodo = (options?: Parameters<typeof useTQMutation>[2]) => {
  return useTQMutation(['todos', 'create'], todosApi.create, {
    invalidateKeys: [todoKeys.all],
    successMessage: i18n.t('todos.toast.created'),
    ...options,
  })
}

export const useUpdateTodo = (options?: Parameters<typeof useTQMutation>[2]) => {
  return useTQMutation(
    ['todos', 'update'],
    ({ id, data }: { id: string; data: Parameters<typeof todosApi.update>[1] }) =>
      todosApi.update(id, data),
    {
      invalidateKeys: [todoKeys.all],
      successMessage: i18n.t('todos.toast.updated'),
      ...options,
    },
  )
}

export const useDeleteTodo = (options?: Parameters<typeof useTQMutation>[2]) => {
  return useTQMutation(['todos', 'delete'], todosApi.delete, {
    invalidateKeys: [todoKeys.all],
    successMessage: i18n.t('todos.toast.deleted'),
    ...options,
  })
}
