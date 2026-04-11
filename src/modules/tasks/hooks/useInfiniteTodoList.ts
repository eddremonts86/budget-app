import * as React from 'react'
import { flattenInfinitePages } from '@/shared/ui/tables'
import { type TodoStatus, useInfiniteTodos } from '../api/todos.queries'
import { LIST_PAGE_SIZE } from '../model/constants'
import type { Todo } from '../model/types'

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
  const todos = React.useMemo(
    () => flattenInfinitePages<Todo>(query.data?.pages),
    [query.data?.pages],
  )

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
