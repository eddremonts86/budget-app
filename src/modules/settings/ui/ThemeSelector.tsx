import { IconMoon, IconSun, IconDeviceDesktop } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
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
  )
}
