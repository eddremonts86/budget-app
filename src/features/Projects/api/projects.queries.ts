import { queryOptions, useQuery } from '@tanstack/react-query'
import { projectsApi } from './projects.api'

export const projectsKeys = {
  all: ['projects'] as const,
  lists: () => [...projectsKeys.all, 'list'] as const,
  detail: (id: string) => [...projectsKeys.all, 'detail', id] as const,
}

export const projectsQueries = {
  list: () =>
    queryOptions({
      queryKey: projectsKeys.lists(),
      queryFn: () => projectsApi.getAll(),
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: projectsKeys.detail(id),
      queryFn: () => projectsApi.getById(id),
    }),
}

export function useProjects() {
  return useQuery(projectsQueries.list())
}

export function useProject(id: string) {
  return useQuery(projectsQueries.detail(id))
}
