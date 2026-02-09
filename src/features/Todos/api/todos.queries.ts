import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTQuery, useTQInfinite } from '@/shared/lib/query'
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
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: todosApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: todoKeys.all })
    },
  })
}

export const useUpdateTodo = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof todosApi.update>[1] }) =>
      todosApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: todoKeys.all })
      queryClient.invalidateQueries({ queryKey: todoKeys.detail(id) })
    },
  })
}

export const useDeleteTodo = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: todosApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: todoKeys.all })
    },
  })
}
