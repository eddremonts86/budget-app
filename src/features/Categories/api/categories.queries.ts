import { useTQuery, useTQInfinite, useTQMutation } from '@/shared/lib/query'
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
  return useTQMutation(['categories', 'create'], categoriesApi.create, {
    invalidateKeys: [categoryKeys.all],
    successMessage: 'Categoría creada correctamente',
  })
}

export const useUpdateCategory = () => {
  return useTQMutation(['categories', 'update'], ({ id, data }: { id: string; data: Parameters<typeof categoriesApi.update>[1] }) =>
    categoriesApi.update(id, data), {
    invalidateKeys: [categoryKeys.all],
    successMessage: 'Categoría actualizada correctamente',
  })
}

export const useDeleteCategory = () => {
  return useTQMutation(['categories', 'delete'], categoriesApi.delete, {
    invalidateKeys: [categoryKeys.all],
    successMessage: 'Categoría eliminada correctamente',
  })
}
