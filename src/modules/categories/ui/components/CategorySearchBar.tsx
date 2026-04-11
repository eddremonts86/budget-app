import { Loader2, Search, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'

interface CategorySearchBarProps {
  searchInput: string
  onSearchChange: (value: string) => void
  onClear: () => void
  loadedCount: number
  totalCount: number
  showSpinner: boolean
}

export function CategorySearchBar({
  searchInput,
  onSearchChange,
  onClear,
  loadedCount,
  totalCount,
  showSpinner,
}: CategorySearchBarProps) {
  const { t } = useTranslation()

  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={t('common.search')}
          value={searchInput}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 pr-8"
        />
        {searchInput && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-sm hover:bg-muted"
          >
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        )}
      </div>

      <div className="text-sm text-muted-foreground tabular-nums shrink-0">
        {showSpinner ? (
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
        ) : (
          <span>
            {loadedCount}
            {loadedCount < totalCount && ` / ${totalCount}`}
          </span>
        )}
      </div>
    </div>
  )
}
