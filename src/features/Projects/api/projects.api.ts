import { apiClient } from '@/shared/lib/api'
import type { Project } from '../model/types'

export const projectsApi = {
  getAll: async () => {
    const { data } = await apiClient.get<Project[]>('/projects')
    return data
  },
  getById: async (id: string) => {
    const { data } = await apiClient.get<Project>(`/projects/${id}`)
    return data
  },
  create: async (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString()
    const { data } = await apiClient.post<Project>('/projects', {
      ...project,
      createdAt: now,
      updatedAt: now,
    })
    return data
  },
  update: async (id: string, project: Partial<Project>) => {
    const { data } = await apiClient.patch<Project>(`/projects/${id}`, {
      ...project,
      updatedAt: new Date().toISOString(),
    })
    return data
  },
  delete: async (id: string) => {
    await apiClient.delete(`/projects/${id}`)
  },
}
