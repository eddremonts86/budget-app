import { IconMoon, IconSun, IconDeviceDesktop } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'
import { languageFlags, languageNames, supportedLanguages } from '@/shared/lib/i18n'
import { useTheme } from '@/shared/providers/theme-context'
import { ToggleSelector } from '@/shared/ui/selectores/ToggleSelector'

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
            <ToggleSelector
              items={THEME_OPTIONS.map(({ value, icon, labelKey }) => ({
                id: value,
                name: t(labelKey),
                icon,
              }))}
              value={theme}
              onChange={(v) => setTheme(v as typeof theme)}
            />
          </div>

          {/* Language selector */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t('language.select', 'Language')}
            </p>
            <ToggleSelector
              items={supportedLanguages.map((lang) => ({
                id: lang,
                name: languageNames[lang],
                flag: languageFlags[lang],
              }))}
              value={i18n.language}
              onChange={handleLanguage}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
