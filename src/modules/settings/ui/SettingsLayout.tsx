import { IconAdjustmentsHorizontal, IconRobot } from '@tabler/icons-react'
import { Link, Outlet } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

export function SettingsLayout() {
  const { t } = useTranslation()

  const linkClass =
    'inline-flex items-center whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:text-foreground h-9 px-4 py-2 flex-1 justify-center gap-2 px-3 py-2 text-foreground/60 hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground'
  const activeClass = 'bg-muted text-primary dark:bg-muted/50 shadow-sm'

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

      <div className="space-y-6">
        <nav className="bg-transparent p-0 flex h-auto w-full gap-2 border-b pb-3">
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

        <div className="w-full">
          <Outlet />
        </div>
      </div>
    </motion.div>
  )
}
