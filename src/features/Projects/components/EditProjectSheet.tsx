import { useTranslation } from 'react-i18next'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/shared/lib/toast'
import { useUpdateProject } from '../api/projects.queries'
import type { Project } from '../model/types'
import { ProjectForm, type ProjectFormValues } from './ProjectForm'
import { ProjectMembersList } from './ProjectMembersList'

interface EditProjectSheetProps {
  project: Project | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (project: Project) => void
}

export function EditProjectSheet({
  project,
  open,
  onOpenChange,
  onSuccess,
}: EditProjectSheetProps) {
  const { t } = useTranslation()
  const updateMutation = useUpdateProject()

  const handleSubmit = async (values: ProjectFormValues) => {
    if (!project) return

    try {
      const result = await updateMutation.mutateAsync({
        id: project.id,
        data: {
          ...values,
          technologies: values.technologies
            .split(',')
            .map((tech: string) => tech.trim())
            .filter(Boolean),
        },
      })
      toast.success(t('projects.success.updated'))
      if (onSuccess) {
        onSuccess(result as Project)
      }
      onOpenChange(false)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to update project:', error)
      toast.error(t('projects.error.update'))
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[600px] border-l border-border/40 backdrop-blur-3xl bg-background/80 flex flex-col p-0">
        <SheetHeader className="p-6 border-b border-border/40 shrink-0">
          <SheetTitle className="text-2xl font-bold tracking-tight">
            {t('projects.form.editTitle')}
          </SheetTitle>
          <SheetDescription className="text-base">
            {t('projects.form.editDescription')}
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="general" className="flex-1 flex flex-col min-h-0">
          <div className="px-6 py-2 border-b border-border/40 bg-muted/30">
            <TabsList className="w-full justify-start bg-transparent p-0 h-auto gap-6">
              <TabsTrigger
                value="general"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-2 text-base"
              >
                {t('projects.tabs.general')}
              </TabsTrigger>
              <TabsTrigger
                value="team"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-2 text-base"
              >
                {t('projects.tabs.team')}
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto">
            {project && (
              <>
                <TabsContent value="general" className="p-6 m-0 focus-visible:ring-0">
                  <ProjectForm
                    defaultValues={project}
                    onSubmit={handleSubmit}
                    onCancel={() => onOpenChange(false)}
                    isLoading={updateMutation.isPending}
                  />
                </TabsContent>
                <TabsContent value="team" className="p-6 m-0 focus-visible:ring-0">
                  <ProjectMembersList projectId={project.id} />
                </TabsContent>
              </>
            )}
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
