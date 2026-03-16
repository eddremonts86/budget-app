import { i18n } from '@/shared/lib/i18n'
import { useTQuery, useTQInfinite, useTQMutation } from '@/shared/lib/query'
import { getRolesFn, getSkillsFn, getJobTitlesFn, getExperienceLevelsFn } from './master-data.fn'
import {
  type UserInput,
  createUserFn,
  deleteUserFn,
  getUserByIdFn,
  getUsersByIdsFn,
  getUsersFn,
  updateUserFn,
} from './users.fn'
import type { User } from '../model/types'

export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  directory: (limit: number, search?: string) =>
    [...userKeys.lists(), 'directory', { limit, search }] as const,
  lookup: (limit: number) => [...userKeys.lists(), { limit }] as const,
  byIds: (ids: string[]) => [...userKeys.lists(), 'by-ids', ids] as const,
  infinite: () => [...userKeys.lists(), 'infinite'] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
  master: () => [...userKeys.all, 'master'] as const,
  roles: () => [...userKeys.master(), 'roles'] as const,
  skills: () => [...userKeys.master(), 'skills'] as const,
  jobTitles: () => [...userKeys.master(), 'jobTitles'] as const,
  experienceLevels: () => [...userKeys.master(), 'experienceLevels'] as const,
}

export const useRoles = () => {
  return useTQuery(userKeys.roles(), () => getRolesFn())
}

export const useSkills = () => {
  return useTQuery(userKeys.skills(), () => getSkillsFn())
}

export const useJobTitles = () => {
  return useTQuery(userKeys.jobTitles(), () => getJobTitlesFn())
}

export const useExperienceLevels = () => {
  return useTQuery(userKeys.experienceLevels(), () => getExperienceLevelsFn())
}

export const useInfiniteUsers = (limit = 10, search?: string) => {
  return useTQInfinite(
    [...userKeys.infinite(), { limit, search }],
    ({ pageParam }) => getUsersFn({ data: { pageParam, limit, search } }),
    {
      initialPageParam: 1,
      getNextPageParam: (lastPage) => lastPage.nextPage,
    },
  )
}

export const useUsers = (limit = 1000) => {
  return useTQuery(userKeys.lookup(limit), () =>
    getUsersFn({ data: { limit } }).then((res) => res?.data || []),
  )
}

export const useUserDirectory = (search?: string, limit = 50) => {
  return useTQuery(userKeys.directory(limit, search), () =>
    getUsersFn({ data: { limit, search } }).then((res) => res?.data || []),
  )
}

export const useUsersByIds = (ids: string[]) => {
  const normalizedIds = Array.from(new Set(ids)).sort()

  return useTQuery<User[]>(
    userKeys.byIds(normalizedIds),
    () => getUsersByIdsFn({ data: normalizedIds }),
    {
      enabled: normalizedIds.length > 0,
    },
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
