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
  widgets: [
    {
      id: 'stats-cards',
      titleKey: 'dashboard.widgets.statsCards',
      fallbackTitle: 'Stats Cards',
      fallbackDescription: 'Key financial metrics at a glance',
      defaultVisible: true,
      defaultOrder: 10,
      size: 'full',
      component: () =>
        import('./components/DashboardPage').then((m) => ({ default: m.StatsCardsWidget })),
    },
    {
      id: 'workload',
      titleKey: 'dashboard.widgets.workload',
      fallbackTitle: 'Team Workload',
      fallbackDescription: 'Workload distribution across team members',
      defaultVisible: true,
      defaultOrder: 20,
      size: 'md',
      component: () =>
        import('./components/WorkloadChart').then((m) => ({ default: m.WorkloadChart })),
    },
    {
      id: 'expense-distribution',
      titleKey: 'dashboard.widgets.expenseDistribution',
      fallbackTitle: 'Expense Distribution',
      fallbackDescription: 'Expenses broken down by category',
      defaultVisible: true,
      defaultOrder: 30,
      size: 'md',
      component: () =>
        import('./components/ExpenseDistributionChart').then((m) => ({
          default: m.ExpenseDistributionChart,
        })),
    },
    {
      id: 'upcoming-todos',
      titleKey: 'dashboard.widgets.upcomingTodos',
      fallbackTitle: 'Upcoming To-Dos',
      fallbackDescription: 'Priority tasks and upcoming deadlines',
      defaultVisible: true,
      defaultOrder: 40,
      size: 'full',
      component: () =>
        import('./components/UpcomingTodosList').then((m) => ({
          default: m.UpcomingTodosList,
        })),
    },
  ],
}
