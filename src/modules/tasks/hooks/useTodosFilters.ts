import * as React from 'react'
import { useCurrentUser } from '@/modules/users'
import type { TodoStatus } from '../api/todos.queries'

export function useTodosFilters() {
  const { syncedUserId, isReady } = useCurrentUser()

  const [statusFilter, setStatusFilter] = React.useState<TodoStatus | undefined>()
  const [assigneeFilter, setAssigneeFilter] = React.useState<string | undefined>()
  const [isFilterReady, setIsFilterReady] = React.useState(false)

  // Apply default filter exactly once when auth resolves
  const defaultAppliedRef = React.useRef(false)
  React.useEffect(() => {
    if (!defaultAppliedRef.current && isReady && syncedUserId) {
      defaultAppliedRef.current = true
      setAssigneeFilter(syncedUserId ?? undefined)
      setIsFilterReady(true)
    }
  }, [isReady, syncedUserId])

  const clearFilters = React.useCallback(() => {
    setStatusFilter(undefined)
    setAssigneeFilter(syncedUserId ?? undefined)
  }, [syncedUserId])

  const hasNonDefaultFilters = Boolean(
    statusFilter || (assigneeFilter && assigneeFilter !== syncedUserId),
  )

  return {
    syncedUserId,
    isReady,
    statusFilter,
    setStatusFilter,
    assigneeFilter,
    setAssigneeFilter,
    isFilterReady,
    clearFilters,
    hasNonDefaultFilters,
  }
}
