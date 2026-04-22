import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

interface WidgetEditModeContextValue {
  editing: boolean
  setEditing: (editing: boolean) => void
  toggleEditing: () => void
}

const WidgetEditModeContext = createContext<WidgetEditModeContextValue>({
  editing: false,
  setEditing: () => {},
  toggleEditing: () => {},
})

export function WidgetEditModeProvider({ children }: { children: ReactNode }) {
  const [editing, setEditing] = useState(false)
  const toggleEditing = useCallback(() => setEditing((prev) => !prev), [])

  return (
    <WidgetEditModeContext.Provider value={{ editing, setEditing, toggleEditing }}>
      {children}
    </WidgetEditModeContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWidgetEditMode() {
  return useContext(WidgetEditModeContext)
}
