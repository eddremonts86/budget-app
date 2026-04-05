import {
  IconFolder,
  IconReport,
  IconSettings,
  IconHelp,
  IconListDetails,
  IconUsers,
} from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'

const QUICK_LINKS = [
  {
    labelKey: 'dashboard.widgets.linkProjects',
    fallback: 'Projects',
    icon: IconFolder,
    to: '/dashboard/projects',
  },
  {
    labelKey: 'dashboard.widgets.linkTransactions',
    fallback: 'Transactions',
    icon: IconReport,
    to: '/dashboard/transactions',
  },
  {
    labelKey: 'dashboard.widgets.linkTasks',
    fallback: 'Tasks',
    icon: IconListDetails,
    to: '/dashboard/todos',
  },
  {
    labelKey: 'dashboard.widgets.linkTeam',
    fallback: 'Team',
    icon: IconUsers,
    to: '/dashboard/team',
  },
  {
    labelKey: 'dashboard.widgets.linkSettings',
    fallback: 'Settings',
    icon: IconSettings,
    to: '/dashboard/settings',
  },
  {
    labelKey: 'dashboard.widgets.linkHelp',
    fallback: 'Help',
    icon: IconHelp,
    to: '/dashboard/help',
  },
] as const

export function QuickLinksWidget() {
  const { t } = useTranslation()

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle>{t('dashboard.widgets.quickLinks', 'Quick Links')}</CardTitle>
        <CardDescription>
          {t('dashboard.widgets.quickLinksDesc', 'Fast access to key workspace sections.')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 grid-cols-2 @sm:grid-cols-3">
          {QUICK_LINKS.map(({ labelKey, fallback, icon: Icon, to }) => (
            <Link
              key={to}
              to={to}
              className="flex flex-col items-center gap-1.5 rounded-lg border border-border/60 bg-muted/20 px-2 py-3 text-center transition-colors hover:bg-muted hover:border-border"
            >
              <Icon className="h-5 w-5 text-primary" />
              <span className="text-xs font-medium">{t(labelKey, fallback)}</span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
