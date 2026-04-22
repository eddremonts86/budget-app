import { CircleDot, ListFilter, User, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { cn } from '@/shared/lib/utils'
import { InfiniteSelect } from '@/shared/ui/selectores/InfiniteSelect'
import type { TodoStatus } from '../api/todos.queries'
import type { useUserFilterOptions } from '../hooks/useUserFilterOptions'
import { ALL_STATUSES, STATUS_DOT_COLORS } from '../model/constants'

interface TodosFilterBarProps {
  assigneeFilter: string | undefined
  onAssigneeChange: (value: string | undefined) => void
  statusFilter: TodoStatus | undefined
  onStatusChange: (value: TodoStatus | undefined) => void
  syncedUserId: string | undefined
  hasNonDefaultFilters: boolean
  onClearFilters: () => void
  userFilterOptions: ReturnType<typeof useUserFilterOptions>
}

export function TodosFilterBar({
  assigneeFilter,
  onAssigneeChange,
  statusFilter,
  onStatusChange,
  syncedUserId,
  hasNonDefaultFilters,
  onClearFilters,
  userFilterOptions,
}: TodosFilterBarProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-wrap items-center gap-2 shrink-0">
      {/* Filters label */}
      <div className="flex items-center gap-1.5 text-muted-foreground/70 shrink-0">
        <ListFilter className="h-3.5 w-3.5" />
        <span className="text-xs font-medium tracking-wide hidden sm:block">
          {t('todos.filters.label', 'Filters')}
        </span>
      </div>
      <div className="h-4 w-px bg-border/60 shrink-0 hidden sm:block" />

      {/* Assignee filter */}
      <InfiniteSelect
        value={assigneeFilter}
        onValueChange={onAssigneeChange}
        options={userFilterOptions.options}
        hasNextPage={userFilterOptions.hasNextPage}
        fetchNextPage={userFilterOptions.fetchNextPage}
        isFetchingNextPage={userFilterOptions.isFetchingNextPage}
        isLoading={userFilterOptions.isLoading}
        searchQuery={userFilterOptions.userSearch}
        onSearchChange={userFilterOptions.setUserSearch}
        searchPlaceholder={t('todos.filters.searchUsers', 'Search users…')}
        placeholder={t('todos.filters.allUsers', 'All users')}
        icon={<User className="h-3.5 w-3.5" />}
        allOption={{ label: t('todos.filters.allUsers', 'All users') }}
        pinnedOptions={
          syncedUserId
            ? [{ value: syncedUserId, label: t('todos.filters.myTasks', 'My tasks') }]
            : undefined
        }
        size="sm"
      />

      {/* Status filter */}
      <InfiniteSelect
        value={statusFilter}
        onValueChange={(v) => onStatusChange(v as TodoStatus | undefined)}
        options={ALL_STATUSES.map((s) => ({
          value: s.value,
          label: t(`todos.status.${s.value}`, s.label),
        }))}
        placeholder={t('todos.filters.allStatuses', 'All statuses')}
        allOption={{ label: t('todos.filters.allStatuses', 'All statuses') }}
        icon={
          statusFilter ? (
            <span className={cn('h-2 w-2 rounded-full', STATUS_DOT_COLORS[statusFilter])} />
          ) : (
            <CircleDot className="h-3.5 w-3.5" />
          )
        }
        renderOption={(opt) => (
          <span className="flex items-center gap-2">
            <span
              className={cn(
                'h-2 w-2 rounded-full shrink-0',
                STATUS_DOT_COLORS[opt.value as TodoStatus],
              )}
            />
            {opt.label}
          </span>
        )}
        size="sm"
      />

      {/* Clear filters */}
      {hasNonDefaultFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="h-8 gap-1.5 rounded-full text-muted-foreground hover:text-foreground px-3"
        >
          <X className="h-3.5 w-3.5" />
          {t('common.clearFilters', 'Clear filters')}
        </Button>
      )}
    </div>
  )
}
