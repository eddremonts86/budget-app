import { IconWallet } from '@tabler/icons-react'
import type { AppModuleManifest } from '@/modules/core/types'

export const budgetsModule: AppModuleManifest = {
  id: 'budgets',
  title: 'Budgets',
  description:
    'Multi-scope financial budget management with recurring expenses, category limits, and over-budget detection.',
  dependencies: ['core', 'dashboard', 'auth', 'transactions', 'categories'],
  routes: [
    { path: '/dashboard/budgets', kind: 'page' },
    { path: '/dashboard/budgets/$budgetId', kind: 'page' },
    { path: '/api/budgets/process-recurrences', kind: 'api' },
  ],
  navigation: [
    {
      id: 'workspace',
      title: 'Workspace',
      kind: 'main',
      order: 20,
      items: [
        {
          id: 'budgets',
          titleKey: 'sidebar.main.budgets',
          fallbackTitle: 'Budgets',
          to: '/dashboard/budgets',
          icon: IconWallet,
          badgeId: 'over-budget',
          order: 25,
        },
      ],
    },
  ],
  widgets: [
    {
      id: 'monthly-balance',
      titleKey: 'dashboard.widgets.monthlyBalance',
      fallbackTitle: 'Monthly Balance',
      fallbackDescription: 'Net income vs expenses for the current month across all budgets.',
      defaultVisible: true,
      defaultOrder: 30,
      size: 'sm',
      component: () =>
        import('./components/MonthlyBalanceWidget').then((m) => ({
          default: m.MonthlyBalanceWidget,
        })),
    },
    {
      id: 'budget-overview',
      titleKey: 'dashboard.widgets.budgetOverview',
      fallbackTitle: 'Budget Overview',
      fallbackDescription: 'Top active budgets with spending progress and over-budget alerts.',
      defaultVisible: true,
      defaultOrder: 35,
      size: 'md',
      component: () =>
        import('./components/BudgetOverviewWidget').then((m) => ({
          default: m.BudgetOverviewWidget,
        })),
    },
    {
      id: 'spending-by-category',
      titleKey: 'dashboard.widgets.spendingByCategory',
      fallbackTitle: 'Spending by Category',
      fallbackDescription: 'Top spending categories across all active budgets.',
      defaultVisible: true,
      defaultOrder: 40,
      size: 'md',
      component: () =>
        import('./components/SpendingByCategoryWidget').then((m) => ({
          default: m.SpendingByCategoryWidget,
        })),
    },
  ],
}
