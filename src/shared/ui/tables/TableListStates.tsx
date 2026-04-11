import { AlertCircle, SearchX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

// ── Empty State ──────────────────────────────────────────────────────────────

interface TableEmptyStateProps {
  isSearchActive: boolean
  onClearSearch: () => void
  /** i18n key for "no search results" (default: 'common.noResults') */
  noResultsKey?: string
  /** i18n key for "no data" (default: 'common.noData') */
  noDataKey?: string
  /** i18n key for "clear search" button (default: 'common.clearSearch') */
  clearSearchKey?: string
}

export function TableEmptyState({
  isSearchActive,
  onClearSearch,
  noResultsKey = 'common.noResults',
  noDataKey = 'common.noData',
  clearSearchKey = 'common.clearSearch',
}: TableEmptyStateProps) {
  const { t } = useTranslation()

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="mx-auto w-12 h-12 rounded-full bg-secondary/30 flex items-center justify-center">
          <SearchX className="w-5 h-5 text-muted-foreground/40" />
        </div>
        <p className="text-muted-foreground text-sm font-medium">
          {isSearchActive ? t(noResultsKey) : t(noDataKey)}
        </p>
        {isSearchActive && (
          <Button variant="ghost" size="sm" onClick={onClearSearch}>
            {t(clearSearchKey)}
          </Button>
        )}
      </div>
    </div>
  )
}

// ── Error State ──────────────────────────────────────────────────────────────

interface TableErrorStateProps {
  /** i18n key for error title (default: 'common.error.title') */
  titleKey?: string
  /** i18n key for error description (default: 'common.error.description') */
  descriptionKey?: string
  /** i18n key for retry button (default: 'common.retry') */
  retryKey?: string
}

export function TableErrorState({
  titleKey = 'common.error.title',
  descriptionKey = 'common.error.description',
  retryKey = 'common.retry',
}: TableErrorStateProps) {
  const { t } = useTranslation()

  return (
    <div className="flex items-center justify-center h-64 animate-in fade-in">
      <div className="text-center space-y-4 max-w-sm">
        <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-destructive" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight">{t(titleKey)}</h2>
          <p className="text-muted-foreground text-sm">{t(descriptionKey)}</p>
        </div>
        <Button variant="outline" onClick={() => window.location.reload()}>
          {t(retryKey)}
        </Button>
      </div>
    </div>
  )
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

interface TableSkeletonProps {
  /** Number of skeleton rows (default: 3) */
  rows?: number
}

export function TableSkeleton({ rows = 3 }: TableSkeletonProps) {
  return (
    <div className="space-y-4">
      <Skeleton className="h-11 w-full max-w-sm rounded-2xl" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-3xl" />
      ))}
    </div>
  )
}
