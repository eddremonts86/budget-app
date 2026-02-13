import { i18n } from '@/shared/lib/i18n'
import { useTQuery, useTQInfinite, useTQMutation } from '@/shared/lib/query'
import { usersApi } from './users.api'

export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  infinite: () => [...userKeys.lists(), 'infinite'] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
}

export const useInfiniteUsers = (limit = 10) => {
  return useTQInfinite(
    userKeys.infinite(),
    ({ pageParam }) => usersApi.getAll({ pageParam, limit }),
    {
      initialPageParam: 1,
      getNextPageParam: (lastPage) => lastPage.nextPage,
    },
  )
}

export const useUsers = () => {
  return useTQuery(userKeys.lists(), () => usersApi.getAll({ limit: 1000 }).then((res) => res.data))
}

export const useUser = (id: string) => {
  return useTQuery(userKeys.detail(id), () => usersApi.getById(id))
}

export const useCreateUser = () => {
  return useTQMutation(['users', 'create'], usersApi.create, {
    invalidateKeys: [userKeys.all],
    successMessage: i18n.t('users.toast.created'),
  })
}

export const useUpdateUser = () => {
  return useTQMutation(['users', 'update'], ({ id, data }: { id: string; data: Parameters<typeof usersApi.update>[1] }) =>
    usersApi.update(id, data), {
    invalidateKeys: [userKeys.all],
    successMessage: i18n.t('users.toast.updated'),
  })
}

export const useDeleteUser = () => {
  return useTQMutation(['users', 'delete'], usersApi.delete, {
    invalidateKeys: [userKeys.all],
    successMessage: i18n.t('users.toast.deleted'),
  })
}
