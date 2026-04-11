import { useDebounce } from '@uidotdev/usehooks'
import * as React from 'react'
import { SEARCH_DEBOUNCE_MS, SEARCH_MIN_CHARS } from '../model/constants'

interface DebouncedSearchResult {
  searchInput: string
  setSearchInput: React.Dispatch<React.SetStateAction<string>>
  activeSearch: string | undefined
  clearSearch: () => void
}

export function useDebouncedSearch(): DebouncedSearchResult {
  const [searchInput, setSearchInput] = React.useState('')
  const debouncedSearch = useDebounce(searchInput, SEARCH_DEBOUNCE_MS)
  const activeSearch = debouncedSearch.length >= SEARCH_MIN_CHARS ? debouncedSearch : undefined

  const clearSearch = React.useCallback(() => setSearchInput(''), [])

  return { searchInput, setSearchInput, activeSearch, clearSearch }
}
