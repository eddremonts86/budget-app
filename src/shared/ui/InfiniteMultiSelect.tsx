import { Check, ChevronsUpDown, Loader2, Search, X } from 'lucide-react'
import * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/shared/lib/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface InfiniteMultiSelectOption<T = unknown> {
  value: string
  label: string
  description?: string
  data?: T
}

export interface InfiniteMultiSelectProps<T = unknown> {
  /** Currently selected values (controlled) */
  values: string[]
  /** Called when selection changes */
  onValuesChange: (values: string[]) => void

  // --- Data source (from an infinite query) ---
  options: InfiniteMultiSelectOption<T>[]
  hasNextPage?: boolean
  fetchNextPage?: () => void
  isFetchingNextPage?: boolean
  isLoading?: boolean

  // --- Search ---
  onSearchChange?: (query: string) => void
  searchPlaceholder?: string

  // --- Display ---
  placeholder?: string
  icon?: React.ReactNode
  renderOption?: (option: InfiniteMultiSelectOption<T>) => React.ReactNode
  renderChip?: (option: InfiniteMultiSelectOption<T>) => React.ReactNode
  emptyMessage?: string

  /** Exclude these values from the list (e.g. the current item's own id) */
  excludeValues?: string[]

  // --- Styling ---
  triggerClassName?: string
  contentClassName?: string
  disabled?: boolean
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SCROLL_THRESHOLD = 40

function useDebounce<V>(value: V, delay: number): V {
  const [debounced, setDebounced] = React.useState(value)
  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

// ---------------------------------------------------------------------------
// InfiniteMultiSelect
// ---------------------------------------------------------------------------

export function InfiniteMultiSelect<T = unknown>({
  values,
  onValuesChange,
  options,
  hasNextPage,
  fetchNextPage,
  isFetchingNextPage,
  isLoading,
  onSearchChange,
  searchPlaceholder = 'Search…',
  placeholder = 'Select…',
  icon,
  renderOption,
  renderChip,
  emptyMessage = 'No results found',
  excludeValues,
  triggerClassName,
  contentClassName,
  disabled,
}: InfiniteMultiSelectProps<T>) {
  const [open, setOpen] = React.useState(false)
  const [internalSearch, setInternalSearch] = React.useState('')
  const listRef = React.useRef<HTMLDivElement>(null)
  const searchInputRef = React.useRef<HTMLInputElement>(null)

  const debouncedSearch = useDebounce(internalSearch, 300)

  // Propagate debounced search to parent
  React.useEffect(() => {
    onSearchChange?.(debouncedSearch)
  }, [debouncedSearch, onSearchChange])

  // Auto-focus search on open, reset on close
  React.useEffect(() => {
    if (open) {
      const timer = setTimeout(() => searchInputRef.current?.focus(), 50)
      return () => clearTimeout(timer)
    }
    setInternalSearch('')
    onSearchChange?.('')
  }, [open, onSearchChange])

  // Exclude certain values (e.g. current todo id)
  const excludeSet = React.useMemo(() => new Set(excludeValues ?? []), [excludeValues])

  // Local filtering on loaded options
  const localFiltered = React.useMemo(() => {
    let items = options
    if (excludeSet.size > 0) {
      items = items.filter((o) => !excludeSet.has(o.value))
    }
    if (!internalSearch.trim()) return items
    const q = internalSearch.toLowerCase()
    return items.filter((o) => o.label.toLowerCase().includes(q))
  }, [options, internalSearch, excludeSet])

  // Selected set for quick lookup
  const selectedSet = React.useMemo(() => new Set(values), [values])

  // Resolve selected options for chip display
  const selectedOptions = React.useMemo(() => {
    return values
      .map((v) => options.find((o) => o.value === v))
      .filter(Boolean) as InfiniteMultiSelectOption<T>[]
  }, [values, options])

  // Infinite scroll
  const handleScroll = React.useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      if (!hasNextPage || isFetchingNextPage || !fetchNextPage) return
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
      if (scrollHeight - scrollTop - clientHeight < SCROLL_THRESHOLD) {
        fetchNextPage()
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage],
  )

  // Manual wheel handler – react-remove-scroll (Sheet/Dialog) blocks
  // native scroll on elements in a separate Popover portal.
  const handleWheel = React.useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    const { scrollTop, scrollHeight, clientHeight } = el
    const atTop = scrollTop === 0 && e.deltaY < 0
    const atBottom = scrollTop + clientHeight >= scrollHeight && e.deltaY > 0
    if (!atTop && !atBottom) {
      e.stopPropagation()
      el.scrollTop += e.deltaY
    }
  }, [])

  const handleToggle = (optionValue: string) => {
    if (selectedSet.has(optionValue)) {
      onValuesChange(values.filter((v) => v !== optionValue))
    } else {
      onValuesChange([...values, optionValue])
    }
  }

  const handleRemove = (optionValue: string) => {
    onValuesChange(values.filter((v) => v !== optionValue))
  }

  return (
    <div className="space-y-2">
      {/* Chips for selected items */}
      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedOptions.map((opt) => (
            <Badge
              key={opt.value}
              variant="secondary"
              className="gap-1 pr-1 bg-primary/10 text-primary border-primary/20 hover:bg-primary/15"
            >
              <span className="max-w-[180px] truncate text-xs">
                {renderChip ? renderChip(opt) : opt.label}
              </span>
              <Button
                variant="ghost"
                size="icon-xs"
                className="h-4 w-4 p-0 hover:bg-primary/20 rounded-full"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemove(opt.value)
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Popover trigger + dropdown */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild disabled={disabled}>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              'w-full justify-between gap-1.5 font-normal transition-all',
              'h-10 rounded-lg px-4 text-sm',
              'border-border/50 bg-muted/40 hover:bg-muted/70',
              triggerClassName,
            )}
          >
            <span className="flex items-center gap-2 truncate text-muted-foreground">
              {icon && <span className="shrink-0 [&_svg]:h-3.5 [&_svg]:w-3.5">{icon}</span>}
              {values.length > 0 ? `${values.length} selected` : placeholder}
            </span>
            <ChevronsUpDown className="ml-0.5 h-3.5 w-3.5 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          sideOffset={6}
          className={cn('w-80 p-0', contentClassName)}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {/* Search bar */}
          <div className="flex items-center gap-2 px-3 py-2">
            <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              className="h-7 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 text-sm"
              placeholder={searchPlaceholder}
              value={internalSearch}
              onChange={(e) => setInternalSearch(e.target.value)}
            />
            {internalSearch && (
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => {
                  setInternalSearch('')
                  onSearchChange?.('')
                }}
                className="shrink-0"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          <Separator />

          {/* Scrollable list */}
          <div
            ref={listRef}
            role="listbox"
            aria-multiselectable="true"
            className="max-h-56 overflow-y-auto p-1"
            onScroll={handleScroll}
            onWheel={handleWheel}
          >
            {isLoading ? (
              <div className="space-y-1 p-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full rounded-sm" />
                ))}
              </div>
            ) : (
              <>
                {localFiltered.map((opt) => {
                  const isSelected = selectedSet.has(opt.value)
                  return (
                    <Button
                      key={opt.value}
                      variant="ghost"
                      size="sm"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleToggle(opt.value)}
                      className={cn(
                        'w-full justify-start gap-2 font-normal',
                        isSelected && 'bg-accent',
                      )}
                    >
                      <div
                        className={cn(
                          'flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-primary/40',
                          isSelected ? 'bg-primary text-primary-foreground' : 'opacity-50',
                        )}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>
                      <span className="flex-1 truncate text-left">
                        {renderOption ? renderOption(opt) : opt.label}
                      </span>
                    </Button>
                  )
                })}

                {/* Loading more */}
                {isFetchingNextPage && (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}

                {/* Empty state */}
                {!isLoading && localFiltered.length === 0 && (
                  <p className="py-4 text-center text-sm text-muted-foreground">{emptyMessage}</p>
                )}
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
