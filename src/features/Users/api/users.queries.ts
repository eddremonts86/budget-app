import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTQuery, useTQInfinite } from '@/shared/lib/query'
import { usersApi } from './users.api'

export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  infinite: () => [...userKeys.lists(), 'infinite'] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
}

export const useInfiniteUsers = (limit = 10) => {
  return useTQInfinite(
    userKeys.infinite(),
    ({ pageParam }) => usersApi.getAll({ pageParam, limit }),
    {
      initialPageParam: 1,
      getNextPageParam: (lastPage) => lastPage.nextPage,
    },
  )
}

export const useUsers = () => {
  return useTQuery(userKeys.lists(), () => usersApi.getAll({ limit: 1000 }).then((res) => res.data))
}

export const useUser = (id: string) => {
  return useTQuery(userKeys.detail(id), () => usersApi.getById(id))
}

export const useCreateUser = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all })
    },
  })
}

export const useUpdateUser = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof usersApi.update>[1] }) =>
      usersApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: userKeys.all })
      queryClient.invalidateQueries({ queryKey: userKeys.detail(id) })
    },
  })
}

export const useDeleteUser = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: usersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all })
    },
  })
}
