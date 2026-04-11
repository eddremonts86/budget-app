import * as React from 'react'
import { useUsersByIds } from '@/modules/users'
import type { Todo } from '../model/types'

export type UserInfo = { name: string; avatar: string }

/**
 * Given a list of todos, extracts all unique assignee IDs,
 * batch-fetches user data, and returns a lookup map.
 */
export function useUserMap(todos: Todo[]) {
  const assigneeIds = React.useMemo(() => {
    return Array.from(
      new Set(todos.map((todo) => todo.assignedTo).filter((id): id is string => Boolean(id))),
    )
  }, [todos])

  const { data: users = [] } = useUsersByIds(assigneeIds)

  const userMap = React.useMemo(() => {
    const map = new Map<string, UserInfo>()
    for (const user of users) {
      map.set(user.id, { name: user.name, avatar: user.avatar || '' })
    }
    return map
  }, [users])

  return userMap
}
