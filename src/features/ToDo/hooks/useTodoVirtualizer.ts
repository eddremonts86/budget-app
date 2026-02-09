import { useVirtualizer } from '@tanstack/react-virtual'
import { useEffect, useRef } from 'react'
import type { Todo } from '../types/todo.types'

interface UseTodoVirtualizerProps {
  todos: Todo[]
  hasNextPage: boolean
  editingId: string | null
  totalRows: number
  fetchNextPage: () => void
  isFetchingNextPage: boolean
}

interface ShouldFetchNextPageOptions {
  hasNextPage: boolean
  isFetchingNextPage: boolean
  virtualItems: Array<{ index: number }>
  totalRows: number
}

export function shouldFetchNextPage({
  hasNextPage,
  isFetchingNextPage,
  virtualItems,
  totalRows,
}: ShouldFetchNextPageOptions) {
  if (!hasNextPage || isFetchingNextPage || virtualItems.length === 0) return false

  const lastItem = virtualItems[virtualItems.length - 1]
  return lastItem.index >= totalRows - 3
}

export function useTodoVirtualizer({
  todos,
  hasNextPage,
  editingId,
  totalRows,
  fetchNextPage,
  isFetchingNextPage,
}: UseTodoVirtualizerProps) {
  const parentRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: totalRows,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
    overscan: 10,
    getItemKey: (index) => todos[index]?.id ?? `loader-${index}`,
  })

  const todosLength = todos.length
  const virtualItems = rowVirtualizer.getVirtualItems()

  useEffect(() => {
    rowVirtualizer.measure()
    const timers = [
      setTimeout(() => rowVirtualizer.measure(), 16),
      setTimeout(() => rowVirtualizer.measure(), 100),
      setTimeout(() => rowVirtualizer.measure(), 300),
    ]
    return () => timers.forEach(clearTimeout)
  }, [rowVirtualizer, todosLength, editingId])

  useEffect(() => {
    if (
      shouldFetchNextPage({
        hasNextPage,
        isFetchingNextPage,
        virtualItems,
        totalRows,
      })
    ) {
      fetchNextPage()
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, virtualItems, totalRows])

  return {
    parentRef,
    rowVirtualizer,
    virtualItems,
  }
}
