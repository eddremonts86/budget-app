import { IconCode } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

interface DevtoolsToggleProps {
  value: boolean
  onChange: (value: boolean) => void
}

export function DevtoolsToggle({ value, onChange }: DevtoolsToggleProps) {
  const { t } = useTranslation()

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <IconCode className="size-5 text-muted-foreground" />
          <CardTitle className="text-lg">{t('settings.devtools.title')}</CardTitle>
        </div>
        <CardDescription>{t('settings.devtools.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex flex-col gap-1">
            <Label htmlFor="devtools-switch" className="text-sm font-medium">
              {t('settings.devtools.show')}
            </Label>
            <p className="text-xs text-muted-foreground">
              {t('settings.devtools.showDescription')}
            </p>
          </div>
          <Switch id="devtools-switch" checked={value} onCheckedChange={onChange} />
        </div>
      </CardContent>
    </Card>
  )
}
