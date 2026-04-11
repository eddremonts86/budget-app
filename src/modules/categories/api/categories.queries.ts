import { useTQuery, useTQInfinite, useTQMutation } from '@/shared/lib/query'
import { LIST_PAGE_SIZE } from '../model/constants'
import type { Category } from '../model/types'
import {
  createCategoryFn,
  deleteCategoryFn,
  getCategoriesFn,
  getCategoryByIdFn,
  updateCategoryFn,
} from './categories.fn'

export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  infinite: () => [...categoryKeys.lists(), 'infinite'] as const,
  details: () => [...categoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...categoryKeys.details(), id] as const,
}

export const useInfiniteCategories = (limit = LIST_PAGE_SIZE) => {
  return useTQInfinite(
    categoryKeys.infinite(),
    ({ pageParam }) => getCategoriesFn({ data: { pageParam, limit } }),
    {
      initialPageParam: 1,
      getNextPageParam: (lastPage) => lastPage.nextPage,
    },
  )
}

export const useCategories = () => {
  type CategoryListResponse = Awaited<ReturnType<typeof getCategoriesFn>>

  return useTQuery(categoryKeys.lists(), () =>
    getCategoriesFn({ data: { limit: 1000 } }).then((res: CategoryListResponse) => res.data),
  )
}

export const useCategory = (id: string) => {
  return useTQuery(categoryKeys.detail(id), () => getCategoryByIdFn({ data: id }))
}

export const useCreateCategory = () => {
  return useTQMutation(
    ['categories', 'create'],
    (data: Omit<Category, 'id'>) => createCategoryFn({ data }),
    {
      invalidateKeys: [categoryKeys.all],
      successMessage: 'categories.mutations.created',
    },
  )
}

export const useUpdateCategory = () => {
  return useTQMutation(
    ['categories', 'update'],
    ({ id, data }: { id: string; data: Partial<Category> }) =>
      updateCategoryFn({ data: { id, data } }),
    {
      invalidateKeys: [categoryKeys.all],
      successMessage: 'categories.mutations.updated',
    },
  )
}

export const useDeleteCategory = () => {
  return useTQMutation(['categories', 'delete'], (id: string) => deleteCategoryFn({ data: id }), {
    invalidateKeys: [categoryKeys.all],
    successMessage: 'categories.mutations.deleted',
  })
}
