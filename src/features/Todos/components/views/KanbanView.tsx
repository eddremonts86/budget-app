import { type DragEndEvent, type DragStartEvent } from '@dnd-kit/core'
import { type InfiniteData, useQueryClient } from '@tanstack/react-query'
import * as React from 'react'
import { useUsers } from '@/features/Users/api/users.queries'
import { useCurrentUser } from '@/features/Users/hooks/useCurrentUser'
import { todoKeys, useDeleteTodo, useInfiniteTodos, useUpdateTodo } from '../../api/todos.queries'
import { canModifyTodo } from '../../model/permissions'
import type { Todo } from '../../model/types'
import { KanbanBoard } from './KanbanBoard'

interface KanbanViewProps {
  onEdit: (todo: Todo) => void
}

export function KanbanView({ onEdit }: KanbanViewProps) {
  const queryClient = useQueryClient()
  const { data: users } = useUsers()
  const { syncedUserId, userRole } = useCurrentUser()
  const updateMutation = useUpdateTodo({ invalidateKeys: [todoKeys.all] })
  const deleteMutation = useDeleteTodo()
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteTodos(10)
  const [activeTodo, setActiveTodo] = React.useState<Todo | null>(null)

  const userMap = React.useMemo(() => {
    const map = new Map<string, { name: string; avatar: string }>()
    if (users) {
      for (const u of users) {
        map.set(u.id, { name: u.name, avatar: u.avatar || '' })
      }
    }
    return map
  }, [users])

  const allTodos = React.useMemo(() => data?.pages.flatMap((p) => p.data) ?? [], [data])

  const columns = React.useMemo(() => {
    const cols = {
      pending: [] as Todo[],
      in_progress: [] as Todo[],
      completed: [] as Todo[],
    }
    allTodos.forEach((todo) => {
      const status = todo.status as keyof typeof cols
      if (cols[status]) {
        cols[status].push(todo)
      }
    })
    return cols
  }, [allTodos])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveTodo(event.active.data.current as Todo)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTodo(null)

    if (!over) return

    const todoId = active.id as string
    const newStatus = over.id as string
    const todo = allTodos.find((t) => t.id === todoId)

    if (
      todo &&
      todo.status !== newStatus &&
      ['pending', 'in_progress', 'completed'].includes(newStatus)
    ) {
      const previousStatus = todo.status
      const queryKey = [...todoKeys.infinite(), { limit: 10 }]

      queryClient.setQueryData(
        queryKey,
        (oldData: InfiniteData<{ nextPage: number; data: Todo[] }> | undefined) => {
          if (!oldData) return oldData
          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              data: page.data.map((t) => (t.id === todoId ? { ...t, status: newStatus } : t)),
            })),
          }
        },
      )

      updateMutation.mutate(
        {
          id: todoId,
          data: { status: newStatus as Todo['status'] },
        },
        {
          onError: () => {
            queryClient.setQueryData(
              queryKey,
              (oldData: InfiniteData<{ nextPage: number; data: Todo[] }> | undefined) => {
                if (!oldData) return oldData
                return {
                  ...oldData,
                  pages: oldData.pages.map((page) => ({
                    ...page,
                    data: page.data.map((t) =>
                      t.id === todoId ? { ...t, status: previousStatus } : t,
                    ),
                  })),
                }
              },
            )
            queryClient.invalidateQueries({ queryKey: todoKeys.all })
          },
        },
      )
    }
  }

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id)
  }

  const canModify = (todo: Todo) => canModifyTodo(todo, syncedUserId, userRole)

  return (
    <KanbanBoard
      columns={columns}
      userMap={userMap}
      onEdit={onEdit}
      onDelete={handleDelete}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onFetchNextPage={fetchNextPage}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      canModifyTodo={canModify}
      activeTodo={activeTodo}
    />
  )
}
