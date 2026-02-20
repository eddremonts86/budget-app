import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  type ProjectInput,
  createProjectFn,
  deleteProjectFn,
  getProjectByIdFn,
  getProjectsFn,
  updateProjectFn,
} from './projects.fn'

export const projectsKeys = {
  all: ['projects'] as const,
  lists: () => [...projectsKeys.all, 'list'] as const,
  detail: (id: string) => [...projectsKeys.all, 'detail', id] as const,
}

export const projectsQueries = {
  list: () =>
    queryOptions({
      queryKey: projectsKeys.lists(),
      queryFn: () => getProjectsFn({ data: {} }),
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: projectsKeys.detail(id),
      queryFn: () => getProjectByIdFn({ data: id }),
    }),
}

export function useProjects() {
  return useQuery(projectsQueries.list())
}

export function useProject(id: string) {
  return useQuery(projectsQueries.detail(id))
}

export function useCreateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ProjectInput) => createProjectFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectsKeys.lists() })
    },
  })
}

export function useUpdateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProjectInput> }) =>
      updateProjectFn({ data: { id, data } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectsKeys.lists() })
    },
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteProjectFn({ data: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectsKeys.lists() })
    },
  })
}
