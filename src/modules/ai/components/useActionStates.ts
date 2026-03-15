import * as React from 'react'
import type { PersistedActionState } from '@/modules/ai/storage/chat-storage'

// --- Context ---

export interface ActionStatesContextValue {
  states: Record<string, PersistedActionState>
  saveState: (key: string, state: PersistedActionState) => void
}

export const ActionStatesContext = React.createContext<ActionStatesContextValue>({
  states: {},
  saveState: () => {},
})

export function useActionStates() {
  return React.useContext(ActionStatesContext)
}
