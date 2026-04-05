import { IconUsers } from '@tabler/icons-react'
import type { AppModuleManifest } from '@/modules/core/types'

export const usersModule: AppModuleManifest = {
  id: 'users',
  title: 'Users',
  description: 'User directory, profile state, and workforce administration for the workspace.',
  legacyFeatureKeys: ['Users'],
  routes: [{ path: '/dashboard/users', kind: 'page' }],
  navigation: [
    {
      id: 'administration',
      title: 'Administration',
      kind: 'main',
      order: 40,
      items: [
        {
          id: 'users',
          titleKey: 'sidebar.main.users',
          fallbackTitle: 'Users',
          to: '/dashboard/users',
          icon: IconUsers,
          order: 10,
        },
      ],
    },
  ],
  widgets: [
    {
      id: 'directory-stats',
      titleKey: 'dashboard.widgets.userStats',
      fallbackTitle: 'User Directory',
      fallbackDescription: 'Team headcount and top departments.',
      defaultVisible: true,
      defaultOrder: 80,
      size: 'sm',
      component: () =>
        import('./components/UserDirectoryStatsWidget').then((m) => ({
          default: m.UserDirectoryStatsWidget,
        })),
    },
  ],
}
