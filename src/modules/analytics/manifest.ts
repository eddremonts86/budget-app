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
  widgets: [
    {
      id: 'workload',
      titleKey: 'dashboard.widgets.workload',
      fallbackTitle: 'Team Workload',
      fallbackDescription: 'Workload distribution across team members',
      defaultVisible: true,
      defaultOrder: 20,
      size: 'md',
      component: () =>
        import('./components/WorkloadWidget').then((m) => ({ default: m.WorkloadChart })),
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
        import('./components/ExpenseDistributionWidget').then((m) => ({
          default: m.ExpenseDistributionChart,
        })),
    },
  ],
}
