import * as React from 'react'
import type { TodoViewType } from '../ui/ViewSwitcher'

export function useTodosView() {
  const [view, setView] = React.useState<TodoViewType>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('todos-view') as TodoViewType) || 'list'
    }
    return 'list'
  })

  const handleViewChange = React.useCallback((newView: TodoViewType) => {
    setView(newView)
    localStorage.setItem('todos-view', newView)
  }, [])

  return { view, handleViewChange }
}
