import { i18n } from '@/shared/lib/i18n'
import { useTQuery, useTQInfinite, useTQMutation } from '@/shared/lib/query'
import type { User } from '../model/types'
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

export interface UserDirectoryFilters {
  projectId?: string
  teamId?: string
  categoryId?: string
}

function normalizeDirectoryFilters(limit: number, search?: string, filters?: UserDirectoryFilters) {
  return {
    limit,
    search: search?.trim() || undefined,
    projectId: filters?.projectId || undefined,
    teamId: filters?.teamId || undefined,
    categoryId: filters?.categoryId || undefined,
  }
}

export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  directory: (params: ReturnType<typeof normalizeDirectoryFilters>) =>
    [...userKeys.lists(), 'directory', params] as const,
  lookup: (params: { limit: number }) => [...userKeys.lists(), 'lookup', params] as const,
  byIds: (ids: string[]) => [...userKeys.lists(), 'by-ids', ids] as const,
  infinite: (params: ReturnType<typeof normalizeDirectoryFilters>) =>
    [...userKeys.lists(), 'infinite', params] as const,
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

export const useInfiniteUsers = (limit = 10, search?: string, filters?: UserDirectoryFilters) => {
  const params = normalizeDirectoryFilters(limit, search, filters)

  return useTQInfinite(
    userKeys.infinite(params),
    ({ pageParam }) => getUsersFn({ data: { pageParam, ...params } }),
    {
      initialPageParam: 1,
      getNextPageParam: (lastPage) => lastPage.nextPage,
      placeholderData: (prev) => prev,
      maxPages: 50,
    },
  )
}

export const useUsers = (limit = 1000, options?: { enabled?: boolean }) =>
  useTQuery(
    userKeys.lookup({ limit }),
    () => getUsersFn({ data: { limit } }).then((res) => res?.data || []),
    { cache: 'stable' as const, enabled: options?.enabled !== false },
  )

export const useUserDirectory = (search?: string, limit = 50, filters?: UserDirectoryFilters) => {
  const params = normalizeDirectoryFilters(limit, search, filters)

  return useTQuery(userKeys.directory(params), () =>
    getUsersFn({ data: params }).then((res) => res?.data || []),
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
