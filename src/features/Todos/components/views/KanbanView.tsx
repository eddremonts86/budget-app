import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { type InfiniteData, useQueryClient } from '@tanstack/react-query'
import { Calendar, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import * as React from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useUsers } from '@/features/Users/api/users.queries'
import { useSyncAuthUser } from '@/features/Users/hooks/useSyncAuthUser'
import { cn } from '@/shared/lib/utils'
import { todoKeys, useDeleteTodo, useInfiniteTodos, useUpdateTodo } from '../../api/todos.queries'
import { canModifyTodo } from '../../model/permissions'
import type { Todo } from '../../model/types'

interface KanbanViewProps {
  onEdit: (todo: Todo) => void
}

interface KanbanCardProps {
  todo: Todo
  user?: { name: string; avatar: string }
  onEdit: (todo: Todo) => void
  isOverlay?: boolean
  syncedUserId: string | null
  userRole: 'admin' | 'user'
}

const KanbanCard = React.memo(function KanbanCard({
  todo,
  user,
  onEdit,
  isOverlay = false,
  syncedUserId,
  userRole,
}: KanbanCardProps) {
  const { t } = useTranslation()
  const deleteMutation = useDeleteTodo()
  const canModify = canModifyTodo(todo, syncedUserId, userRole)

  const priorityColors = {
    high: 'text-destructive bg-destructive/10 border-destructive/20',
    medium: 'text-primary bg-primary/10 border-primary/20',
    low: 'text-secondary-foreground bg-secondary border-transparent',
  }

  return (
    <Card
      className={cn(
        'cursor-grab active:cursor-grabbing hover:shadow-md transition-all border-border/60 bg-card/50 backdrop-blur-sm',
        isOverlay ? 'shadow-xl rotate-2 scale-105 cursor-grabbing' : '',
      )}
    >
      <CardHeader className="p-3 pb-2 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <Badge
            variant="outline"
            className={cn(
              'rounded-md px-1.5 py-0.5 text-[10px] font-medium border uppercase tracking-wider',
              priorityColors[todo.priority as keyof typeof priorityColors],
            )}
          >
            {todo.priority}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 -mr-1 -mt-1 text-muted-foreground hover:text-foreground"
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t('common.actions')}</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onEdit(todo)} disabled={!canModify}>
                <Pencil className="h-4 w-4 mr-2" />
                {t('todos.actions.edit')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => deleteMutation.mutate(todo.id)}
                disabled={!canModify}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t('todos.actions.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <h4 className="text-sm font-semibold leading-tight line-clamp-2">{todo.title}</h4>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-3">
        {todo.dueDate && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{new Date(todo.dueDate).toLocaleDateString()}</span>
          </div>
        )}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5">
            <Avatar className="h-5 w-5 border border-border">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="text-[9px]">
                {user?.name?.substring(0, 2).toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground truncate max-w-[80px]">
              {user?.name || 'Unassigned'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

const KanbanColumn = React.memo(function KanbanColumn({
  id,
  title,
  todos,
  userMap,
  onEdit,
  syncedUserId,
  userRole,
}: {
  id: string
  title: string
  todos: Todo[]
  userMap: Map<string, { name: string; avatar: string }>
  onEdit: (todo: Todo) => void
  syncedUserId: string | null
  userRole: 'admin' | 'user'
}) {
  const { setNodeRef } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className="flex flex-col h-full min-w-[300px] max-w-[350px] bg-secondary/20 rounded-2xl border border-border/40 p-1"
    >
      <div className="p-3 flex items-center justify-between sticky top-0 bg-background/50 backdrop-blur-md rounded-t-xl z-10">
        <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          {title}
          <Badge
            variant="secondary"
            className="rounded-full px-2 h-5 min-w-5 flex items-center justify-center text-xs"
          >
            {todos.length}
          </Badge>
        </h3>
      </div>
      <ScrollArea className="flex-1 px-2 pb-2">
        <div className="flex flex-col gap-2 py-1">
          {todos.map((todo) => (
            <DraggableCard
              key={todo.id}
              todo={todo}
              user={userMap.get(todo.assignedTo)}
              onEdit={onEdit}
              syncedUserId={syncedUserId}
              userRole={userRole}
            />
          ))}
          {todos.length === 0 && (
            <div className="h-24 rounded-xl border-2 border-dashed border-border/40 flex items-center justify-center text-muted-foreground/40 text-sm">
              Empty
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
})

const DraggableCard = React.memo(function DraggableCard(props: {
  todo: Todo
  user?: { name: string; avatar: string }
  onEdit: (todo: Todo) => void
  syncedUserId: string | null
  userRole: 'admin' | 'user'
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: props.todo.id,
    data: props.todo,
  })

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined

  if (isDragging) {
    return (
      <div ref={setNodeRef} style={style} className="opacity-30 grayscale">
        <KanbanCard {...props} />
      </div>
    )
  }

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <KanbanCard {...props} />
    </div>
  )
})

export function KanbanView({ onEdit }: KanbanViewProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { data: users } = useUsers()
  const { syncedUserId, userRole } = useSyncAuthUser()
  // Disable automatic invalidation to prevent refetching during drag
  const updateMutation = useUpdateTodo({ invalidateKeys: [] })
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteTodos(10) // Fetch more for kanban
  const [activeTodo, setActiveTodo] = React.useState<Todo | null>(null)

  // Load more automatically for better kanban experience
  React.useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const userMap = React.useMemo(() => {
    const map = new Map<string, { name: string; avatar: string }>()
    if (users) {
      for (const u of users) {
        map.set(u.id, { name: u.name, avatar: u.avatar })
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

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
  )

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
      // Use the exact query key including the limit we used
      const queryKey = [...todoKeys.infinite(), { limit: 10 }]

      // Optimistic update via query cache
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
            // Revert on error
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
            // Force refetch to ensure consistency in case of error
            queryClient.invalidateQueries({ queryKey: todoKeys.all })
          },
        },
      )
    }
  }

  return (
    <div className="h-full flex gap-4 overflow-x-auto pb-4 snap-x">
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <KanbanColumn
          id="pending"
          title={t('todos.status.pending')}
          todos={columns.pending}
          userMap={userMap}
          onEdit={onEdit}
          syncedUserId={syncedUserId}
          userRole={userRole}
        />
        <KanbanColumn
          id="in_progress"
          title={t('todos.status.inProgress')}
          todos={columns.in_progress}
          userMap={userMap}
          onEdit={onEdit}
          syncedUserId={syncedUserId}
          userRole={userRole}
        />
        <KanbanColumn
          id="completed"
          title={t('todos.status.completed')}
          todos={columns.completed}
          userMap={userMap}
          onEdit={onEdit}
          syncedUserId={syncedUserId}
          userRole={userRole}
        />

        {createPortal(
          <DragOverlay>
            {activeTodo ? (
              <KanbanCard
                todo={activeTodo}
                user={userMap.get(activeTodo.assignedTo)}
                onEdit={onEdit}
                isOverlay
                syncedUserId={syncedUserId}
                userRole={userRole}
              />
            ) : null}
          </DragOverlay>,
          document.body,
        )}
      </DndContext>
    </div>
  )
}
