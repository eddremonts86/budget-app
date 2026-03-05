import { Briefcase, Calendar, CheckCircle2, ChevronRight, Code, Tag } from 'lucide-react'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { toast } from '@/shared/lib/toast'
import { useCreateProject } from '../api/projects.queries'
import type { Project } from '../model/types'
import { ProjectForm, type ProjectFormValues } from './ProjectForm'

interface CreateProjectSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (project: Project) => void
}

export function CreateProjectSheet({ open, onOpenChange, onSuccess }: CreateProjectSheetProps) {
  const { t } = useTranslation()
  const createMutation = useCreateProject()
  const [createdProject, setCreatedProject] = React.useState<Project | null>(null)

  const handleSubmit = async (values: ProjectFormValues) => {
    try {
      const result = await createMutation.mutateAsync({
        ...values,
        departmentId: values.departmentId ?? null,
        skills: values.skills,
      })
      toast.success(t('projects.success.created'))
      setCreatedProject(result as Project)
      if (onSuccess) {
        onSuccess(result as Project)
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to create project:', error)
      toast.error(t('projects.error.create'))
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    // Reset state after sheet animation finishes
    setTimeout(() => setCreatedProject(null), 300)
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) handleClose()
        else onOpenChange(true)
      }}
    >
      <SheetContent className="sm:max-w-[540px] border-l border-border/40 backdrop-blur-3xl bg-background/80 flex flex-col p-0">
        <SheetHeader className="p-6 border-b border-border/40 shrink-0">
          <SheetTitle className="text-2xl font-bold tracking-tight">
            {createdProject ? t('projects.success.created') : t('projects.form.createTitle')}
          </SheetTitle>
          <SheetDescription className="text-base">
            {createdProject
              ? t('projects.form.confirmationDescription')
              : t('projects.form.createDescription')}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {createdProject ? (
            <div className="p-8 space-y-8 animate-in fade-in zoom-in duration-300">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-16 w-16 bg-green-500/10 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{createdProject.name}</h3>
                  <p className="text-muted-foreground">{createdProject.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <Briefcase className="h-3 w-3" />
                    {t('projects.form.typeLabel')}
                  </div>
                  <div className="text-sm font-semibold capitalize">{createdProject.type}</div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <Tag className="h-3 w-3" />
                    {t('projects.form.statusLabel')}
                  </div>
                  <Badge
                    variant="outline"
                    className="capitalize bg-green-500/10 text-green-600 border-green-200"
                  >
                    {createdProject.status}
                  </Badge>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <Calendar className="h-3 w-3" />
                    {t('projects.form.startDateLabel')}
                  </div>
                  <div className="text-sm font-semibold">
                    {new Date(createdProject.startDate).toLocaleDateString()}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <Calendar className="h-3 w-3" />
                    {t('projects.form.endDateLabel')}
                  </div>
                  <div className="text-sm font-semibold">
                    {new Date(createdProject.endDate).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {createdProject.skills && createdProject.skills.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <Code className="h-3 w-3" />
                    {t('projects.form.technologiesLabel')}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {createdProject.skills.map((skill) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-8 flex flex-col gap-3">
                <Button onClick={handleClose} className="w-full gap-2">
                  {t('common.backToHome')}
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCreatedProject(null)}
                  className="w-full"
                >
                  {t('projects.actions.createAnother')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-6">
              <ProjectForm
                onSubmit={handleSubmit}
                onCancel={() => onOpenChange(false)}
                isLoading={createMutation.isPending}
              />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
