import * as React from 'react'
import { type TodoStatus, useInfiniteTodos } from '../api/todos.queries'
import { LIST_PAGE_SIZE } from '../model/constants'
import type { Todo } from '../model/types'

/** Flatten + deduplicate across infinite-query pages */
function flattenPages(pages: Array<{ data: unknown[] }> | undefined): Todo[] {
  if (!pages) return []
  const seen = new Set<string>()
  const result: Todo[] = []
  for (const page of pages) {
    for (const item of page.data as Todo[]) {
      if (!seen.has(item.id)) {
        seen.add(item.id)
        result.push(item)
      }
    }
  }
  return result
}

interface UseInfiniteTodoListParams {
  status?: string
  assignedTo?: string
  search?: string
  onTotalCountChange?: (count: number) => void
}

export function useInfiniteTodoList({
  status,
  assignedTo,
  search,
  onTotalCountChange,
}: UseInfiniteTodoListParams) {
  const query = useInfiniteTodos(
    LIST_PAGE_SIZE,
    status as TodoStatus | undefined,
    assignedTo,
    undefined,
    search,
  )

  const totalCount = query.data?.pages[0]?.totalCount ?? 0
  const todos = React.useMemo(() => flattenPages(query.data?.pages), [query.data?.pages])

  React.useEffect(() => {
    onTotalCountChange?.(totalCount)
  }, [totalCount, onTotalCountChange])

  return {
    todos,
    totalCount,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
  }
}
