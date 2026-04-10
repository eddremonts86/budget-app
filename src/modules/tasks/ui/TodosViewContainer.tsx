import { AnimatePresence, m } from 'framer-motion'
import type { TodoStatus } from '../api/todos.queries'
import type { Todo } from '../model/types'
import { CalendarView } from './views/CalendarView'
import { KanbanView } from './views/KanbanView'
import { ListView } from './views/ListView'
import type { TodoViewType } from './ViewSwitcher'

interface TodosViewContainerProps {
  view: TodoViewType
  isFilterReady: boolean
  assigneeFilter: string | undefined
  statusFilter: TodoStatus | undefined
  onEdit: (todo: Todo) => void
  onTotalCountChange: (count: number) => void
  onCreateWithDate: (date: Date) => void
}

export function TodosViewContainer({
  view,
  isFilterReady,
  assigneeFilter,
  statusFilter,
  onEdit,
  onTotalCountChange,
  onCreateWithDate,
}: TodosViewContainerProps) {
  if (!isFilterReady) {
    return (
      <div className="flex-1 min-h-0">
        <div className="space-y-3 pt-2">
          <div className="h-16 w-full rounded-2xl bg-muted/40 animate-pulse" />
          <div className="h-16 w-full rounded-2xl bg-muted/40 animate-pulse" />
          <div className="h-16 w-full rounded-2xl bg-muted/30 animate-pulse" />
        </div>
      </div>
    )
  }

  return (
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
              onEdit={onEdit}
              assignedTo={assigneeFilter}
              status={statusFilter}
              onTotalCountChange={onTotalCountChange}
            />
          )}
          {view === 'kanban' && (
            <KanbanView onEdit={onEdit} assignedTo={assigneeFilter} status={statusFilter} />
          )}
          {view === 'calendar' && (
            <CalendarView
              onEdit={onEdit}
              assignedTo={assigneeFilter}
              status={statusFilter}
              onCreateWithDate={onCreateWithDate}
            />
          )}
        </m.div>
      </AnimatePresence>
    </div>
  )
}
