import { useTranslation } from 'react-i18next'
import { CrudSheetContent, CrudSheetHeader } from '@/components/ui/crud-sheet'
import { Sheet } from '@/components/ui/sheet'
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
          skills: values.skills,
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
      <CrudSheetContent className="sm:max-w-[600px]">
        <CrudSheetHeader
          title={t('projects.form.editTitle')}
          description={t('projects.form.editDescription')}
          onClose={() => onOpenChange(false)}
        />

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
      </CrudSheetContent>
    </Sheet>
  )
}
