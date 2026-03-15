import { IconDashboard } from '@tabler/icons-react'
import type { AppModuleManifest } from '@/modules/core/types'

export const dashboardModule: AppModuleManifest = {
  id: 'dashboard',
  title: 'Dashboard Shell',
  description: 'Workspace shell, protected layout, and the main dashboard entry route.',
  routes: [
    { path: '/dashboard', kind: 'layout' },
    { path: '/dashboard', kind: 'page' },
  ],
  navigation: [
    {
      id: 'core',
      title: 'Core',
      kind: 'main',
      order: 10,
      items: [
        {
          id: 'dashboard-home',
          titleKey: 'sidebar.main.dashboard',
          fallbackTitle: 'Dashboard',
          to: '/dashboard',
          icon: IconDashboard,
          order: 20,
        },
      ],
    },
  ],
}
