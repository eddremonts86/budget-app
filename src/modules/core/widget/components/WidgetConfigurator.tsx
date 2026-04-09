import { Settings2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Button,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Separator,
  Switch,
} from '@/components/ui'
import { useWidgetConfig } from '../config/widget-config'

interface WidgetConfiguratorProps {
  /** Only show widgets from a specific module */
  moduleId?: string
}

export function WidgetConfigurator({ moduleId }: WidgetConfiguratorProps) {
  const { t } = useTranslation()
  const { widgets, toggleWidget, resetToDefaults } = useWidgetConfig()

  const displayed = moduleId ? widgets.filter((w) => w.moduleId === moduleId) : widgets

  if (displayed.length === 0) return null

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings2 className="h-4 w-4" />
          {t('widgets.configure', 'Widgets')}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium leading-none">
              {t('widgets.configurator.title', 'Manage Widgets')}
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetToDefaults}
              className="h-auto p-1 text-xs text-muted-foreground"
            >
              {t('widgets.configurator.reset', 'Reset')}
            </Button>
          </div>
          <Separator />
          <div className="space-y-3">
            {displayed.map((widget) => (
              <div key={widget.qualifiedId} className="flex items-center justify-between gap-3">
                <Label
                  htmlFor={`widget-toggle-${widget.qualifiedId}`}
                  className="flex-1 cursor-pointer"
                >
                  <span className="text-sm font-medium">
                    {t(widget.titleKey, widget.fallbackTitle)}
                  </span>
                  {widget.fallbackDescription ? (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t(widget.descriptionKey ?? '', widget.fallbackDescription)}
                    </p>
                  ) : null}
                </Label>
                <Switch
                  id={`widget-toggle-${widget.qualifiedId}`}
                  checked={widget.visible}
                  onCheckedChange={() => toggleWidget(widget.qualifiedId)}
                />
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
