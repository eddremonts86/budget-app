'use client'

import * as React from 'react'
import type { PersistedActionState } from '@/shared/lib/storage/chat-storage'

// --- Context ---

interface ActionStatesContextValue {
  states: Record<string, PersistedActionState>
  saveState: (key: string, state: PersistedActionState) => void
}

const ActionStatesContext = React.createContext<ActionStatesContextValue>({
  states: {},
  saveState: () => {},
})

export function useActionStates() {
  return React.useContext(ActionStatesContext)
}

// --- Provider ---

interface ActionStatesProviderProps {
  states: Record<string, PersistedActionState>
  onSaveState: (key: string, state: PersistedActionState) => void
  children: React.ReactNode
}

export function ActionStatesProvider({ states, onSaveState, children }: ActionStatesProviderProps) {
  const value = React.useMemo(() => ({ states, saveState: onSaveState }), [states, onSaveState])

  return <ActionStatesContext.Provider value={value}>{children}</ActionStatesContext.Provider>
}
