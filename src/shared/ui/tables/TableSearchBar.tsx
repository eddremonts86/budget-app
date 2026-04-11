import { Loader2, Search, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'

interface TableSearchBarProps {
  searchInput: string
  onSearchChange: (value: string) => void
  onClear: () => void
  loadedCount: number
  totalCount: number
  showSpinner: boolean
  /** i18n key for placeholder (default: 'common.search') */
  placeholderKey?: string
}

export function TableSearchBar({
  searchInput,
  onSearchChange,
  onClear,
  loadedCount,
  totalCount,
  showSpinner,
  placeholderKey = 'common.search',
}: TableSearchBarProps) {
  const { t } = useTranslation()

  return (
    <div className="flex items-center gap-3 shrink-0">
      <div className="relative flex-1 min-w-0 md:max-w-sm group/search">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/search:text-primary transition-colors" />
        <Input
          placeholder={t(placeholderKey)}
          value={searchInput}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-10 h-11 bg-secondary/20 border-transparent focus:border-primary/30 focus:ring-4 focus:ring-primary/5 rounded-2xl transition-all"
        />
        {searchInput && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="text-sm text-muted-foreground tabular-nums shrink-0">
        {showSpinner ? (
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
        ) : (
          <span>
            {loadedCount}
            {totalCount > loadedCount && ` / ${totalCount}`}
          </span>
        )}
      </div>
    </div>
  )
}
