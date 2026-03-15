import {
  IconAdjustmentsHorizontal,
  IconLoader2,
  IconSettings,
} from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { toast } from '@/shared/lib/toast'
import { useSettings } from '../hooks/useSettings'
import type { Theme } from '../model'
import { DevtoolsToggle } from './DevtoolsToggle'
import { LanguageSelector } from './LanguageSelector'
import { ThemeSelector } from './ThemeSelector'

export function SystemSettings() {
  const { t } = useTranslation()
  const {
    pendingSettings,
    hasChanges,
    isSaving,
    setPendingLanguage,
    setPendingTheme,
    setPendingDevtools,
    saveSettings,
    resetToDefaults,
  } = useSettings()

  async function handleSave() {
    try {
      await saveSettings()
      toast.success(t('settings.messages.saved'))
    } catch {
      toast.error(t('settings.messages.error'))
    }
  }

  function handleReset() {
    resetToDefaults()
    toast.info(t('settings.messages.reset'))
  }

  return (
    <div className="space-y-8 outline-none animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="grid grid-cols-1 gap-6">
        <section className="space-y-6">
          <div className="rounded-xl border bg-card p-6 shadow-sm ring-1 ring-border/5">
            <div className="mb-6 flex items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-2">
                <IconSettings className="size-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold tracking-tight">
                {t('settings.sections.interface')}
              </h3>
            </div>
            <div className="space-y-6">
              <LanguageSelector
                value={pendingSettings.language}
                onChange={setPendingLanguage}
              />
              <ThemeSelector
                value={pendingSettings.theme as Theme}
                onChange={setPendingTheme}
              />
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-xl border bg-card p-6 shadow-sm ring-1 ring-border/5">
            <div className="mb-6 flex items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-2">
                <IconAdjustmentsHorizontal className="size-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold tracking-tight">
                {t('settings.sections.development')}
              </h3>
            </div>
            <div className="space-y-6">
              <DevtoolsToggle
                value={pendingSettings.devtoolsVisible}
                onChange={setPendingDevtools}
              />
            </div>
          </div>
        </section>
      </div>

      <div className="sticky bottom-6 z-10 flex items-center justify-end gap-3 rounded-xl border bg-background/80 p-4 shadow-lg backdrop-blur-md md:static md:shadow-none md:backdrop-blur-none">
        <Button variant="outline" onClick={handleReset} disabled={isSaving}>
          {t('settings.actions.reset')}
        </Button>
        <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
          {isSaving ? (
            <>
              <IconLoader2 className="mr-2 size-4 animate-spin" />
              {t('settings.actions.saving')}
            </>
          ) : (
            t('settings.actions.save')
          )}
        </Button>
      </div>
    </div>
  )
}
