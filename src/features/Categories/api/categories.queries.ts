import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTQuery, useTQInfinite } from '@/shared/lib/query'
import { categoriesApi } from './categories.api'

export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  infinite: () => [...categoryKeys.lists(), 'infinite'] as const,
  details: () => [...categoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...categoryKeys.details(), id] as const,
}

export const useInfiniteCategories = (limit = 10) => {
  return useTQInfinite(
    categoryKeys.infinite(),
    ({ pageParam }) => categoriesApi.getAll({ pageParam, limit }),
    {
      initialPageParam: 1,
      getNextPageParam: (lastPage) => lastPage.nextPage,
    },
  )
}

export const useCategories = () => {
  return useTQuery(categoryKeys.lists(), () =>
    categoriesApi.getAll({ limit: 1000 }).then((res) => res.data),
  )
}

export const useCategory = (id: string) => {
  return useTQuery(categoryKeys.detail(id), () => categoriesApi.getById(id))
}

export const useCreateCategory = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: categoriesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all })
    },
  })
}

export const useUpdateCategory = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof categoriesApi.update>[1] }) =>
      categoriesApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all })
      queryClient.invalidateQueries({ queryKey: categoryKeys.detail(id) })
    },
  })
}

export const useDeleteCategory = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: categoriesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all })
    },
  })
}
