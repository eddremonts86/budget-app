import { IconFolder } from '@tabler/icons-react'
import { useQueryClient } from '@tanstack/react-query'
import { Plus, Loader2, AlertCircle } from 'lucide-react'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui'
import { getTodosByProjectIdFn } from '@/modules/tasks'
import { useUsersByIds } from '@/modules/users'
import { toast } from '@/shared/lib/toast'
import { deleteProjectFn } from '../api/projects.fn'
import { useProjects, projectsKeys } from '../api/projects.queries'
import type { Project } from '../model/types'
import { CreateProjectSheet } from './CreateProjectSheet'
import { EditProjectSheet } from './EditProjectSheet'
import { ProjectCard } from './ProjectCard'

export function ProjectsPage() {
  const { t } = useTranslation()
  const { data: projects, isLoading, error } = useProjects()
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <h3 className="text-lg font-semibold">{t('projects.error.fetch')}</h3>
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : t('common.unknownError')}
          </p>
          <Button onClick={() => window.location.reload()} variant="outline">
            {t('common.retry')}
          </Button>
        </div>
      </div>
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
      {!projects || projects.length === 0 ? (
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 flex-1 content-start min-h-0 overflow-y-auto">
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
