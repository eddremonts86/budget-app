import { IconEdit, IconFolder, IconTrash, IconUsers } from '@tabler/icons-react'
import { useQueryClient } from '@tanstack/react-query'
import { Plus, Loader2, AlertCircle } from 'lucide-react'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle, Button, CardFooter } from '@/components/ui'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { getTodosByProjectIdFn } from '@/features/Todos/api/todos.fn'
import { useUsers } from '@/features/Users/api/users.queries'
import { toast } from '@/shared/lib/toast'
import { deleteProjectFn } from '../api/projects.fn'
import { useProjects, projectsKeys } from '../api/projects.queries'
import type { Project } from '../model/types'
import { CreateProjectSheet } from './CreateProjectSheet'
import { EditProjectSheet } from './EditProjectSheet'

export function ProjectsPage() {
  const { t } = useTranslation()
  const { data: projects, isLoading, error } = useProjects()
  const { data: users = [] } = useUsers()
  const queryClient = useQueryClient()
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [editingProject, setEditingProject] = React.useState<Project | null>(null)

  const handleDelete = async (id: string, name: string) => {
    try {
      // Check if project has associated tasks
      const projectTasks = await getTodosByProjectIdFn({
        data: id,
      })
      const hasTasks = projectTasks && projectTasks.length > 0

      if (hasTasks) {
        toast.error(t('projects.error.hasTasks', { name }))
        return
      }

      if (window.confirm(t('projects.confirm.delete', { name }))) {
        await deleteProjectFn({ data: id })
        queryClient.invalidateQueries({ queryKey: projectsKeys.all })
        toast.success(t('projects.success.deleted'))
      }
    } catch (error) {
      console.error('ProjectsPage: delete error', error)
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
          {projects.map((project: Project) => {
            return (
              <Card key={project.id} className="flex flex-col h-full">
                {/* ... existing card content ... */}
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <CardTitle className="text-base font-semibold leading-tight">
                    {project.name}
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                      onClick={() => setEditingProject(project)}
                    >
                      <IconEdit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(project.id, project.name)}
                    >
                      <IconTrash className="h-4 w-4" />
                    </Button>
                    <div className="h-8 w-8 flex items-center justify-center">
                      <IconFolder className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 pb-4">
                  <div className="text-sm text-muted-foreground mb-4 line-clamp-3">
                    {project.description}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {project.technologies?.map((tech: string) => (
                      <Badge
                        key={tech}
                        variant="secondary"
                        className="px-2 py-0.5 text-xs font-normal"
                      >
                        {tech}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/40">
                    <div className="flex -space-x-2 overflow-hidden">
                      <TooltipProvider>
                        {(project.team || []).slice(0, 5).map((member) => {
                          const user = users.find((u) => u.id === member.userId)
                          if (!user) return null
                          return (
                            <Tooltip key={member.userId}>
                              <TooltipTrigger asChild>
                                <Avatar className="inline-block h-7 w-7 rounded-full ring-2 ring-background">
                                  <AvatarImage src={user.avatar || undefined} alt={user.name} />
                                  <AvatarFallback className="text-[10px] bg-muted text-muted-foreground">
                                    {user.name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs font-medium">{user.name}</p>
                                <p className="text-[10px] text-muted-foreground capitalize">
                                  {t(`projects.roles.${member.role}`)}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          )
                        })}
                        {project.team && project.team.length > 5 && (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-medium ring-2 ring-background">
                            +{project.team.length - 5}
                          </div>
                        )}
                      </TooltipProvider>
                      {(!project.team || project.team.length === 0) && (
                        <span className="text-xs text-muted-foreground italic">
                          {t('projects.form.teamEmpty')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <IconUsers className="h-3.5 w-3.5" />
                      <span>{project.team?.length || 0}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0 flex items-center justify-between text-xs text-muted-foreground">
                  <Badge
                    variant="outline"
                    className={`capitalize font-medium ${
                      project.status === 'active'
                        ? 'bg-green-500/10 text-green-600 border-green-200 dark:border-green-900'
                        : project.status === 'completed'
                          ? 'bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-900'
                          : 'bg-yellow-500/10 text-yellow-600 border-yellow-200 dark:border-yellow-900'
                    }`}
                  >
                    {project.status?.replace('_', ' ') || 'active'}
                  </Badge>
                  <span>
                    {project.endDate
                      ? new Date(project.endDate).toLocaleDateString()
                      : t('common.noDate')}
                  </span>
                </CardFooter>
              </Card>
            )
          })}
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
