import { useUsersByIds } from '@/modules/users'
import type { User } from '@/modules/users'
import { i18n } from '@/shared/lib/i18n'
import { useTQuery, useTQMutation, useTQInfinite } from '@/shared/lib/query'
import type { Team, TeamWithUsers } from '../model/types'
import { type TeamInput, createTeamFn, deleteTeamFn, getTeamsFn, updateTeamFn } from './teams.fn'

export const teamKeys = {
  all: ['teams'] as const,
  lists: () => [...teamKeys.all, 'list'] as const,
  infinite: () => [...teamKeys.lists(), 'infinite'] as const,
  details: () => [...teamKeys.all, 'detail'] as const,
  detail: (id: string) => [...teamKeys.details(), id] as const,
}

export const useTeams = () => {
  return useTQuery(teamKeys.lists(), async () => {
    const response = await getTeamsFn({ data: { limit: 100 } })
    return response.data
  })
}

export const useInfiniteTeams = (limit = 20, search?: string) => {
  return useTQInfinite(
    [...teamKeys.infinite(), { limit, search }],
    ({ pageParam }) => getTeamsFn({ data: { pageParam, limit, search } }),
    {
      initialPageParam: 1,
      getNextPageParam: (lastPage) => lastPage.nextPage,
      maxPages: 20,
    },
  )
}

export const useTeamsWithMembers = () => {
  const { data: teams = [], isLoading: isTeamsLoading } = useTeams()
  const memberIds = Array.from(new Set(teams.flatMap((team) => team.members || [])))
  const { data: users = [], isLoading: isUsersLoading } = useUsersByIds(memberIds)

  const usersById = new Map(users.map((user) => [user.id, user]))

  const teamsWithMembers = teams.map(
    (team: Team): TeamWithUsers => ({
      ...team,
      members: (team.members || [])
        .map((memberId) => usersById.get(memberId as User['id']))
        .filter((u): u is User => !!u),
    }),
  )

  return {
    data: teamsWithMembers,
    isLoading: isTeamsLoading || isUsersLoading,
  }
}

export const useCreateTeam = () => {
  return useTQMutation(['teams', 'create'], (data: TeamInput) => createTeamFn({ data }), {
    invalidateKeys: [teamKeys.all],
    successMessage: i18n.t('team.toast.created'),
  })
}

export const useUpdateTeam = () => {
  return useTQMutation(
    ['teams', 'update'],
    ({ id, data }: { id: string; data: Partial<TeamInput> }) =>
      updateTeamFn({ data: { id, data } }),
    {
      invalidateKeys: [teamKeys.all],
      successMessage: i18n.t('team.toast.updated'),
    },
  )
}

export const useDeleteTeam = () => {
  return useTQMutation(['teams', 'delete'], (id: string) => deleteTeamFn({ data: id }), {
    invalidateKeys: [teamKeys.all],
    successMessage: i18n.t('team.toast.deleted'),
  })
}
