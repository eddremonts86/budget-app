import * as React from 'react'
import { useCategoryActions } from '../../hooks/useCategoryActions'
import { useCategoryColumns } from '../../hooks/useCategoryColumns'
import { useInfiniteCategoryList } from '../../hooks/useInfiniteCategoryList'
import { SEARCH_MIN_CHARS } from '../../model/constants'
import type { Category } from '../../model/types'
import {
  CategoryListEmptyState,
  CategoryListErrorState,
  CategoryListSkeleton,
  CategorySearchBar,
  VirtualCategoryTable,
} from '../components'

interface CategoriesListViewProps {
  onEdit: (category: Category) => void
}

export function CategoriesListView({ onEdit }: CategoriesListViewProps) {
  const [searchInput, setSearchInput] = React.useState('')
  const clearSearch = React.useCallback(() => setSearchInput(''), [])
  const activeSearch = searchInput.length >= SEARCH_MIN_CHARS ? searchInput.toLowerCase() : ''

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
  } = useInfiniteCategoryList()
  const columns = useCategoryColumns(handleEdit, handleDelete)

  // Client-side filtering (backend has no search endpoint)
  const filteredCategories = React.useMemo(() => {
    if (!activeSearch) return categories
    return categories.filter((c) => c.name.toLowerCase().includes(activeSearch))
  }, [categories, activeSearch])

  if (isError) return <CategoryListErrorState />
  if (isLoading) return <CategoryListSkeleton />

  const showSearchSpinner = isFetching && !isFetchingNextPage

  return (
    <div className="h-full flex flex-col gap-4">
      <CategorySearchBar
        searchInput={searchInput}
        onSearchChange={setSearchInput}
        onClear={clearSearch}
        loadedCount={filteredCategories.length}
        totalCount={activeSearch ? filteredCategories.length : totalCount}
        showSpinner={showSearchSpinner}
      />

      {filteredCategories.length > 0 ? (
        <VirtualCategoryTable
          columns={columns}
          data={filteredCategories}
          hasNextPage={!activeSearch && hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onFetchNextPage={fetchNextPage}
          scrollResetKey={activeSearch}
        />
      ) : (
        <CategoryListEmptyState isSearchActive={!!activeSearch} onClearSearch={clearSearch} />
      )}
    </div>
  )
}
