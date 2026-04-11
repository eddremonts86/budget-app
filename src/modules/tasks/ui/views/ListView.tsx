import { TooltipProvider } from '@/components/ui/tooltip'
import { useDebouncedSearch } from '../../hooks/useDebouncedSearch'
import { useInfiniteTodoList } from '../../hooks/useInfiniteTodoList'
import { useTodoActions } from '../../hooks/useTodoActions'
import { useTodoColumns } from '../../hooks/useTodoColumns'
import { useUserMap } from '../../hooks/useUserMap'
import type { Todo } from '../../model/types'
import {
  TodoListEmptyState,
  TodoListErrorState,
  TodoListSkeleton,
  TodoSearchBar,
  VirtualTodoTable,
} from '../components'

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

  if (isError) return <TodoListErrorState />
  if (isLoading) return <TodoListSkeleton />

  const showSearchSpinner = isFetching && !isFetchingNextPage

  return (
    <TooltipProvider>
      <div className="h-full flex flex-col gap-4">
        <TodoSearchBar
          searchInput={searchInput}
          onSearchChange={setSearchInput}
          onClear={clearSearch}
          loadedCount={todos.length}
          totalCount={totalCount}
          showSpinner={showSearchSpinner}
        />

        {todos.length > 0 ? (
          <VirtualTodoTable
            columns={columns}
            data={todos}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            onFetchNextPage={fetchNextPage}
            scrollResetKey={`${assignedTo}-${status}-${activeSearch}`}
          />
        ) : (
          <TodoListEmptyState
            isSearchActive={activeSearch !== undefined}
            onClearSearch={clearSearch}
          />
        )}
      </div>
    </TooltipProvider>
  )
}
