import { IconFolder, IconTrash } from '@tabler/icons-react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  CardFooter,
} from '@/components/ui'
import { todosApi } from '@/features/Todos/api/todos.api'
import { toast } from '@/shared/lib/toast'
import { projectsApi } from '../api/projects.api'
import { useProjects, projectsKeys } from '../api/projects.queries'

export function ProjectsPage() {
  const { t } = useTranslation()
  const { data: projects, isLoading } = useProjects()
  const queryClient = useQueryClient()

  const handleDelete = async (id: string, name: string) => {
    try {
      // Check if project has associated tasks
      const hasTasks = await todosApi.getByProjectId(id)

      if (hasTasks) {
        toast.error(t('projects.error.hasTasks', { name }))
        return
      }

      if (window.confirm(t('projects.confirm.delete', { name }))) {
        await projectsApi.delete(id)
        queryClient.invalidateQueries({ queryKey: projectsKeys.all })
        toast.success(t('projects.success.deleted'))
      }
    } catch (error) {
      console.error(error)
      toast.error(t('projects.error.delete'))
    }
  }

  if (isLoading) {
    return <div>{t('common.loading')}</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">{t('projects.title')}</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects?.map((project) => (
          <Card key={project.id} className="flex flex-col h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-base font-semibold leading-tight">
                {project.name}
              </CardTitle>
              <div className="flex items-center gap-1">
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
              <div className="flex flex-wrap gap-1.5">
                {project.technologies.map((tech) => (
                  <Badge key={tech} variant="secondary" className="px-2 py-0.5 text-xs font-normal">
                    {tech}
                  </Badge>
                ))}
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
                {project.status.replace('_', ' ')}
              </Badge>
              <span>{new Date(project.endDate).toLocaleDateString()}</span>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
