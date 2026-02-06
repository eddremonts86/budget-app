import { useCallback, useMemo, useState } from 'react'
import { useDeleteTodo } from '../api'
import type { Todo } from '../types/todo.types'

interface TodoPage {
  items: Todo[]
}

interface TodoData {
  pages: TodoPage[]
}

export function useTodoList(data: TodoData | undefined) {
  const deleteTodo = useDeleteTodo()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const todos = useMemo(() => {
    const allItems = data?.pages.flatMap((page) => page.items) ?? []
    const uniqueIds = new Set<string>()
    return allItems.filter((item) => {
      if (!item.id || uniqueIds.has(item.id)) return false
      uniqueIds.add(item.id)
      return true
    })
  }, [data])

  const handleEdit = useCallback((id: string) => setEditingId(id), [])
  const handleCancelEdit = useCallback(() => setEditingId(null), [])
  const handleDelete = useCallback(
    (id: string) => {
      setDeletingId(id)
      deleteTodo.mutate(id, { onSettled: () => setDeletingId(null) })
    },
    [deleteTodo],
  )

  return {
    todos,
    editingId,
    deletingId,
    handleEdit,
    handleCancelEdit,
    handleDelete,
  }
}
