import { Button } from '@/components/ui/button'
import { CrudSheetHeader } from '@/components/ui/crud-sheet'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { useCurrentUser } from '@/modules/users'
import { AnimatePresence, LazyMotion, domAnimation, m } from 'framer-motion'
import { Plus } from 'lucide-react'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useCreateTodo, useInfiniteTodos, useUpdateTodo } from '../api/todos.queries'
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
            <Button type="button" onClick={() => handleCreate()} className="gap-2">
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
            setIsCreateOpen(open)
            if (!open) setCreateDefaultValues({})
          }}
        >
          <SheetContent
            showCloseButton={false}
            className="sm:max-w-[540px] border-l border-border/40 bg-background flex flex-col p-0"
          >
            <CrudSheetHeader
              title={t('todos.sheet.createTitle', 'Create Task')}
              description={t('todos.sheet.createDescription', 'Add a new task to your list.')}
              onClose={() => {
                setIsCreateOpen(false)
                setCreateDefaultValues({})
              }}
            />
            <div className="flex-1 overflow-y-auto p-6">
              <TodoForm
                defaultValues={createDefaultValues}
                currentUserId={syncedUserId || ''}
                onSubmit={async (values) => {
                  await createMutation.mutateAsync({
                    ...values,
                    assignedTo: values.assignedTo || syncedUserId || '',
                  })
                  setIsCreateOpen(false)
                  setCreateDefaultValues({})
                }}
                onCancel={() => {
                  setIsCreateOpen(false)
                  setCreateDefaultValues({})
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
            if (!open) {
              setEditingTodo(null)
            }
          }}
        >
          <SheetContent
            showCloseButton={false}
            className="sm:max-w-[540px] border-l border-border/40 bg-background flex flex-col p-0"
          >
            <CrudSheetHeader
              title={t('todos.sheet.editTitle', 'Edit Task')}
              description={t('todos.sheet.editDescription', 'Update task details.')}
              onClose={() => {
                setEditingTodo(null)
              }}
            />
            <div className="flex-1 overflow-y-auto p-6">
              {editingTodo && (
                <TodoForm
                  defaultValues={editingTodo}
                  currentUserId={syncedUserId || ''}
                  onSubmit={async (values) => {
                    await updateMutation.mutateAsync({ id: editingTodo.id, data: values })
                    setEditingTodo(null)
                  }}
                  onCancel={() => {
                    setEditingTodo(null)
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
