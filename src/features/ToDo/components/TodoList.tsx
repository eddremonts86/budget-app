import { useTranslation } from 'react-i18next'
import { useTodosInfinite } from '../api'
import type { TodoFilters } from '../types/todo.types'
import { useTodoList } from '../hooks/useTodoList'
import { useTodoVirtualizer } from '../hooks/useTodoVirtualizer'
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

  const { todos, editingId, deletingId, handleEdit, handleCancelEdit, handleDelete } =
    useTodoList(data)

  const totalRows = hasNextPage ? todos.length + 1 : todos.length

  const { parentRef, rowVirtualizer, virtualItems } = useTodoVirtualizer({
    todos,
    hasNextPage: !!hasNextPage,
    editingId,
    totalRows,
    fetchNextPage,
    isFetchingNextPage,
  })

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

  if (!todos.length) {
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
