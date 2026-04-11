import { useQueryClient } from '@tanstack/react-query'
import * as React from 'react'
import { getUsersByIdsFn, userKeys } from '@/modules/users'
import type { Todo } from '../model/types'

export type UserInfo = { name: string; avatar: string }

/**
 * Given a list of todos, extracts unique assignee IDs and batch-fetches
 * user data **incrementally**. Only newly discovered IDs trigger a network
 * request; previously resolved users accumulate in the returned Map.
 *
 * This avoids query-key thrashing during infinite scroll, where the full
 * ID list grows faster than a single all-IDs query can complete.
 */
export function useUserMap(todos: Todo[]) {
  const queryClient = useQueryClient()
  const [userMap, setUserMap] = React.useState(new Map<string, UserInfo>())
  const requestedRef = React.useRef(new Set<string>())

  const assigneeIds = React.useMemo(
    () =>
      Array.from(new Set(todos.map((t) => t.assignedTo).filter((id): id is string => Boolean(id)))),
    [todos],
  )

  React.useEffect(() => {
    const missing = assigneeIds.filter((id) => !requestedRef.current.has(id))
    if (missing.length === 0) return

    // Mark as requested immediately to avoid duplicate fetches
    for (const id of missing) {
      requestedRef.current.add(id)
    }

    const sorted = [...missing].sort()

    queryClient
      .fetchQuery({
        queryKey: userKeys.byIds(sorted),
        queryFn: () => getUsersByIdsFn({ data: sorted }),
        staleTime: 5 * 60 * 1000,
      })
      .then((users) => {
        if (users.length === 0) return
        setUserMap((prev) => {
          const next = new Map(prev)
          for (const user of users) {
            next.set(user.id, { name: user.name, avatar: user.avatar || '' })
          }
          return next
        })
      })
  }, [assigneeIds, queryClient])

  return userMap
}
