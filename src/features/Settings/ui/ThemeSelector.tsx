import { IconMoon, IconSun, IconDeviceDesktop } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { Theme } from '../model'

interface ThemeSelectorProps {
  value: Theme
  onChange: (value: Theme) => void
}

const themeOptions: { value: Theme; icon: typeof IconSun; labelKey: string }[] = [
  { value: 'light', icon: IconSun, labelKey: 'theme.light' },
  { value: 'dark', icon: IconMoon, labelKey: 'theme.dark' },
  { value: 'system', icon: IconDeviceDesktop, labelKey: 'theme.system' },
]

export function ThemeSelector({ value, onChange }: ThemeSelectorProps) {
  const { t } = useTranslation()

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <IconSun className="size-5 text-muted-foreground" />
          <CardTitle className="text-lg">{t('settings.theme.title')}</CardTitle>
        </div>
        <CardDescription>{t('settings.theme.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <ToggleGroup
          type="single"
          value={value}
          onValueChange={(v) => {
            if (v) onChange(v as Theme)
          }}
          className="justify-start"
        >
          {themeOptions.map(({ value: optionValue, icon: Icon, labelKey }) => (
            <ToggleGroupItem
              key={optionValue}
              value={optionValue}
              aria-label={t(labelKey)}
              className="flex items-center gap-2 px-4"
            >
              <Icon className="size-4" />
              <span>{t(labelKey)}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </CardContent>
    </Card>
  )
}
