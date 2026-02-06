import { useVirtualizer } from '@tanstack/react-virtual'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDeleteTodo, useTodosInfinite } from '../api'
import type { TodoFilters } from '../model'
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

  const todos = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data])
  const parentRef = useRef<HTMLDivElement>(null)
  const totalRows = hasNextPage ? todos.length + 1 : todos.length

  const rowVirtualizer = useVirtualizer({
    count: totalRows,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 140,
    overscan: 6,
    getItemKey: (index) => todos[index]?.id ?? `loader-${index}`,
  })

  // Re-measure when item count or editing state changes (row height varies)
  const todosLength = todos.length

  useEffect(() => {
    rowVirtualizer.measure()
  }, [rowVirtualizer, todosLength, editingId])

  const virtualItems = rowVirtualizer.getVirtualItems()
  const lastVirtualItem = virtualItems[virtualItems.length - 1]

  // Infinite scroll: fetch next page when scrolled near the bottom
  useEffect(() => {
    if (!(lastVirtualItem && hasNextPage) || isFetchingNextPage) return
    if (lastVirtualItem.index >= todosLength - 1) {
      fetchNextPage()
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, lastVirtualItem, todosLength])

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
    <div className="space-y-4">
      <div ref={parentRef} className="h-[70vh] overflow-auto rounded-lg border bg-card">
        <div className="relative w-full" style={{ height: rowVirtualizer.getTotalSize() }}>
          {virtualItems.map((virtualRow) => {
            const todo = todos[virtualRow.index]

            return (
              <div
                key={virtualRow.key}
                ref={rowVirtualizer.measureElement}
                data-index={virtualRow.index}
                className="px-4 py-2"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
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
