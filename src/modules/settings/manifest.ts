import { IconSettings } from '@tabler/icons-react'
import type { AppModuleManifest } from '@/modules/core/types'

export const settingsModule: AppModuleManifest = {
  id: 'settings',
  title: 'Settings',
  description: 'System and application configuration surfaces for the template.',
  legacyFeatureKeys: ['Settings'],
  routes: [
    { path: '/dashboard/settings', kind: 'page' },
    { path: '/dashboard/settings/system', kind: 'page' },
    { path: '/dashboard/settings/ia_config', kind: 'page' },
  ],
  navigation: [
    {
      id: 'administration',
      title: 'Administration',
      kind: 'main',
      order: 40,
      items: [
        {
          id: 'settings',
          titleKey: 'sidebar.main.settings',
          fallbackTitle: 'Settings',
          to: '/dashboard/settings',
          icon: IconSettings,
          order: 30,
        },
      ],
    },
  ],
  widgets: [
    {
      id: 'quick-settings',
      titleKey: 'dashboard.widgets.quickSettings',
      fallbackTitle: 'Quick Settings',
      fallbackDescription: 'Adjust appearance and language instantly.',
      defaultVisible: true,
      defaultOrder: 90,
      size: 'sm',
      component: () =>
        import('./components/QuickSettingsWidget').then((m) => ({
          default: m.QuickSettingsWidget,
        })),
    },
    {
      id: 'ai-status',
      titleKey: 'dashboard.widgets.aiStatus',
      fallbackTitle: 'AI Providers',
      fallbackDescription: 'Connection status of configured AI providers.',
      defaultVisible: true,
      defaultOrder: 95,
      size: 'sm',
      component: () =>
        import('./components/AiStatusWidget').then((m) => ({
          default: m.AiStatusWidget,
        })),
    },
  ],
}
