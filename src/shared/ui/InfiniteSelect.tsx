import { Check, ChevronsUpDown, Loader2, Search, X } from 'lucide-react'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/shared/lib/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface InfiniteSelectOption<T = unknown> {
  value: string
  label: string
  data?: T
}

export interface InfiniteSelectProps<T = unknown> {
  /** Currently selected value (controlled) */
  value: string | undefined
  /** Called when the user picks a new option */
  onValueChange: (value: string | undefined) => void

  // --- Data source (from an infinite query) ---
  options: InfiniteSelectOption<T>[]
  hasNextPage?: boolean
  fetchNextPage?: () => void
  isFetchingNextPage?: boolean
  isLoading?: boolean

  // --- Search ---
  searchQuery?: string
  onSearchChange?: (query: string) => void
  searchPlaceholder?: string

  // --- Display ---
  placeholder?: string
  icon?: React.ReactNode
  renderOption?: (option: InfiniteSelectOption<T>) => React.ReactNode
  renderValue?: (option: InfiniteSelectOption<T>) => React.ReactNode

  // --- Special options ---
  allOption?: { label: string }
  pinnedOptions?: InfiniteSelectOption<T>[]

  // --- Styling ---
  triggerClassName?: string
  contentClassName?: string
  size?: 'sm' | 'default'
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
// InfiniteSelect
// ---------------------------------------------------------------------------

export function InfiniteSelect<T = unknown>({
  value,
  onValueChange,
  options,
  hasNextPage,
  fetchNextPage,
  isFetchingNextPage,
  isLoading,
  searchQuery: externalSearch,
  onSearchChange,
  searchPlaceholder = 'Search…',
  placeholder = 'Select…',
  icon,
  renderOption,
  renderValue,
  allOption,
  pinnedOptions,
  triggerClassName,
  contentClassName,
  size = 'default',
  disabled,
}: InfiniteSelectProps<T>) {
  const [open, setOpen] = React.useState(false)
  const [internalSearch, setInternalSearch] = React.useState('')
  const listRef = React.useRef<HTMLDivElement>(null)
  const searchInputRef = React.useRef<HTMLInputElement>(null)

  const searchValue = externalSearch ?? internalSearch
  const debouncedSearch = useDebounce(internalSearch, 300)

  // Propagate debounced search to parent when using internal state
  React.useEffect(() => {
    if (externalSearch === undefined && onSearchChange) {
      onSearchChange(debouncedSearch)
    }
  }, [debouncedSearch, onSearchChange, externalSearch])

  // Auto-focus search & reset on close
  React.useEffect(() => {
    if (open) {
      const timer = setTimeout(() => searchInputRef.current?.focus(), 50)
      return () => clearTimeout(timer)
    }
    setInternalSearch('')
    onSearchChange?.('')
  }, [open, onSearchChange])

  // Local filtering on loaded options
  const localFiltered = React.useMemo(() => {
    if (!searchValue.trim()) return options
    const q = searchValue.toLowerCase()
    return options.filter((o) => o.label.toLowerCase().includes(q))
  }, [options, searchValue])

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

  // Manual wheel handler – react-remove-scroll (used by Sheet/Dialog) blocks
  // native scroll on elements rendered in a separate Popover portal.
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

  // Resolve the selected option for the trigger label
  const selectedOption = React.useMemo(() => {
    if (!value) return undefined
    return pinnedOptions?.find((o) => o.value === value) ?? options.find((o) => o.value === value)
  }, [value, options, pinnedOptions])

  const triggerLabel = React.useMemo(() => {
    if (!value && allOption) return allOption.label
    if (!selectedOption) return placeholder
    if (renderValue) return renderValue(selectedOption)
    return selectedOption.label
  }, [value, allOption, selectedOption, placeholder, renderValue])

  const handleSelect = (optionValue: string | undefined) => {
    onValueChange(optionValue)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <Button
          variant="outline"
          size={size === 'sm' ? 'sm' : 'default'}
          role="combobox"
          aria-expanded={open}
          className={cn(
            'rounded-full gap-1.5 font-medium transition-all',
            size === 'sm' ? 'h-8 px-3' : 'h-9 px-4',
            value
              ? 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary'
              : 'border-border/50 bg-muted/40 hover:bg-muted/70',
            triggerClassName,
          )}
        >
          {icon && <span className="shrink-0 [&_svg]:h-3.5 [&_svg]:w-3.5">{icon}</span>}
          <span className="truncate">{triggerLabel}</span>
          <ChevronsUpDown className="ml-0.5 h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={6}
        className={cn('w-60 p-0', contentClassName)}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {/* Search bar */}
        <div className="flex items-center gap-2 px-3 py-2">
          <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            className="h-7 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 text-sm"
            placeholder={searchPlaceholder}
            value={externalSearch !== undefined ? externalSearch : internalSearch}
            onChange={(e) => {
              const val = e.target.value
              if (externalSearch !== undefined && onSearchChange) {
                onSearchChange(val)
              } else {
                setInternalSearch(val)
              }
            }}
          />
          {searchValue && (
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
              {/* "All" option */}
              {allOption && (
                <OptionRow selected={!value} onClick={() => handleSelect(undefined)}>
                  {allOption.label}
                </OptionRow>
              )}

              {/* Pinned options */}
              {pinnedOptions?.map((opt) => (
                <OptionRow
                  key={`pinned-${opt.value}`}
                  selected={value === opt.value}
                  onClick={() => handleSelect(opt.value)}
                >
                  {renderOption ? renderOption(opt) : opt.label}
                </OptionRow>
              ))}

              {/* Separator between pinned and main list */}
              {pinnedOptions && pinnedOptions.length > 0 && localFiltered.length > 0 && (
                <Separator className="my-1" />
              )}

              {/* Main options */}
              {localFiltered.map((opt) => (
                <OptionRow
                  key={opt.value}
                  selected={value === opt.value}
                  onClick={() => handleSelect(opt.value)}
                >
                  {renderOption ? renderOption(opt) : opt.label}
                </OptionRow>
              ))}

              {/* Loading more */}
              {isFetchingNextPage && (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}

              {/* Empty state */}
              {!isLoading && localFiltered.length === 0 && !allOption && !pinnedOptions?.length && (
                <p className="py-4 text-center text-sm text-muted-foreground">No results found</p>
              )}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// ---------------------------------------------------------------------------
// OptionRow (internal)
// ---------------------------------------------------------------------------

function OptionRow({
  selected,
  onClick,
  children,
}: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      role="option"
      aria-selected={selected}
      onClick={onClick}
      className={cn('w-full justify-start gap-2 font-normal', selected && 'bg-accent font-medium')}
    >
      <span className="flex-1 truncate text-left">{children}</span>
      {selected && <Check className="h-4 w-4 shrink-0" />}
    </Button>
  )
}
