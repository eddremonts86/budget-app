import * as React from 'react'

export type AiSearchContextType = {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  isPinned: boolean
  setIsPinned: (pinned: boolean) => void
}

export const AiSearchContext = React.createContext<AiSearchContextType | undefined>(undefined)

export function useAiSearch() {
  const context = React.useContext(AiSearchContext)
  if (!context) {
    throw new Error('useAiSearch must be used within an AiSearchProvider')
  }
  return context
}
