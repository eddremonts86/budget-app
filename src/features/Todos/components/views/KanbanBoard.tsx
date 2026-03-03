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
import { useVirtualizer } from '@tanstack/react-virtual'
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
import { cn } from '@/shared/lib/utils'
import type { Todo } from '../../model/types'

interface KanbanCardProps {
  todo: Todo
  user?: { name: string; avatar: string }
  onEdit: (todo: Todo) => void
  onDelete: (id: string) => void
  isOverlay?: boolean
  canModify: boolean
}

export const KanbanCard = React.memo(function KanbanCard({
  todo,
  user,
  onEdit,
  onDelete,
  isOverlay = false,
  canModify,
}: KanbanCardProps) {
  const { t } = useTranslation()

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
                onClick={() => onDelete(todo.id)}
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

const DraggableCard = React.memo(function DraggableCard(props: {
  todo: Todo
  user?: { name: string; avatar: string }
  onEdit: (todo: Todo) => void
  onDelete: (id: string) => void
  canModify: boolean
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

const KanbanColumn = React.memo(function KanbanColumn({
  id,
  title,
  todos,
  userMap,
  onEdit,
  onDelete,
  onFetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  canModifyTodo,
}: {
  id: string
  title: string
  todos: Todo[]
  userMap: Map<string, { name: string; avatar: string }>
  onEdit: (todo: Todo) => void
  onDelete: (id: string) => void
  onFetchNextPage: () => void
  hasNextPage: boolean
  isFetchingNextPage: boolean
  canModifyTodo: (todo: Todo) => boolean
}) {
  const { setNodeRef } = useDroppable({ id })
  const parentRef = React.useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: todos.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 140,
    overscan: 5,
  })

  const virtualItems = rowVirtualizer.getVirtualItems()

  React.useEffect(() => {
    const [lastItem] = [...virtualItems].reverse()
    if (!lastItem) return

    if (lastItem.index >= todos.length - 1 && hasNextPage && !isFetchingNextPage) {
      onFetchNextPage()
    }
  }, [hasNextPage, onFetchNextPage, todos.length, isFetchingNextPage, virtualItems])

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
      <div ref={parentRef} className="flex-1 px-2 pb-2 overflow-y-auto contain-strict">
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualItems.map((virtualItem) => (
            <div
              key={virtualItem.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
                paddingBottom: '8px',
              }}
            >
              <DraggableCard
                todo={todos[virtualItem.index]}
                user={
                  todos[virtualItem.index].assignedTo
                    ? userMap.get(todos[virtualItem.index].assignedTo!)
                    : undefined
                }
                onEdit={onEdit}
                onDelete={onDelete}
                canModify={canModifyTodo(todos[virtualItem.index])}
              />
            </div>
          ))}
        </div>
        {todos.length === 0 && (
          <div className="h-24 rounded-xl border-2 border-dashed border-border/40 flex items-center justify-center text-muted-foreground/40 text-sm">
            Empty
          </div>
        )}
        {isFetchingNextPage && todos.length > 0 && (
          <div className="py-2 flex justify-center text-xs text-muted-foreground">
            Loading more...
          </div>
        )}
      </div>
    </div>
  )
})

interface KanbanBoardProps {
  columns: {
    pending: Todo[]
    in_progress: Todo[]
    completed: Todo[]
  }
  userMap: Map<string, { name: string; avatar: string }>
  onEdit: (todo: Todo) => void
  onDelete: (id: string) => void
  onDragStart: (event: DragStartEvent) => void
  onDragEnd: (event: DragEndEvent) => void
  onFetchNextPage: () => void
  hasNextPage: boolean
  isFetchingNextPage: boolean
  canModifyTodo: (todo: Todo) => boolean
  activeTodo: Todo | null
}

export function KanbanBoard({
  columns,
  userMap,
  onEdit,
  onDelete,
  onDragStart,
  onDragEnd,
  onFetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  canModifyTodo,
  activeTodo,
}: KanbanBoardProps) {
  const { t } = useTranslation()

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

  return (
    <div className="h-full flex gap-4 overflow-x-auto pb-4 snap-x">
      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <KanbanColumn
          id="pending"
          title={t('todos.status.pending')}
          todos={columns.pending}
          userMap={userMap}
          onEdit={onEdit}
          onDelete={onDelete}
          onFetchNextPage={onFetchNextPage}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          canModifyTodo={canModifyTodo}
        />
        <KanbanColumn
          id="in_progress"
          title={t('todos.status.inProgress')}
          todos={columns.in_progress}
          userMap={userMap}
          onEdit={onEdit}
          onDelete={onDelete}
          onFetchNextPage={onFetchNextPage}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          canModifyTodo={canModifyTodo}
        />
        <KanbanColumn
          id="completed"
          title={t('todos.status.completed')}
          todos={columns.completed}
          userMap={userMap}
          onEdit={onEdit}
          onDelete={onDelete}
          onFetchNextPage={onFetchNextPage}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          canModifyTodo={canModifyTodo}
        />

        {createPortal(
          <DragOverlay>
            {activeTodo ? (
              <KanbanCard
                todo={activeTodo}
                user={activeTodo.assignedTo ? userMap.get(activeTodo.assignedTo) : undefined}
                onEdit={onEdit}
                onDelete={onDelete}
                isOverlay
                canModify={canModifyTodo(activeTodo)}
              />
            ) : null}
          </DragOverlay>,
          document.body,
        )}
      </DndContext>
    </div>
  )
}
