import { type DragEndEvent, type DragStartEvent } from '@dnd-kit/core'
import { type InfiniteData, useQueryClient } from '@tanstack/react-query'
import * as React from 'react'
import { useCurrentUser } from '@/modules/users'
import {
  todoKeys,
  useDeleteTodo,
  useInfiniteTodos,
  useUpdateTodo,
  type TodoStatus,
} from '../../api/todos.queries'
import { useUserMap } from '../../hooks/useUserMap'
import { canModifyTodo } from '../../model/permissions'
import type { Todo } from '../../model/types'
import { KanbanBoard } from './KanbanBoard'

interface KanbanViewProps {
  onEdit: (todo: Todo) => void
  assignedTo?: string
  status?: TodoStatus
}

export function KanbanView({ onEdit, assignedTo, status }: KanbanViewProps) {
  const queryClient = useQueryClient()
  const { syncedUserId, userRole } = useCurrentUser()
  const updateMutation = useUpdateTodo({ invalidateKeys: [todoKeys.all] })
  const deleteMutation = useDeleteTodo()

  // When a status filter is active, only fetch the matching column
  const ALL_STATUSES: TodoStatus[] = ['pending', 'in_progress', 'testing', 'on_hold', 'completed']
  const visibleStatuses = status ? ALL_STATUSES.filter((s) => s === status) : ALL_STATUSES

  const pendingQuery = useInfiniteTodos(10, 'pending', assignedTo, {
    enabled: visibleStatuses.includes('pending'),
  })
  const inProgressQuery = useInfiniteTodos(10, 'in_progress', assignedTo, {
    enabled: visibleStatuses.includes('in_progress'),
  })
  const testingQuery = useInfiniteTodos(10, 'testing', assignedTo, {
    enabled: visibleStatuses.includes('testing'),
  })
  const onHoldQuery = useInfiniteTodos(10, 'on_hold', assignedTo, {
    enabled: visibleStatuses.includes('on_hold'),
  })
  const completedQuery = useInfiniteTodos(10, 'completed', assignedTo, {
    enabled: visibleStatuses.includes('completed'),
  })

  const [activeTodo, setActiveTodo] = React.useState<Todo | null>(null)

  const columns = React.useMemo(() => {
    return {
      pending: (pendingQuery.data?.pages.flatMap((p) => p.data) ?? []) as Todo[],
      in_progress: (inProgressQuery.data?.pages.flatMap((p) => p.data) ?? []) as Todo[],
      testing: (testingQuery.data?.pages.flatMap((p) => p.data) ?? []) as Todo[],
      on_hold: (onHoldQuery.data?.pages.flatMap((p) => p.data) ?? []) as Todo[],
      completed: (completedQuery.data?.pages.flatMap((p) => p.data) ?? []) as Todo[],
    }
  }, [
    pendingQuery.data,
    inProgressQuery.data,
    testingQuery.data,
    onHoldQuery.data,
    completedQuery.data,
  ])

  const allTodosFlat = React.useMemo(() => {
    return Object.values(columns).flat()
  }, [columns])

  const userMap = useUserMap(allTodosFlat)

  const totalCounts = React.useMemo(() => {
    return {
      pending: pendingQuery.data?.pages[0]?.totalCount ?? 0,
      in_progress: inProgressQuery.data?.pages[0]?.totalCount ?? 0,
      testing: testingQuery.data?.pages[0]?.totalCount ?? 0,
      on_hold: onHoldQuery.data?.pages[0]?.totalCount ?? 0,
      completed: completedQuery.data?.pages[0]?.totalCount ?? 0,
    }
  }, [
    pendingQuery.data,
    inProgressQuery.data,
    testingQuery.data,
    onHoldQuery.data,
    completedQuery.data,
  ])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveTodo(event.active.data.current as Todo)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTodo(null)

    if (!over) {
      return
    }

    const todoId = active.id as string
    const newStatus = over.id as string
    const allTodos = [
      ...columns.pending,
      ...columns.in_progress,
      ...columns.testing,
      ...columns.on_hold,
      ...columns.completed,
    ]
    const todo = allTodos.find((t) => t.id === todoId)

    if (
      todo &&
      todo.status !== newStatus &&
      [
        'pending',
        'in_progress',
        'testing',
        'on_hold',
        'completed',
        'blocked',
        'cancelled',
      ].includes(newStatus)
    ) {
      const previousStatus = todo.status
      const sourceQueryKey = [
        ...todoKeys.infinite(),
        { limit: 10, status: previousStatus as TodoStatus, assignedTo },
      ]
      const targetQueryKey = [
        ...todoKeys.infinite(),
        { limit: 10, status: newStatus as TodoStatus, assignedTo },
      ]

      // Optimistic update: remove from source, add to target
      queryClient.setQueryData(
        sourceQueryKey,
        (
          oldData: InfiniteData<{ nextPage: number; data: Todo[]; totalCount: number }> | undefined,
        ) => {
          if (!oldData) return oldData
          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              data: page.data.filter((t) => t.id !== todoId),
              totalCount: page.totalCount - 1,
            })),
          }
        },
      )

      queryClient.setQueryData(
        targetQueryKey,
        (
          oldData: InfiniteData<{ nextPage: number; data: Todo[]; totalCount: number }> | undefined,
        ) => {
          if (!oldData) return oldData
          const updatedTodo = { ...todo, status: newStatus as Todo['status'] }
          return {
            ...oldData,
            pages: oldData.pages.map((page, index) => {
              if (index === 0) {
                return {
                  ...page,
                  data: [updatedTodo, ...page.data],
                  totalCount: page.totalCount + 1,
                }
              }
              return page
            }),
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
            queryClient.invalidateQueries({ queryKey: todoKeys.all })
          },
        },
      )
    }
  }

  const handleFetchNextPage = (status: TodoStatus) => {
    if (status === 'pending') pendingQuery.fetchNextPage()
    if (status === 'in_progress') inProgressQuery.fetchNextPage()
    if (status === 'testing') testingQuery.fetchNextPage()
    if (status === 'on_hold') onHoldQuery.fetchNextPage()
    if (status === 'completed') completedQuery.fetchNextPage()
  }

  const handleDelete = (todo: Todo) => {
    deleteMutation.mutate(todo.id)
  }

  const canModify = (todo: Todo) => canModifyTodo(todo, syncedUserId, userRole)

  // When a status filter is active, only render the matching column — queries are already gated
  const filteredColumns = Object.fromEntries(
    Object.entries(columns).filter(([key]) => visibleStatuses.includes(key as TodoStatus)),
  ) as typeof columns

  const filteredTotalCounts = Object.fromEntries(
    Object.entries(totalCounts).filter(([key]) => visibleStatuses.includes(key as TodoStatus)),
  ) as typeof totalCounts

  return (
    <KanbanBoard
      columns={filteredColumns}
      totalCounts={filteredTotalCounts}
      userMap={userMap}
      onEdit={onEdit}
      onDelete={handleDelete}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onFetchNextPage={handleFetchNextPage}
      hasNextPage={{
        pending: !!pendingQuery.hasNextPage,
        in_progress: !!inProgressQuery.hasNextPage,
        testing: !!testingQuery.hasNextPage,
        on_hold: !!onHoldQuery.hasNextPage,
        completed: !!completedQuery.hasNextPage,
      }}
      isFetchingNextPage={{
        pending: pendingQuery.isFetchingNextPage,
        in_progress: inProgressQuery.isFetchingNextPage,
        testing: testingQuery.isFetchingNextPage,
        on_hold: onHoldQuery.isFetchingNextPage,
        completed: completedQuery.isFetchingNextPage,
      }}
      canModifyTodo={canModify}
      activeTodo={activeTodo}
    />
  )
}
