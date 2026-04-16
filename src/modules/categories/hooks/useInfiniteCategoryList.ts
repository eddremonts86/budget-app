import * as React from 'react'
import { DEFAULT_PAGE_SIZE, flattenInfinitePages } from '@/shared/ui/tables'
import { useInfiniteCategories } from '../api/categories.queries'
import type { Category } from '../model/types'

export function useInfiniteCategoryList(search?: string) {
  const query = useInfiniteCategories(DEFAULT_PAGE_SIZE, search)

  const totalCount = query.data?.pages[0]?.totalCount ?? 0
  const categories = React.useMemo(
    () => flattenInfinitePages<Category>(query.data?.pages),
    [query.data?.pages],
  )

  return {
    categories,
    totalCount,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
  }
}
