import { apiClient } from '@/shared/lib/api'
import type { Team } from '../model/types'

export const teamsApi = {
  getAll: async () => {
    const { data } = await apiClient.get<Team[]>('/teams')
    return data
  },
  getById: async (id: string) => {
    const { data } = await apiClient.get<Team>(`/teams/${id}`)
    return data
  },
  create: async (team: Omit<Team, 'id'>) => {
    const { data } = await apiClient.post<Team>('/teams', team)
    return data
  },
  update: async (id: string, team: Partial<Team>) => {
    const { data } = await apiClient.patch<Team>(`/teams/${id}`, team)
    return data
  },
  delete: async (id: string) => {
    await apiClient.delete(`/teams/${id}`)
  },
}
