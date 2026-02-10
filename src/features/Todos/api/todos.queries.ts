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
    todoKeys.infinite(),
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

export const useCreateTodo = () => {
  return useTQMutation(['todos', 'create'], todosApi.create, {
    invalidateKeys: [todoKeys.all],
    successMessage: 'Tarea creada correctamente',
  })
}

export const useUpdateTodo = () => {
  return useTQMutation(
    ['todos', 'update'],
    ({ id, data }: { id: string; data: Parameters<typeof todosApi.update>[1] }) =>
      todosApi.update(id, data),
    {
      invalidateKeys: [todoKeys.all],
      successMessage: 'Tarea actualizada correctamente',
    },
  )
}

export const useDeleteTodo = () => {
  return useTQMutation(['todos', 'delete'], todosApi.delete, {
    invalidateKeys: [todoKeys.all],
    successMessage: 'Tarea eliminada correctamente',
  })
}
