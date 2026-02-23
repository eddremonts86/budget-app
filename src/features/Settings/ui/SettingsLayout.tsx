import { Link, Outlet } from '@tanstack/react-router'
import {
  IconAdjustmentsHorizontal,
  IconRobot,
} from '@tabler/icons-react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib/utils'

export function SettingsLayout() {
  const { t } = useTranslation()

  const linkClass = "inline-flex items-center whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:text-foreground h-9 px-4 py-2 w-full justify-start gap-2 px-3 py-2 text-foreground/60 hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground"
  const activeClass = "bg-muted text-primary dark:bg-muted/50 shadow-sm"

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mx-auto w-full max-w-6xl space-y-8 pt-0 pb-6"
    >
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">{t('settings.title')}</h2>
        <p className="text-muted-foreground max-w-2xl">{t('settings.description')}</p>
      </div>

      <div className="flex flex-col gap-8 md:flex-row">
        <aside className="md:w-64">
          <nav className="bg-transparent p-0 flex flex-row md:flex-col h-auto w-full gap-1 border-b md:border-b-0 md:border-r pb-2 md:pb-0 md:pr-4">
            <Link
              to="/dashboard/settings/system"
              className={linkClass}
              activeProps={{ className: activeClass }}
            >
              <IconAdjustmentsHorizontal className="size-4" />
              <span className="truncate">{t('settings.ai.tabs.system')}</span>
            </Link>
            <Link
              to="/dashboard/settings/ia_config"
              className={linkClass}
              activeProps={{ className: activeClass }}
            >
              <IconRobot className="size-4" />
              <span className="truncate">{t('settings.ai.tabs.ai')}</span>
            </Link>
          </nav>
        </aside>

        <div className="flex-1">
          <Outlet />
        </div>
      </div>
    </motion.div>
  )
}
