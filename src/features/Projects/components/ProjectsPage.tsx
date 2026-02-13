import { IconFolder } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'

export function ProjectsPage() {
  const { t } = useTranslation()
  const projects = [
    { id: '1', name: 'Website Redesign', status: 'In Progress', progress: 45 },
    { id: '2', name: 'Mobile App', status: 'Planning', progress: 10 },
    { id: '3', name: 'API Integration', status: 'Completed', progress: 100 },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">{t('projects.title')}</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <Card key={project.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{project.name}</CardTitle>
              <IconFolder className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{project.progress}%</div>
              <p className="text-xs text-muted-foreground">{project.status}</p>
              <div className="mt-4 h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary" 
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
