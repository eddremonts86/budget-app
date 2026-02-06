import { useVirtualizer } from '@tanstack/react-virtual'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDeleteTodo, useTodosInfinite } from '@/features/ToDo/api'
import type { TodoFilters } from '@/features/ToDo/model'
import { TodoEditForm } from './TodoEditForm'
import { TodoItem } from './TodoItem'

interface TodoListProps {
  filters?: TodoFilters
}

const PAGE_SIZE = 10

export function TodoList({ filters }: TodoListProps) {
  const { t } = useTranslation()
  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useTodosInfinite(filters, PAGE_SIZE)
  const deleteTodo = useDeleteTodo()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const todos = useMemo(() => {
    const allItems = data?.pages.flatMap((page) => page.items) ?? []
    const uniqueIds = new Set()
    return allItems.filter((item) => {
      if (!item.id || uniqueIds.has(item.id)) return false
      uniqueIds.add(item.id)
      return true
    })
  }, [data])
  const parentRef = useRef<HTMLDivElement>(null)
  const totalRows = hasNextPage ? todos.length + 1 : todos.length

  // eslint-disable-next-line react-hooks/incompatible-library
  const rowVirtualizer = useVirtualizer({
    count: totalRows,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
    overscan: 10,
    getItemKey: (index) => todos[index]?.id ?? `loader-${index}`,
    onChange: () => {
      // Force a re-render when the virtualizer changes
    },
  })

  // Re-measure when item count or editing state changes (row height varies)
  const todosLength = todos.length

  useEffect(() => {
    // Re-measure immediately and multiple times to catch layout shifts
    rowVirtualizer.measure()
    const timers = [
      setTimeout(() => rowVirtualizer.measure(), 16), // ~1 frame
      setTimeout(() => rowVirtualizer.measure(), 100),
      setTimeout(() => rowVirtualizer.measure(), 300),
    ]
    return () => timers.forEach(clearTimeout)
  }, [rowVirtualizer, todosLength, editingId])

  const virtualItems = rowVirtualizer.getVirtualItems()

  // Infinite scroll: fetch next page when scrolled near the bottom
  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage || virtualItems.length === 0) return

    const lastItem = virtualItems[virtualItems.length - 1]
    // Trigger fetch when the last visible item is one of the last 3 items
    // This provides a smoother loading experience
    if (lastItem.index >= totalRows - 3) {
      fetchNextPage()
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, virtualItems, totalRows])

  // Stable callbacks to prevent child re-renders
  const handleEdit = useCallback((id: string) => setEditingId(id), [])
  const handleCancelEdit = useCallback(() => setEditingId(null), [])
  const handleDelete = useCallback(
    (id: string) => {
      setDeletingId(id)
      deleteTodo.mutate(id, { onSettled: () => setDeletingId(null) })
    },
    [deleteTodo],
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (error) {
    return <div className="text-center py-12 text-destructive">{t('errors:api.serverError')}</div>
  }

  if (!todosLength) {
    return <div className="text-center py-12 text-muted-foreground">{t('todo.empty')}</div>
  }

  return (
    <div className="h-full flex flex-col">
      <div ref={parentRef} className="flex-1 overflow-auto rounded-lg border bg-background">
        <div className="relative w-full" style={{ height: rowVirtualizer.getTotalSize() }}>
          {virtualItems.map((virtualRow) => {
            const todo = todos[virtualRow.index]

            return (
              <div
                key={virtualRow.key}
                ref={rowVirtualizer.measureElement}
                data-index={virtualRow.index}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                  willChange: 'transform',
                  zIndex: editingId === todo?.id ? 10 : 1,
                }}
              >
                <div className="bg-background w-full">
                  {todo ? (
                    editingId === todo.id ? (
                      <TodoEditForm
                        todo={todo}
                        onSuccess={handleCancelEdit}
                        onCancel={handleCancelEdit}
                      />
                    ) : (
                      <TodoItem
                        todo={todo}
                        onEdit={() => handleEdit(todo.id)}
                        onDelete={() => handleDelete(todo.id)}
                        isDeleting={deletingId === todo.id}
                      />
                    )
                  ) : (
                    <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                      {t('common.loading')}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
      {isFetchingNextPage && (
        <div className="flex items-center justify-center py-2 text-sm text-muted-foreground">
          {t('common.loading')}
        </div>
      )}
    </div>
  )
}
