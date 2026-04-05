import { IconUsers } from '@tabler/icons-react'
import type { AppModuleManifest } from '@/modules/core/types'

export const teamModule: AppModuleManifest = {
  id: 'team',
  title: 'Team',
  description: 'Team composition, collaboration, and member-focused workspace views.',
  legacyFeatureKeys: ['Team'],
  routes: [{ path: '/dashboard/team', kind: 'page' }],
  navigation: [
    {
      id: 'administration',
      title: 'Administration',
      kind: 'main',
      order: 40,
      items: [
        {
          id: 'team',
          titleKey: 'sidebar.main.team',
          fallbackTitle: 'Team',
          to: '/dashboard/team',
          icon: IconUsers,
          order: 20,
        },
      ],
    },
  ],
  widgets: [
    {
      id: 'overview',
      titleKey: 'dashboard.widgets.teamOverview',
      fallbackTitle: 'Team Overview',
      fallbackDescription: 'Workforce distribution across teams.',
      defaultVisible: true,
      defaultOrder: 70,
      size: 'md',
      component: () =>
        import('./components/TeamOverviewWidget').then((m) => ({
          default: m.TeamOverviewWidget,
        })),
    },
  ],
}
