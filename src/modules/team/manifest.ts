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
}
