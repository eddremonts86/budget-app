import { IconMoon, IconSun, IconDeviceDesktop } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { ToggleSelector } from '@/shared/ui/selectores/ToggleSelector'
import type { Theme } from '../model'

interface ThemeSelectorProps {
  value: Theme
  onChange: (value: Theme) => void
}

export function ThemeSelector({ value, onChange }: ThemeSelectorProps) {
  const { t } = useTranslation()

  const items = [
    { id: 'light', name: t('theme.light'), icon: IconSun },
    { id: 'dark', name: t('theme.dark'), icon: IconMoon },
    { id: 'system', name: t('theme.system'), icon: IconDeviceDesktop },
  ]

  return <ToggleSelector items={items} value={value} onChange={(v) => onChange(v as Theme)} />
}
