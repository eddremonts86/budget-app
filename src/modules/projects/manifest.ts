import { IconFolder } from '@tabler/icons-react'
import type { AppModuleManifest } from '@/modules/core/types'

export const projectsModule: AppModuleManifest = {
  id: 'projects',
  title: 'Projects',
  description:
    'Project and portfolio management module with planning, staffing, and delivery workflows.',
  legacyFeatureKeys: ['Projects'],
  routes: [{ path: '/dashboard/projects', kind: 'page' }],
  navigation: [
    {
      id: 'workspace',
      title: 'Workspace',
      kind: 'main',
      order: 20,
      items: [
        {
          id: 'projects',
          titleKey: 'sidebar.main.projects',
          fallbackTitle: 'Projects',
          to: '/dashboard/projects',
          icon: IconFolder,
          order: 30,
        },
      ],
    },
  ],
  widgets: [
    {
      id: 'status-overview',
      titleKey: 'dashboard.widgets.projectsStatus',
      fallbackTitle: 'Project Status',
      fallbackDescription: 'Overview of projects by current status.',
      defaultVisible: true,
      defaultOrder: 50,
      size: 'md',
      component: () =>
        import('./components/ProjectsStatusWidget').then((m) => ({
          default: m.ProjectsStatusWidget,
        })),
    },
  ],
}
