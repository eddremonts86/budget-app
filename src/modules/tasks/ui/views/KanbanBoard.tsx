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
  rectIntersection,
} from '@dnd-kit/core'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Calendar } from 'lucide-react'
import * as React from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/shared/lib/utils'
import { type TodoStatus } from '../../api/todos.queries'
import { PRIORITY_BADGE_VARIANTS } from '../../model/constants'
import type { Todo } from '../../model/types'
import { TodoActionsMenu } from '../components'

interface KanbanCardProps {
  todo: Todo
  user?: { name: string; avatar: string }
  onEdit: (todo: Todo) => void
  onDelete: (todo: Todo) => void
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
              PRIORITY_BADGE_VARIANTS[todo.priority],
            )}
          >
            {todo.priority}
          </Badge>
          <TodoActionsMenu
            todo={todo}
            canModify={canModify}
            onEdit={onEdit}
            onDelete={onDelete}
            compact
          />
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
            <span className="text-xs text-muted-foreground">{user?.name || 'Unassigned'}</span>
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
  onDelete: (todo: Todo) => void
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

interface KanbanColumnProps {
  id: string
  title: string
  todos: Todo[]
  totalCount: number
  userMap: Map<string, { name: string; avatar: string }>
  onEdit: (todo: Todo) => void
  onDelete: (todo: Todo) => void
  onFetchNextPage: () => void
  hasNextPage: boolean
  isFetchingNextPage: boolean
  canModifyTodo: (todo: Todo) => boolean
}

const KanbanColumn = React.memo(function KanbanColumn({
  id,
  title,
  todos,
  totalCount,
  userMap,
  onEdit,
  onDelete,
  onFetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  canModifyTodo,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })
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
      className={cn(
        'flex flex-col h-full min-w-[300px] max-w-[350px] bg-secondary/20 rounded-2xl border border-border/40 p-1 transition-colors duration-200 relative',
        isOver && 'bg-primary/10 border-primary/40 shadow-inner ring-2 ring-primary/20',
      )}
    >
      {isOver && (
        <div className="absolute inset-0 bg-primary/5 pointer-events-none rounded-2xl z-0" />
      )}
      <div className="p-3 flex items-center justify-between sticky top-0 bg-background/50 backdrop-blur-md rounded-t-xl z-10">
        <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          {title}
          <Badge
            variant="secondary"
            className="rounded-full px-2 h-5 min-w-5 flex items-center justify-center text-xs"
          >
            {totalCount}
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
    testing: Todo[]
    on_hold: Todo[]
    completed: Todo[]
  }
  totalCounts: {
    pending: number
    in_progress: number
    testing: number
    on_hold: number
    completed: number
  }
  userMap: Map<string, { name: string; avatar: string }>
  onEdit: (todo: Todo) => void
  onDelete: (todo: Todo) => void
  onDragStart: (event: DragStartEvent) => void
  onDragEnd: (event: DragEndEvent) => void
  onFetchNextPage: (status: TodoStatus) => void
  hasNextPage: {
    pending: boolean
    in_progress: boolean
    testing: boolean
    on_hold: boolean
    completed: boolean
  }
  isFetchingNextPage: {
    pending: boolean
    in_progress: boolean
    testing: boolean
    on_hold: boolean
    completed: boolean
  }
  canModifyTodo: (todo: Todo) => boolean
  activeTodo: Todo | null
}

export function KanbanBoard({
  columns,
  totalCounts,
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
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 10,
      },
    }),
  )

  const fetchNextPagePending = React.useCallback(
    () => onFetchNextPage('pending'),
    [onFetchNextPage],
  )
  const fetchNextPageInProgress = React.useCallback(
    () => onFetchNextPage('in_progress'),
    [onFetchNextPage],
  )
  const fetchNextPageTesting = React.useCallback(
    () => onFetchNextPage('testing'),
    [onFetchNextPage],
  )
  const fetchNextPageOnHold = React.useCallback(() => onFetchNextPage('on_hold'), [onFetchNextPage])
  const fetchNextPageCompleted = React.useCallback(
    () => onFetchNextPage('completed'),
    [onFetchNextPage],
  )

  return (
    <div className="h-full flex gap-4 overflow-x-auto pb-4 snap-x">
      <DndContext
        sensors={sensors}
        collisionDetection={rectIntersection}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <KanbanColumn
          id="pending"
          title={t('todos.status.pending')}
          todos={columns.pending}
          totalCount={totalCounts.pending}
          userMap={userMap}
          onEdit={onEdit}
          onDelete={onDelete}
          onFetchNextPage={fetchNextPagePending}
          hasNextPage={hasNextPage.pending}
          isFetchingNextPage={isFetchingNextPage.pending}
          canModifyTodo={canModifyTodo}
        />
        <KanbanColumn
          id="in_progress"
          title={t('todos.status.inProgress')}
          todos={columns.in_progress}
          totalCount={totalCounts.in_progress}
          userMap={userMap}
          onEdit={onEdit}
          onDelete={onDelete}
          onFetchNextPage={fetchNextPageInProgress}
          hasNextPage={hasNextPage.in_progress}
          isFetchingNextPage={isFetchingNextPage.in_progress}
          canModifyTodo={canModifyTodo}
        />
        <KanbanColumn
          id="testing"
          title={t('todos.status.testing', 'Testing')}
          todos={columns.testing}
          totalCount={totalCounts.testing}
          userMap={userMap}
          onEdit={onEdit}
          onDelete={onDelete}
          onFetchNextPage={fetchNextPageTesting}
          hasNextPage={hasNextPage.testing}
          isFetchingNextPage={isFetchingNextPage.testing}
          canModifyTodo={canModifyTodo}
        />
        <KanbanColumn
          id="on_hold"
          title={t('todos.status.onHold', 'On Hold')}
          todos={columns.on_hold}
          totalCount={totalCounts.on_hold}
          userMap={userMap}
          onEdit={onEdit}
          onDelete={onDelete}
          onFetchNextPage={fetchNextPageOnHold}
          hasNextPage={hasNextPage.on_hold}
          isFetchingNextPage={isFetchingNextPage.on_hold}
          canModifyTodo={canModifyTodo}
        />
        <KanbanColumn
          id="completed"
          title={t('todos.status.completed')}
          todos={columns.completed}
          totalCount={totalCounts.completed}
          userMap={userMap}
          onEdit={onEdit}
          onDelete={onDelete}
          onFetchNextPage={fetchNextPageCompleted}
          hasNextPage={hasNextPage.completed}
          isFetchingNextPage={isFetchingNextPage.completed}
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
