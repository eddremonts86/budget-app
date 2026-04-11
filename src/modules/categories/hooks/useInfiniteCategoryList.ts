import * as React from 'react'
import { useInfiniteCategories } from '../api/categories.queries'
import { LIST_PAGE_SIZE } from '../model/constants'
import type { Category } from '../model/types'

/** Flatten + deduplicate across infinite-query pages */
function flattenPages(pages: Array<{ data: unknown[] }> | undefined): Category[] {
  if (!pages) return []
  const seen = new Set<string>()
  const result: Category[] = []
  for (const page of pages) {
    for (const item of page.data as Category[]) {
      if (!seen.has(item.id)) {
        seen.add(item.id)
        result.push(item)
      }
    }
  }
  return result
}

export function useInfiniteCategoryList() {
  const query = useInfiniteCategories(LIST_PAGE_SIZE)

  const totalCount = query.data?.pages[0]?.totalCount ?? 0
  const categories = React.useMemo(() => flattenPages(query.data?.pages), [query.data?.pages])

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
