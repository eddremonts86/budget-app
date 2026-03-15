import { IconListDetails } from '@tabler/icons-react'
import type { AppModuleManifest } from '@/modules/core/types'

export const tasksModule: AppModuleManifest = {
  id: 'tasks',
  title: 'Tasks',
  description: 'Task management workflows for planning, execution, and assignment.',
  legacyFeatureKeys: ['Todos'],
  routes: [{ path: '/dashboard/todos', kind: 'page' }],
  navigation: [
    {
      id: 'workspace',
      title: 'Workspace',
      kind: 'main',
      order: 20,
      items: [
        {
          id: 'tasks',
          titleKey: 'sidebar.main.todos',
          fallbackTitle: 'Tasks',
          to: '/dashboard/todos',
          icon: IconListDetails,
          order: 10,
        },
      ],
    },
  ],
}
