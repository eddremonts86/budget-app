import { LazyMotion, domAnimation } from 'framer-motion'
import * as React from 'react'
import { useTodosFilters } from '../hooks/useTodosFilters'
import { useTodosView } from '../hooks/useTodosView'
import { useUserFilterOptions } from '../hooks/useUserFilterOptions'
import type { Todo } from '../model/types'
import { TodoCreateSheet } from './sheets/TodoCreateSheet'
import { TodoEditSheet } from './sheets/TodoEditSheet'
import { TodosFilterBar } from './TodosFilterBar'
import { TodosHeader } from './TodosHeader'
import { TodosViewContainer } from './TodosViewContainer'

export function TodosPage() {
  const filters = useTodosFilters()
  const { view, handleViewChange } = useTodosView()
  const userFilterOptions = useUserFilterOptions()

  const [totalCount, setTotalCount] = React.useState(0)
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [createDefaultValues, setCreateDefaultValues] = React.useState<Partial<Todo>>({})
  const [editingTodo, setEditingTodo] = React.useState<Todo | null>(null)

  const handleCreate = React.useCallback((defaults: Partial<Todo> = {}) => {
    setCreateDefaultValues(defaults)
    setIsCreateOpen(true)
  }, [])

  const handleCreateClose = React.useCallback(() => {
    setIsCreateOpen(false)
    setCreateDefaultValues({})
  }, [])

  return (
    <LazyMotion features={domAnimation}>
      <div className="flex flex-col h-full space-y-4 animate-in fade-in duration-500">
        <TodosHeader
          totalCount={totalCount}
          view={view}
          onViewChange={handleViewChange}
          onCreateNew={() => handleCreate()}
        />

        <TodosFilterBar
          assigneeFilter={filters.assigneeFilter}
          onAssigneeChange={filters.setAssigneeFilter}
          statusFilter={filters.statusFilter}
          onStatusChange={filters.setStatusFilter}
          syncedUserId={filters.syncedUserId ?? undefined}
          hasNonDefaultFilters={filters.hasNonDefaultFilters}
          onClearFilters={filters.clearFilters}
          userFilterOptions={userFilterOptions}
        />

        <TodosViewContainer
          view={view}
          isFilterReady={filters.isFilterReady}
          assigneeFilter={filters.assigneeFilter}
          statusFilter={filters.statusFilter}
          onEdit={setEditingTodo}
          onTotalCountChange={setTotalCount}
          onCreateWithDate={(date) => handleCreate({ dueDate: date.toISOString().split('T')[0] })}
        />

        <TodoCreateSheet
          open={isCreateOpen}
          onOpenChange={(open) => {
            if (!open) handleCreateClose()
          }}
          defaultValues={createDefaultValues}
          currentUserId={filters.syncedUserId || ''}
          onCreated={handleCreateClose}
        />

        <TodoEditSheet
          todo={editingTodo}
          onClose={() => setEditingTodo(null)}
          currentUserId={filters.syncedUserId || ''}
        />
      </div>
    </LazyMotion>
  )
}
