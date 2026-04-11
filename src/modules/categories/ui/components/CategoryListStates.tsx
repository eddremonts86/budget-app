import { AlertCircle, Search as SearchIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

interface CategoryListEmptyStateProps {
  isSearchActive: boolean
  onClearSearch: () => void
}

export function CategoryListEmptyState({
  isSearchActive,
  onClearSearch,
}: CategoryListEmptyStateProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-muted/50 p-4 mb-4">
        <SearchIcon className="w-8 h-8 text-muted-foreground/60" />
      </div>
      <h3 className="text-lg font-semibold text-muted-foreground">
        {isSearchActive ? t('common.noResults') : t('categories.error.title')}
      </h3>
      {isSearchActive && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onClearSearch}>
          {t('common.clearSearch')}
        </Button>
      )}
    </div>
  )
}

export function CategoryListErrorState() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-destructive/10 p-4 mb-4">
        <AlertCircle className="w-8 h-8 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold">{t('categories.error.title')}</h3>
      <p className="text-muted-foreground mt-1">{t('categories.error.description')}</p>
      <Button variant="outline" size="sm" className="mt-4" onClick={() => window.location.reload()}>
        {t('common.retry')}
      </Button>
    </div>
  )
}

export function CategoryListSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-10 w-full rounded-xl" />
      <Skeleton className="h-10 w-full rounded-xl" />
      <Skeleton className="h-10 w-full rounded-xl" />
      <Skeleton className="h-10 w-full rounded-xl" />
    </div>
  )
}
