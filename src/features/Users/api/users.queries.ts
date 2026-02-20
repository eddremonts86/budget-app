import { i18n } from '@/shared/lib/i18n'
import { useTQuery, useTQInfinite, useTQMutation } from '@/shared/lib/query'
import type { User } from '../model/types'
import {
  type UserInput,
  createUserFn,
  deleteUserFn,
  getUserByIdFn,
  getUsersFn,
  updateUserFn,
} from './users.fn'

export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  infinite: () => [...userKeys.lists(), 'infinite'] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
}

export const useInfiniteUsers = (limit = 10) => {
  return useTQInfinite(
    [...userKeys.infinite(), { limit }],
    ({ pageParam }) => getUsersFn({ data: { pageParam, limit } }),
    {
      initialPageParam: 1,
      getNextPageParam: (lastPage) => lastPage.nextPage,
    },
  )
}

export const useUsers = () => {
  return useTQuery(userKeys.lists(), () =>
    getUsersFn({ data: { limit: 1000 } }).then((res: { data: User[] }) => res.data),
  )
}

export const useUser = (id: string) => {
  return useTQuery(userKeys.detail(id), () => getUserByIdFn({ data: id }))
}

export const useCreateUser = () => {
  return useTQMutation(['users', 'create'], (data: UserInput) => createUserFn({ data }), {
    invalidateKeys: [userKeys.all],
    successMessage: i18n.t('users.toast.created'),
  })
}

export const useUpdateUser = () => {
  return useTQMutation(
    ['users', 'update'],
    ({ id, data }: { id: string; data: Partial<UserInput> }) =>
      updateUserFn({ data: { id, data } }),
    {
      invalidateKeys: [userKeys.all],
      successMessage: i18n.t('users.toast.updated'),
    },
  )
}

export const useDeleteUser = () => {
  return useTQMutation(['users', 'delete'], (id: string) => deleteUserFn({ data: id }), {
    invalidateKeys: [userKeys.all],
    successMessage: i18n.t('users.toast.deleted'),
  })
}
