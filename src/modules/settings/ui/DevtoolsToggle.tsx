import { useTranslation } from 'react-i18next'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

interface DevtoolsToggleProps {
  value: boolean
  onChange: (value: boolean) => void
}

export function DevtoolsToggle({ value, onChange }: DevtoolsToggleProps) {
  const { t } = useTranslation()

  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="flex flex-col gap-1">
        <Label htmlFor="devtools-switch" className="text-sm font-medium">
          {t('settings.devtools.show')}
        </Label>
        <p className="text-xs text-muted-foreground">{t('settings.devtools.showDescription')}</p>
      </div>
      <Switch id="devtools-switch" checked={value} onCheckedChange={onChange} />
    </div>
  )
}
