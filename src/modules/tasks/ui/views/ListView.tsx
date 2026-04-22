import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { TooltipProvider } from '@/components/ui/tooltip'
import { TableEmptyState, TableErrorState, TableSearchBar, TableSkeleton, useDebouncedSearch  } from '@/shared/ui/tables'
import { UnifiedDataTable } from '@/shared/ui/tables/DataTable'
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
  const { t } = useTranslation()
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
          <>
            <UnifiedDataTable
              columns={columns}
              data={todos}
              enableGrouping
              groupableColumns={['status', 'priority', 'assignedTo']}
              enablePagination
              pageSizeOptions={[10, 20, 50]}
              initialPageSize={20}
              enableExport
              exportFileName="todos.csv"
              enableSelection={false}
              fullHeight
            />
            <div className="h-10 flex items-center justify-center shrink-0">
              {hasNextPage && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage
                    ? t('common.loading')
                    : t('common.loadMore', { defaultValue: 'Load more' })}
                </Button>
              )}
            </div>
          </>
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
