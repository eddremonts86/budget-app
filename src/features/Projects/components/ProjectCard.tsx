import { IconEdit, IconFolder, IconTrash, IconUsers } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle, Button, CardFooter } from '@/components/ui'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { User } from '@/features/Users/model/types'
import type { Project } from '../model/types'

interface ProjectCardProps {
  project: Project
  users: User[]
  onEdit: (project: Project) => void
  onDelete: (id: string, name: string) => void
}

export function ProjectCard({ project, users, onEdit, onDelete }: ProjectCardProps) {
  const { t } = useTranslation()

  return (
    <Card className="flex flex-col h-full hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-base font-semibold leading-tight">{project.name}</CardTitle>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-primary"
            onClick={() => onEdit(project)}
          >
            <IconEdit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(project.id, project.name)}
          >
            <IconTrash className="h-4 w-4" />
          </Button>
          <div className="h-8 w-8 flex items-center justify-center">
            <IconFolder className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        <div className="text-sm text-muted-foreground mb-4 line-clamp-3">{project.description}</div>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {project.skills?.map((tech) => (
            <Badge key={tech} variant="secondary" className="px-2 py-0.5 text-xs font-normal">
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
          {project.endDate ? new Date(project.endDate).toLocaleDateString() : t('common.noDate')}
        </span>
      </CardFooter>
    </Card>
  )
}
