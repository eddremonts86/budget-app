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
  widgets: [
    {
      id: 'upcoming-todos',
      titleKey: 'dashboard.widgets.upcomingTodos',
      fallbackTitle: 'Upcoming To-Dos',
      fallbackDescription: 'Priority tasks and upcoming deadlines',
      defaultVisible: true,
      defaultOrder: 40,
      size: 'full',
      component: () =>
        import('./ui/widgets/UpcomingTodosWidget').then((m) => ({
          default: m.UpcomingTodosList,
        })),
    },
  ],
}
