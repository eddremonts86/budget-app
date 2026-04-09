import { IconListDetails } from '@tabler/icons-react'
import type { AppModuleManifest } from '@/modules/core/types'

export const categoriesModule: AppModuleManifest = {
  id: 'categories',
  title: 'Categories',
  description: 'Reusable categorization module for list-based records and domain tagging.',
  routes: [{ path: '/dashboard/categories', kind: 'page' }],
  navigation: [
    {
      id: 'workspace',
      title: 'Workspace',
      kind: 'main',
      order: 20,
      items: [
        {
          id: 'categories',
          titleKey: 'sidebar.main.categories',
          fallbackTitle: 'Categories',
          to: '/dashboard/categories',
          icon: IconListDetails,
          order: 20,
        },
      ],
    },
  ],
  widgets: [
    {
      id: 'list',
      titleKey: 'dashboard.widgets.categoriesList',
      fallbackTitle: 'Categories',
      fallbackDescription: 'All available categories at a glance.',
      defaultVisible: true,
      defaultOrder: 100,
      size: 'sm',
      component: () =>
        import('./components/CategoriesListWidget').then((m) => ({
          default: m.CategoriesListWidget,
        })),
    },
  ],
}
