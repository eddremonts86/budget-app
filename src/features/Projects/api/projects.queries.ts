import { useQueryClient, type InfiniteData } from '@tanstack/react-query'
import { i18n } from '@/shared/lib/i18n'
import { useTQuery, useTQMutation, useTQInfinite } from '@/shared/lib/query'
import {
  type ProjectInput,
  createProjectFn,
  deleteProjectFn,
  getDepartmentsFn,
  getProjectByIdFn,
  getProjectsFn,
  updateProjectFn,
  getProjectMembersFn,
  addProjectMemberFn,
  updateProjectMemberFn,
  removeProjectMemberFn,
  type ProjectMemberInput,
  type Project,
  type ProjectMember,
  type ProjectListResponse,
} from './projects.fn'

export const projectsKeys = {
  all: ['projects'] as const,
  lists: () => [...projectsKeys.all, 'list'] as const,
  infinite: () => [...projectsKeys.lists(), 'infinite'] as const,
  departments: () => [...projectsKeys.all, 'departments'] as const,
  detail: (id: string) => [...projectsKeys.all, 'detail', id] as const,
  members: (projectId: string) => [...projectsKeys.all, 'members', projectId] as const,
}

export function useInfiniteProjects(limit = 10) {
  return useTQInfinite<ProjectListResponse, Error, InfiniteData<ProjectListResponse>, number>(
    [...projectsKeys.infinite(), { limit }],
    ({ pageParam }) => getProjectsFn({ data: { pageParam, limit } }),
    {
      initialPageParam: 1,
      getNextPageParam: (lastPage: ProjectListResponse) => lastPage.nextPage,
      cache: 'realtime',
    },
  )
}

export function useProjects() {
  return useTQuery<ProjectListResponse, Error, Project[]>(
    projectsKeys.lists(),
    () => getProjectsFn({ data: { limit: 1000 } }),
    {
      cache: 'realtime',
      select: (res) => (res && res.data) || [],
    },
  )
}

export function useDepartments() {
  return useTQuery<{ id: string; name: string }[]>(projectsKeys.departments(), () =>
    getDepartmentsFn(),
  )
}

export function useProject(id: string) {
  return useTQuery<Project | null>(projectsKeys.detail(id), () => getProjectByIdFn({ data: id }))
}

export function useProjectMembers(projectId: string) {
  return useTQuery<ProjectMember[]>(projectsKeys.members(projectId), () =>
    getProjectMembersFn({ data: projectId }),
  )
}

export function useCreateProject() {
  return useTQMutation(['projects', 'create'], (data: ProjectInput) => createProjectFn({ data }), {
    invalidateKeys: [projectsKeys.lists()],
    successMessage: i18n.t('projects.success.created'),
  })
}

export function useUpdateProject() {
  return useTQMutation(
    ['projects', 'update'],
    ({ id, data }: { id: string; data: Partial<ProjectInput> }) =>
      updateProjectFn({ data: { id, data } }),
    {
      invalidateKeys: [projectsKeys.all],
      successMessage: i18n.t('projects.success.updated'),
    },
  )
}

export function useDeleteProject() {
  return useTQMutation(['projects', 'delete'], (id: string) => deleteProjectFn({ data: id }), {
    invalidateKeys: [projectsKeys.lists()],
    successMessage: i18n.t('projects.success.deleted'),
  })
}

export function useAddProjectMember() {
  const queryClient = useQueryClient()
  return useTQMutation(
    ['projects', 'members', 'add'],
    (data: ProjectMemberInput) => addProjectMemberFn({ data }),
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: projectsKeys.members(variables.projectId) })
        queryClient.invalidateQueries({ queryKey: projectsKeys.lists() })
        queryClient.invalidateQueries({ queryKey: projectsKeys.detail(variables.projectId) })
      },
      successMessage: i18n.t('projects.members.success.added'),
    },
  )
}

export function useUpdateProjectMember() {
  const queryClient = useQueryClient()
  return useTQMutation(
    ['projects', 'members', 'update'],
    (input: {
      projectId: string
      userId: string
      data: { role: 'owner' | 'manager' | 'contributor' | 'viewer' }
    }) => updateProjectMemberFn({ data: input }),
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: projectsKeys.members(variables.projectId) })
        queryClient.invalidateQueries({ queryKey: projectsKeys.lists() })
        queryClient.invalidateQueries({ queryKey: projectsKeys.detail(variables.projectId) })
      },
      successMessage: i18n.t('projects.members.success.updated'),
    },
  )
}

export function useRemoveProjectMember() {
  const queryClient = useQueryClient()
  return useTQMutation(
    ['projects', 'members', 'remove'],
    (input: { projectId: string; userId: string }) => removeProjectMemberFn({ data: input }),
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: projectsKeys.members(variables.projectId) })
        queryClient.invalidateQueries({ queryKey: projectsKeys.lists() })
        queryClient.invalidateQueries({ queryKey: projectsKeys.detail(variables.projectId) })
      },
      successMessage: i18n.t('projects.members.success.removed'),
    },
  )
}
