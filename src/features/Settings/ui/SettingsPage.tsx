import { IconLoader2 } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSettings } from '../hooks/useSettings'
import type { Theme } from '../model'
import { AiConfigForm } from './AiConfigForm'
import { DevtoolsToggle } from './DevtoolsToggle'
import { LanguageSelector } from './LanguageSelector'
import { ThemeSelector } from './ThemeSelector'

export function SettingsPage() {
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
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t('settings.title')}</h2>
        <p className="text-muted-foreground">{t('settings.description')}</p>
      </div>

      <Tabs defaultValue="system" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="system">{t('settings.ai.tabs.system')}</TabsTrigger>
          <TabsTrigger value="ai">{t('settings.ai.tabs.ai')}</TabsTrigger>
        </TabsList>

        <TabsContent value="system" className="space-y-6 pt-4">
          <div className="space-y-4">
            <LanguageSelector value={pendingSettings.language} onChange={setPendingLanguage} />
            <ThemeSelector value={pendingSettings.theme as Theme} onChange={setPendingTheme} />
            <DevtoolsToggle value={pendingSettings.devtoolsVisible} onChange={setPendingDevtools} />
          </div>

          <Separator />

          <div className="flex items-center justify-end gap-3">
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
        </TabsContent>

        <TabsContent value="ai" className="pt-4">
          <AiConfigForm />
        </TabsContent>
      </Tabs>
    </div>
  )
}
