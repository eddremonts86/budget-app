import { useDebounce } from '@uidotdev/usehooks'
import * as React from 'react'
import { SEARCH_DEBOUNCE_MS, SEARCH_MIN_CHARS } from './constants'

interface UseDebouncedSearchOptions {
  /** Minimum characters required to activate search (default: SEARCH_MIN_CHARS) */
  minChars?: number
  /** Debounce delay in ms (default: SEARCH_DEBOUNCE_MS) */
  debounceMs?: number
}

interface DebouncedSearchResult {
  searchInput: string
  setSearchInput: React.Dispatch<React.SetStateAction<string>>
  /** undefined when input length < minChars; otherwise the debounced string */
  activeSearch: string | undefined
  clearSearch: () => void
}

export function useDebouncedSearch(options?: UseDebouncedSearchOptions): DebouncedSearchResult {
  const minChars = options?.minChars ?? SEARCH_MIN_CHARS
  const debounceMs = options?.debounceMs ?? SEARCH_DEBOUNCE_MS

  const [searchInput, setSearchInput] = React.useState('')
  const debouncedSearch = useDebounce(searchInput, debounceMs)
  const activeSearch = debouncedSearch.length >= minChars ? debouncedSearch : undefined

  const clearSearch = React.useCallback(() => setSearchInput(''), [])

  return { searchInput, setSearchInput, activeSearch, clearSearch }
}
