import { IconMoon, IconSun, IconDeviceDesktop, IconLanguage } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'
import { languageNames, supportedLanguages } from '@/shared/lib/i18n'
import { useTheme } from '@/shared/providers/theme-context'
import { cn } from '@/shared/utils'

const THEME_OPTIONS = [
  { value: 'light' as const, icon: IconSun, labelKey: 'theme.light' },
  { value: 'dark' as const, icon: IconMoon, labelKey: 'theme.dark' },
  { value: 'system' as const, icon: IconDeviceDesktop, labelKey: 'theme.system' },
]

export function QuickSettingsWidget() {
  const { t, i18n } = useTranslation()
  const { theme, setTheme } = useTheme()

  function handleLanguage(lang: string) {
    void i18n.changeLanguage(lang)
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle>{t('dashboard.widgets.quickSettings', 'Quick Settings')}</CardTitle>
        <CardDescription>
          {t('dashboard.widgets.quickSettingsDesc', 'Adjust appearance and language instantly.')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          {/* Theme toggle */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t('settings.theme.label', 'Theme')}
            </p>
            <div className="flex items-center gap-1 rounded-lg border border-border p-1 bg-muted/30">
              {THEME_OPTIONS.map(({ value, icon: Icon, labelKey }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTheme(value)}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
                    theme === value
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden @sm:inline">{t(labelKey)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Language selector */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <IconLanguage className="h-3.5 w-3.5" />
              {t('language.select', 'Language')}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {supportedLanguages.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => handleLanguage(lang)}
                  className={cn(
                    'rounded-md border px-3 py-1 text-sm transition-colors',
                    i18n.language === lang
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted',
                  )}
                >
                  {languageNames[lang]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
