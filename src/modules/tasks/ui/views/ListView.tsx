import { TooltipProvider } from '@/components/ui/tooltip'
import {
  TableEmptyState,
  TableErrorState,
  TableSearchBar,
  TableSkeleton,
  VirtualTable,
} from '@/shared/ui/tables'
import { useDebouncedSearch } from '@/shared/ui/tables'
import { useInfiniteTodoList } from '../../hooks/useInfiniteTodoList'
import { useTodoActions } from '../../hooks/useTodoActions'
import { useTodoColumns } from '../../hooks/useTodoColumns'
import { useUserMap } from '../../hooks/useUserMap'
import type { Todo } from '../../model/types'

// ── Component ────────────────────────────────────────────────────────────────

interface ListViewProps {
  onEdit: (todo: Todo) => void
  assignedTo?: string
  status?: string
  onTotalCountChange?: (count: number) => void
}

export function ListView({ onEdit, assignedTo, status, onTotalCountChange }: ListViewProps) {
  const { canModify, handleEdit, handleDelete } = useTodoActions(onEdit)
  const { searchInput, setSearchInput, activeSearch, clearSearch } = useDebouncedSearch()

  const {
    todos,
    totalCount,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isFetching,
    isError,
  } = useInfiniteTodoList({ status, assignedTo, search: activeSearch, onTotalCountChange })

  const userMap = useUserMap(todos)
  const columns = useTodoColumns(userMap, canModify, handleEdit, handleDelete)

  if (isError)
    return (
      <TableErrorState
        titleKey="todos.error.title"
        descriptionKey="todos.error.description"
        retryKey="todos.error.retry"
      />
    )
  if (isLoading) return <TableSkeleton />

  const showSearchSpinner = isFetching && !isFetchingNextPage

  return (
    <TooltipProvider>
      <div className="h-full flex flex-col gap-4">
        <TableSearchBar
          searchInput={searchInput}
          onSearchChange={setSearchInput}
          onClear={clearSearch}
          loadedCount={todos.length}
          totalCount={totalCount}
          showSpinner={showSearchSpinner}
          placeholderKey="todos.searchPlaceholder"
        />

        {todos.length > 0 ? (
          <VirtualTable
            columns={columns}
            data={todos}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            onFetchNextPage={fetchNextPage}
            scrollResetKey={`${assignedTo}-${status}-${activeSearch}`}
            rowHeight={64}
            cellClassName="py-4 px-6 text-sm border-b border-border/40 align-top"
          />
        ) : (
          <TableEmptyState
            isSearchActive={activeSearch !== undefined}
            onClearSearch={clearSearch}
            noResultsKey="todos.noSearchResults"
            noDataKey="todos.empty"
            clearSearchKey="todos.clearSearch"
          />
        )}
      </div>
    </TooltipProvider>
  )
}
