import { IconChartBar } from '@tabler/icons-react'
import type { AppModuleManifest } from '@/modules/core/types'

export const analyticsModule: AppModuleManifest = {
  id: 'analytics',
  title: 'Analytics',
  description: 'Reporting and insights surfaces for workspace activity and module metrics.',
  routes: [{ path: '/dashboard/analytics', kind: 'page' }],
  navigation: [
    {
      id: 'operations',
      title: 'Operations',
      kind: 'main',
      order: 30,
      items: [
        {
          id: 'analytics',
          titleKey: 'sidebar.main.analytics',
          fallbackTitle: 'Analytics',
          to: '/dashboard/analytics',
          icon: IconChartBar,
          order: 20,
        },
      ],
    },
  ],
}
