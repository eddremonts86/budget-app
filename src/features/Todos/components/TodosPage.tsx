import { AnimatePresence, LazyMotion, domAnimation, m } from 'framer-motion'
import { Plus, Pin, PinOff, X } from 'lucide-react'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { useCurrentUser } from '@/features/Users/hooks/useCurrentUser'
import { cn } from '@/shared/utils/index'
import { useCreateTodo, useUpdateTodo, useInfiniteTodos } from '../api/todos.queries'
import type { Todo } from '../model/types'
import { TodoForm } from './TodoForm'
import { CalendarView } from './views/CalendarView'
import { KanbanView } from './views/KanbanView'
import { ListView } from './views/ListView'
import { ViewSwitcher, type TodoViewType } from './ViewSwitcher'

export function TodosPage() {
  const { t } = useTranslation()
  const { syncedUserId } = useCurrentUser()
  const [onlyMyTasks, setOnlyMyTasks] = React.useState(false)
  const { data } = useInfiniteTodos(1, undefined, onlyMyTasks ? syncedUserId || '' : undefined)
  const totalCount = data?.pages[0]?.totalCount ?? 0

  const [view, setView] = React.useState<TodoViewType>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('todos-view') as TodoViewType) || 'list'
    }
    return 'list'
  })

  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [isPinned, setIsPinned] = React.useState(false)
  const [isEditPinned, setIsEditPinned] = React.useState(false)

  // Reset pin when window is resized to mobile
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setIsPinned(false)
        setIsEditPinned(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  const [createDefaultValues, setCreateDefaultValues] = React.useState<Partial<Todo>>({})
  const [editingTodo, setEditingTodo] = React.useState<Todo | null>(null)

  const createMutation = useCreateTodo()
  const updateMutation = useUpdateTodo()

  const handleViewChange = (newView: TodoViewType) => {
    setView(newView)
    localStorage.setItem('todos-view', newView)
  }

  const handleCreate = (defaults: Partial<Todo> = {}) => {
    setCreateDefaultValues(defaults)
    setIsCreateOpen(true)
  }

  return (
    <LazyMotion features={domAnimation}>
      <div className="flex flex-col h-full space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight">
              {t('todos.title', 'Tasks')}
              {totalCount > 0 && (
                <span className="ml-2 text-muted-foreground font-normal text-2xl">
                  ({totalCount})
                </span>
              )}
            </h2>
            <p className="text-muted-foreground">
              {t('todos.subtitle', 'Manage your team tasks, track progress and deadlines.')}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 mr-2">
              <Switch
                id="my-tasks"
                checked={onlyMyTasks}
                onCheckedChange={setOnlyMyTasks}
                className="data-[state=checked]:bg-primary"
              />
              <Label htmlFor="my-tasks" className="text-sm font-medium cursor-pointer">
                {t('todos.filters.onlyMyTasks', 'Only my tasks')}
              </Label>
            </div>
            <ViewSwitcher view={view} onViewChange={handleViewChange} />
            <Button onClick={() => handleCreate()} className="gap-2">
              <Plus className="h-4 w-4" />
              {t('todos.actions.new', 'New Task')}
            </Button>
          </div>
        </div>

        <div className="flex-1 min-h-0">
          <AnimatePresence mode="wait">
            <m.div
              key={view}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {view === 'list' && (
                <ListView
                  onEdit={setEditingTodo}
                  assignedTo={onlyMyTasks ? syncedUserId || '' : undefined}
                />
              )}
              {view === 'kanban' && (
                <KanbanView
                  onEdit={setEditingTodo}
                  assignedTo={onlyMyTasks ? syncedUserId || '' : undefined}
                />
              )}
              {view === 'calendar' && (
                <CalendarView
                  onEdit={setEditingTodo}
                  assignedTo={onlyMyTasks ? syncedUserId || '' : undefined}
                  onCreateWithDate={(date) =>
                    handleCreate({ dueDate: date.toISOString().split('T')[0] })
                  }
                />
              )}
            </m.div>
          </AnimatePresence>
        </div>

        {/* Create Sheet */}
        <Sheet
          open={isCreateOpen}
          onOpenChange={(open) => {
            if (isPinned && !open) return
            setIsCreateOpen(open)
            if (!open) setCreateDefaultValues({})
          }}
          modal={!isPinned}
        >
          <SheetContent
            overlay={!isPinned}
            showCloseButton={false}
            className={cn(
              'sm:max-w-[540px] border-l border-border/40 backdrop-blur-3xl bg-background/80 flex flex-col p-0',
              isPinned && 'shadow-none border-l-2',
            )}
            onPointerDownOutside={(e) => {
              if (isPinned) e.preventDefault()
            }}
            onEscapeKeyDown={(e) => {
              if (isPinned) e.preventDefault()
            }}
          >
            <SheetHeader className="p-6 pb-4 border-b border-border/40 shrink-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1 pr-4">
                  <SheetTitle className="text-2xl font-bold tracking-tight">
                    {t('todos.sheet.createTitle', 'Create Task')}
                  </SheetTitle>
                  <SheetDescription className="text-base leading-relaxed">
                    {t('todos.sheet.createDescription', 'Add a new task to your list.')}
                  </SheetDescription>
                </div>
                <div className="flex items-center gap-1 -mt-1 -mr-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      'h-9 w-9 rounded-full transition-colors hidden sm:flex items-center justify-center',
                      isPinned
                        ? 'text-primary bg-primary/10'
                        : 'text-muted-foreground hover:bg-muted/50',
                    )}
                    onClick={() => setIsPinned(!isPinned)}
                    title={isPinned ? t('common.unpin') : t('common.pinVisible')}
                  >
                    {isPinned ? (
                      <PinOff className="h-4.5 w-4.5" />
                    ) : (
                      <Pin className="h-4.5 w-4.5" />
                    )}
                  </Button>
                  <SheetClose asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-full text-muted-foreground hover:bg-muted/50 flex items-center justify-center"
                      title={t('common.close', 'Close')}
                    >
                      <X className="h-4.5 w-4.5" />
                    </Button>
                  </SheetClose>
                </div>
              </div>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto p-6">
              <TodoForm
                defaultValues={createDefaultValues}
                currentUserId={syncedUserId || ''}
                onSubmit={async (values) => {
                  await createMutation.mutateAsync({
                    ...values,
                    assignedTo: values.assignedTo || syncedUserId || '',
                  })
                  if (!isPinned) {
                    setIsCreateOpen(false)
                    setCreateDefaultValues({})
                  }
                }}
                onCancel={() => {
                  setIsCreateOpen(false)
                  setCreateDefaultValues({})
                  setIsPinned(false)
                }}
                isLoading={createMutation.isPending}
              />
            </div>
          </SheetContent>
        </Sheet>

        {/* Edit Sheet */}
        <Sheet
          open={!!editingTodo}
          onOpenChange={(open) => {
            if (isEditPinned && !open) return
            if (!open) {
              setEditingTodo(null)
              setIsEditPinned(false)
            }
          }}
          modal={!isEditPinned}
        >
          <SheetContent
            overlay={!isEditPinned}
            showCloseButton={false}
            className={cn(
              'sm:max-w-[540px] border-l border-border/40 backdrop-blur-3xl bg-background/80 flex flex-col p-0',
              isEditPinned && 'shadow-none border-l-2',
            )}
            onPointerDownOutside={(e) => {
              if (isEditPinned) e.preventDefault()
            }}
            onEscapeKeyDown={(e) => {
              if (isEditPinned) e.preventDefault()
            }}
          >
            <SheetHeader className="p-6 pb-4 border-b border-border/40 shrink-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1 pr-4">
                  <SheetTitle className="text-2xl font-bold tracking-tight">
                    {t('todos.sheet.editTitle', 'Edit Task')}
                  </SheetTitle>
                  <SheetDescription className="text-base leading-relaxed">
                    {t('todos.sheet.editDescription', 'Update task details.')}
                  </SheetDescription>
                </div>
                <div className="flex items-center gap-1 -mt-1 -mr-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      'h-9 w-9 rounded-full transition-colors hidden sm:flex items-center justify-center',
                      isEditPinned
                        ? 'text-primary bg-primary/10'
                        : 'text-muted-foreground hover:bg-muted/50',
                    )}
                    onClick={() => setIsEditPinned(!isEditPinned)}
                    title={isEditPinned ? t('common.unpin') : t('common.pinVisible')}
                  >
                    {isEditPinned ? (
                      <PinOff className="h-4.5 w-4.5" />
                    ) : (
                      <Pin className="h-4.5 w-4.5" />
                    )}
                  </Button>
                  <SheetClose asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-full text-muted-foreground hover:bg-muted/50 flex items-center justify-center"
                      title={t('common.close', 'Close')}
                    >
                      <X className="h-4.5 w-4.5" />
                    </Button>
                  </SheetClose>
                </div>
              </div>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto p-6">
              {editingTodo && (
                <TodoForm
                  defaultValues={editingTodo}
                  currentUserId={syncedUserId || ''}
                  onSubmit={async (values) => {
                    await updateMutation.mutateAsync({ id: editingTodo.id, data: values })
                    if (!isEditPinned) {
                      setEditingTodo(null)
                    }
                  }}
                  onCancel={() => {
                    setEditingTodo(null)
                    setIsEditPinned(false)
                  }}
                  isLoading={updateMutation.isPending}
                />
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </LazyMotion>
  )
}
