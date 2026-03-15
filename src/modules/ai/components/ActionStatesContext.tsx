'use client'

import * as React from 'react'
import type { PersistedActionState } from '@/modules/ai/storage/chat-storage'
import { ActionStatesContext } from './useActionStates'

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
