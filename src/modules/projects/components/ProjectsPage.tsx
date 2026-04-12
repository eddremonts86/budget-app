import { IconFolder } from '@tabler/icons-react'
import { useQueryClient } from '@tanstack/react-query'
import { Plus, Loader2, AlertCircle } from 'lucide-react'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui'
import { getTodosByProjectIdFn } from '@/modules/tasks'
import { useUsersByIds } from '@/modules/users'
import { toast } from '@/shared/lib/toast'
import {
  flattenInfinitePages,
  TableSearchBar,
  TableErrorState,
  TableSkeleton,
  useDebouncedSearch,
} from '@/shared/ui/tables'
import { deleteProjectFn } from '../api/projects.fn'
import { useInfiniteProjects, projectsKeys } from '../api/projects.queries'
import type { Project } from '../model/types'
import { CreateProjectSheet } from './CreateProjectSheet'
import { EditProjectSheet } from './EditProjectSheet'
import { ProjectCard } from './ProjectCard'

const PAGE_SIZE = 20

export function ProjectsPage() {
  const { t } = useTranslation()
  const { searchInput, setSearchInput, activeSearch } = useDebouncedSearch()
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useInfiniteProjects(PAGE_SIZE, activeSearch)

  const projects = React.useMemo(() => flattenInfinitePages<Project>(data?.pages), [data?.pages])

  const projectMemberIds = React.useMemo(() => {
    return Array.from(
      new Set(
        (projects || []).flatMap((project) => project.team?.map((member) => member.userId) || []),
      ),
    )
  }, [projects])
  const { data: users = [] } = useUsersByIds(projectMemberIds)
  const usersById = React.useMemo(() => new Map(users.map((user) => [user.id, user])), [users])
  const queryClient = useQueryClient()
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [editingProject, setEditingProject] = React.useState<Project | null>(null)

  // Infinite scroll sentinel
  const sentinelRef = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { threshold: 0.1 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const handleDelete = async (id: string, name: string) => {
    try {
      const projectTasks = await getTodosByProjectIdFn({ data: id })
      const hasTasks = projectTasks && projectTasks.length > 0

      if (hasTasks) {
        toast.error(t('projects.error.hasTasks', { name }))
        return
      }

      toast.error(t('projects.confirm.delete', { name }), {
        description: t('common.undoWarning'),
        action: {
          label: t('common.delete'),
          onClick: async () => {
            try {
              await deleteProjectFn({ data: id })
              queryClient.invalidateQueries({ queryKey: projectsKeys.all })
              toast.success(t('projects.success.deleted'))
            } catch {
              toast.error(t('projects.error.delete'))
            }
          },
        },
        duration: 10000,
      })
    } catch {
      toast.error(t('projects.error.delete'))
    }
  }

  if (isError) {
    return (
      <TableErrorState
        titleKey="projects.error.title"
        descriptionKey="projects.error.fetch"
        retryKey="common.retry"
      />
    )
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between shrink-0">
        <h2 className="text-3xl font-bold tracking-tight">{t('projects.title')}</h2>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          {t('projects.actions.create')}
        </Button>
      </div>
      <TableSearchBar value={searchInput} onChange={setSearchInput} />
      {isLoading ? (
        <TableSkeleton />
      ) : !projects || projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 text-center p-8 border-2 border-dashed rounded-lg">
          <IconFolder className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
          <h3 className="text-lg font-medium">
            {t('projects.empty.title', { defaultValue: 'No projects found' })}
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-6">
            {t('projects.empty.description', {
              defaultValue: 'Create your first project to start tracking your work.',
            })}
          </p>
          <Button onClick={() => setIsCreateOpen(true)} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            {t('projects.actions.create')}
          </Button>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 content-start">
            {projects.map((project: Project) => (
              <ProjectCard
                key={project.id}
                project={project}
                usersById={usersById}
                onEdit={setEditingProject}
                onDelete={handleDelete}
              />
            ))}
          </div>
          <div ref={sentinelRef} className="h-10 flex items-center justify-center">
            {isFetchingNextPage && (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            )}
          </div>
        </div>
      )}
      <CreateProjectSheet open={isCreateOpen} onOpenChange={setIsCreateOpen} />
      <EditProjectSheet
        project={editingProject}
        open={!!editingProject}
        onOpenChange={(open) => !open && setEditingProject(null)}
      />
    </div>
  )
}
