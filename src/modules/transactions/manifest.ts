import { IconReport } from '@tabler/icons-react'
import type { AppModuleManifest } from '@/modules/core/types'

export const transactionsModule: AppModuleManifest = {
  id: 'transactions',
  title: 'Transactions',
  description: 'Operational records, approvals, and queue-based financial or workflow tracking.',
  legacyFeatureKeys: ['Transactions'],
  routes: [{ path: '/dashboard/transactions', kind: 'page' }],
  navigation: [
    {
      id: 'operations',
      title: 'Operations',
      kind: 'main',
      order: 30,
      items: [
        {
          id: 'transactions',
          titleKey: 'sidebar.main.transactions',
          fallbackTitle: 'Transactions',
          to: '/dashboard/transactions',
          icon: IconReport,
          badgeId: 'pending-transactions',
          order: 10,
        },
      ],
    },
  ],
  widgets: [
    {
      id: 'pending-approvals',
      titleKey: 'dashboard.widgets.pendingApprovals',
      fallbackTitle: 'Pending Approvals',
      fallbackDescription: 'Transactions awaiting review.',
      defaultVisible: true,
      defaultOrder: 55,
      size: 'sm',
      component: () =>
        import('./components/PendingApprovalsWidget').then((m) => ({
          default: m.PendingApprovalsWidget,
        })),
    },
    {
      id: 'recent',
      titleKey: 'dashboard.widgets.recentTransactions',
      fallbackTitle: 'Recent Transactions',
      fallbackDescription: 'Latest financial activity.',
      defaultVisible: true,
      defaultOrder: 60,
      size: 'lg',
      component: () =>
        import('./components/RecentTransactionsWidget').then((m) => ({
          default: m.RecentTransactionsWidget,
        })),
    },
  ],
}
