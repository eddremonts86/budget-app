import * as React from 'react'
import { AiSearchContext } from './useAiSearch'

export function AiSearchProvider({ children }: { children: React.ReactNode }) {
  // Initialize state with default values to avoid hydration mismatch
  const [isOpen, setIsOpenState] = React.useState(false)
  const [isPinned, setIsPinnedState] = React.useState(false)

  // Hydrate state from localStorage on mount
  React.useEffect(() => {
    const storedPinned = window.localStorage.getItem('ai-search-pinned') === 'true'
    const storedOpen = window.localStorage.getItem('ai-search-open') === 'true'

    if (storedPinned) {
      setIsPinnedState(true)
      // If pinned, we force it open regardless of stored open state
      setIsOpenState(true)
    } else if (storedOpen) {
      setIsOpenState(true)
    }
  }, [])

  const setIsOpen = React.useCallback((open: boolean) => {
    setIsOpenState(open)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('ai-search-open', String(open))
    }
  }, [])

  const setIsPinned = React.useCallback((pinned: boolean) => {
    setIsPinnedState(pinned)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('ai-search-pinned', String(pinned))
    }
  }, [])

  // If pinned, ensure it stays open when pin state changes
  React.useEffect(() => {
    if (isPinned) {
      setIsOpen(true)
    }
  }, [isPinned, setIsOpen])

  // Memoize context value to prevent unnecessary re-renders in consumers
  const value = React.useMemo(
    () => ({ isOpen, setIsOpen, isPinned, setIsPinned }),
    [isOpen, setIsOpen, isPinned, setIsPinned],
  )

  return <AiSearchContext.Provider value={value}>{children}</AiSearchContext.Provider>
}
