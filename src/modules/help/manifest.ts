import { IconHelp } from '@tabler/icons-react'
import type { AppModuleManifest } from '@/modules/core/types'

export const helpModule: AppModuleManifest = {
  id: 'help',
  title: 'Help',
  description: 'Support, documentation, and assistance surfaces inside the workspace.',
  routes: [{ path: '/dashboard/help', kind: 'page' }],
  navigation: [
    {
      id: 'support',
      title: 'Support',
      kind: 'secondary',
      order: 50,
      items: [
        {
          id: 'help',
          titleKey: 'sidebar.secondary.help',
          fallbackTitle: 'Help',
          to: '/dashboard/help',
          icon: IconHelp,
          order: 10,
        },
      ],
    },
  ],
  widgets: [
    {
      id: 'quick-links',
      titleKey: 'dashboard.widgets.quickLinks',
      fallbackTitle: 'Quick Links',
      fallbackDescription: 'Fast access to key workspace sections.',
      defaultVisible: true,
      defaultOrder: 110,
      size: 'sm',
      component: () =>
        import('./components/QuickLinksWidget').then((m) => ({
          default: m.QuickLinksWidget,
        })),
    },
  ],
}
