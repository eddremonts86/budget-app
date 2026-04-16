import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { TableEmptyState, TableErrorState, TableSearchBar, TableSkeleton } from '@/shared/ui/tables'
import { useDebouncedSearch } from '@/shared/ui/tables'
import { UnifiedDataTable } from '@/shared/ui/tables/DataTable'
import { useCategoryActions } from '../../hooks/useCategoryActions'
import { useCategoryColumns } from '../../hooks/useCategoryColumns'
import { useInfiniteCategoryList } from '../../hooks/useInfiniteCategoryList'
import type { Category } from '../../model/types'

interface CategoriesListViewProps {
  onEdit: (category: Category) => void
}

export function CategoriesListView({ onEdit }: CategoriesListViewProps) {
  const { t } = useTranslation()
  const { searchInput, setSearchInput, activeSearch, clearSearch } = useDebouncedSearch()

  const { handleEdit, handleDelete } = useCategoryActions(onEdit)
  const {
    categories,
    totalCount,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isFetching,
    isError,
  } = useInfiniteCategoryList(activeSearch)
  const columns = useCategoryColumns(handleEdit, handleDelete)

  if (isError)
    return (
      <TableErrorState
        titleKey="categories.error.title"
        descriptionKey="categories.error.description"
      />
    )
  if (isLoading) return <TableSkeleton />

  const showSearchSpinner = isFetching && !isFetchingNextPage

  return (
    <div className="h-full flex flex-col gap-4">
      <TableSearchBar
        searchInput={searchInput}
        onSearchChange={setSearchInput}
        onClear={clearSearch}
        loadedCount={categories.length}
        totalCount={totalCount}
        showSpinner={showSearchSpinner}
      />

      {categories.length > 0 ? (
        <>
          <UnifiedDataTable
            columns={columns}
            data={categories}
            enableGrouping
            groupableColumns={['color']}
            enablePagination
            pageSizeOptions={[10, 20, 50]}
            initialPageSize={20}
            enableExport
            exportFileName="categories.csv"
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
        <TableEmptyState isSearchActive={!!activeSearch} onClearSearch={clearSearch} />
      )}
    </div>
  )
}
