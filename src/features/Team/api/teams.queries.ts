import { useUsers } from '@/features/Users/api/users.queries'
import type { User } from '@/features/Users/model/types'
import { i18n } from '@/shared/lib/i18n'
import { useTQuery, useTQMutation } from '@/shared/lib/query'
import type { Team, TeamWithUsers } from '../model/types'
import { teamsApi } from './teams.api'

export const teamKeys = {
  all: ['teams'] as const,
  lists: () => [...teamKeys.all, 'list'] as const,
  details: () => [...teamKeys.all, 'detail'] as const,
  detail: (id: string) => [...teamKeys.details(), id] as const,
}

export const useTeams = () => {
  return useTQuery(teamKeys.lists(), teamsApi.getAll)
}

export const useTeamsWithMembers = () => {
  const { data: teams = [], isLoading: isTeamsLoading } = useTeams()
  const { data: users = [], isLoading: isUsersLoading } = useUsers()

  const teamsWithMembers = teams.map((team: Team): TeamWithUsers => ({
    ...team,
    members: team.members
      .map((memberId) => users.find((u) => u.id === memberId))
      .filter((u): u is User => !!u),
  }))

  return {
    data: teamsWithMembers,
    isLoading: isTeamsLoading || isUsersLoading,
  }
}

export const useCreateTeam = () => {
  return useTQMutation(['teams', 'create'], teamsApi.create, {
    invalidateKeys: [teamKeys.all],
    successMessage: i18n.t('teams.toast.created'),
  })
}

export const useUpdateTeam = () => {
  return useTQMutation(['teams', 'update'], ({ id, data }: { id: string; data: Parameters<typeof teamsApi.update>[1] }) =>
    teamsApi.update(id, data), {
    invalidateKeys: [teamKeys.all],
    successMessage: i18n.t('teams.toast.updated'),
  })
}

export const useDeleteTeam = () => {
  return useTQMutation(['teams', 'delete'], teamsApi.delete, {
    invalidateKeys: [teamKeys.all],
    successMessage: i18n.t('teams.toast.deleted'),
  })
}
