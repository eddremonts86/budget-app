import { useUsers } from '@/features/Users/api/users.queries'
import type { User } from '@/features/Users/model/types'
import { i18n } from '@/shared/lib/i18n'
import { useTQuery, useTQMutation } from '@/shared/lib/query'
import type { Team, TeamWithUsers } from '../model/types'
import { type TeamInput, createTeamFn, deleteTeamFn, getTeamsFn, updateTeamFn } from './teams.fn'

export const teamKeys = {
  all: ['teams'] as const,
  lists: () => [...teamKeys.all, 'list'] as const,
  details: () => [...teamKeys.all, 'detail'] as const,
  detail: (id: string) => [...teamKeys.details(), id] as const,
}

export const useTeams = () => {
  return useTQuery(teamKeys.lists(), async () => {
    const response = await getTeamsFn({ data: { limit: 100 } })
    return response.data
  })
}

export const useTeamsWithMembers = () => {
  const { data: teams = [], isLoading: isTeamsLoading } = useTeams()
  const { data: users = [], isLoading: isUsersLoading } = useUsers()

  const teamsWithMembers = teams.map(
    (team: Team): TeamWithUsers => ({
      ...team,
      members: (team.members || [])
        .map((memberId) => users.find((u: User) => u.id === memberId))
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
