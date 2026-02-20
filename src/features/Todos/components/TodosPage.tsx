import { AnimatePresence, LazyMotion, domAnimation, m } from 'framer-motion'
import { Plus } from 'lucide-react'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useCurrentUser } from '@/features/Users/hooks/useCurrentUser'
import { useCreateTodo, useUpdateTodo } from '../api/todos.queries'
import type { Todo } from '../model/types'
import { TodoForm } from './TodoForm'
import { CalendarView } from './views/CalendarView'
import { KanbanView } from './views/KanbanView'
import { ListView } from './views/ListView'
import { ViewSwitcher, type TodoViewType } from './ViewSwitcher'

export function TodosPage() {
  const { t } = useTranslation()
  const { syncedUserId } = useCurrentUser()
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
            <h2 className="text-3xl font-bold tracking-tight">{t('todos.title', 'Tasks')}</h2>
            <p className="text-muted-foreground">
              {t('todos.subtitle', 'Manage your team tasks, track progress and deadlines.')}
            </p>
          </div>
          <div className="flex items-center gap-4">
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
              {view === 'list' && <ListView onEdit={setEditingTodo} />}
              {view === 'kanban' && <KanbanView onEdit={setEditingTodo} />}
              {view === 'calendar' && (
                <CalendarView
                  onEdit={setEditingTodo}
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
          <SheetContent className="sm:max-w-[540px] border-l border-border/40 backdrop-blur-3xl bg-background/80 flex flex-col p-0">
            <SheetHeader className="p-6 border-b border-border/40 shrink-0">
              <SheetTitle className="text-2xl font-bold tracking-tight">
                {t('todos.sheet.createTitle', 'Create Task')}
              </SheetTitle>
              <SheetDescription className="text-base">
                {t('todos.sheet.createDescription', 'Add a new task to your list.')}
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto p-6">
              <TodoForm
                defaultValues={createDefaultValues}
                currentUserId={syncedUserId || ''}
                onSubmit={async (values) => {
                  await createMutation.mutateAsync({
                    ...values,
                    createdBy: syncedUserId || '',
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
        <Sheet open={!!editingTodo} onOpenChange={(open) => !open && setEditingTodo(null)}>
          <SheetContent className="sm:max-w-[540px] border-l border-border/40 backdrop-blur-3xl bg-background/80 flex flex-col p-0">
            <SheetHeader className="p-6 border-b border-border/40 shrink-0">
              <SheetTitle className="text-2xl font-bold tracking-tight">
                {t('todos.sheet.editTitle', 'Edit Task')}
              </SheetTitle>
              <SheetDescription className="text-base">
                {t('todos.sheet.editDescription', 'Update task details.')}
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto p-6">
              {editingTodo && (
                <TodoForm
                  defaultValues={editingTodo}
                  currentUserId={syncedUserId || ''}
                  onSubmit={async (values) => {
                    await updateMutation.mutateAsync({ id: editingTodo.id, data: values })
                    setEditingTodo(null)
                  }}
                  onCancel={() => setEditingTodo(null)}
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
