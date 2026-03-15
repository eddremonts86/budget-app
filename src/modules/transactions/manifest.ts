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
}
