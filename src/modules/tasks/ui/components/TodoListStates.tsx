import { Search, SearchX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

interface TodoListEmptyStateProps {
  isSearchActive: boolean
  onClearSearch: () => void
}

export function TodoListEmptyState({ isSearchActive, onClearSearch }: TodoListEmptyStateProps) {
  const { t } = useTranslation()

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="mx-auto w-12 h-12 rounded-full bg-secondary/30 flex items-center justify-center">
          <SearchX className="w-5 h-5 text-muted-foreground/40" />
        </div>
        <p className="text-muted-foreground text-sm font-medium">
          {isSearchActive
            ? t('todos.noSearchResults', 'No tasks match your search')
            : t('todos.empty', 'No tasks found')}
        </p>
        {isSearchActive && (
          <Button variant="ghost" size="sm" onClick={onClearSearch}>
            {t('todos.clearSearch', 'Clear search')}
          </Button>
        )}
      </div>
    </div>
  )
}

export function TodoListErrorState() {
  const { t } = useTranslation()

  return (
    <div className="flex items-center justify-center h-64 animate-in fade-in">
      <div className="text-center space-y-4 max-w-sm">
        <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
          <Search className="w-6 h-6 text-destructive" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight">{t('todos.error.title')}</h2>
          <p className="text-muted-foreground text-sm">{t('todos.error.description')}</p>
        </div>
        <Button variant="outline" onClick={() => window.location.reload()}>
          {t('todos.error.retry')}
        </Button>
      </div>
    </div>
  )
}

export function TodoListSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-11 w-full max-w-sm rounded-2xl" />
      <Skeleton className="h-16 w-full rounded-3xl" />
      <Skeleton className="h-16 w-full rounded-3xl" />
      <Skeleton className="h-16 w-full rounded-3xl" />
    </div>
  )
}
