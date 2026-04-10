import * as React from 'react'
import { useInfiniteUsers } from '@/modules/users'
import type { InfiniteSelectOption } from '@/shared/ui/InfiniteSelect'

export function useUserFilterOptions() {
  const [userSearch, setUserSearch] = React.useState('')
  const {
    data: usersData,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteUsers(20, userSearch || undefined)

  const options: InfiniteSelectOption[] = React.useMemo(
    () =>
      (usersData?.pages ?? []).flatMap((page) =>
        (page.data ?? []).map((u) => ({ value: u.id, label: u.name, data: u })),
      ),
    [usersData],
  )

  return {
    options,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isLoading,
    userSearch,
    setUserSearch,
  }
}
