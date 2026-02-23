import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/shared/lib/toast'
import {
    IconAdjustmentsHorizontal,
    IconLoader2,
    IconRobot,
    IconSettings,
} from '@tabler/icons-react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mx-auto w-full max-w-6xl space-y-8 pt-0 pb-6"
    >
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">{t('settings.title')}</h2>
        <p className="text-muted-foreground max-w-2xl">{t('settings.description')}</p>
      </div>

      <Tabs defaultValue="system" orientation="vertical" className="w-full">
        <div className="flex flex-col gap-8 md:flex-row">
          <aside className="md:w-64">
            <TabsList className="bg-transparent p-0 flex flex-row md:flex-col h-auto w-full gap-1 border-b md:border-b-0 md:border-r pb-2 md:pb-0 md:pr-4">
              <TabsTrigger
                value="system"
                className="justify-start gap-2 px-3 py-2 data-[state=active]:bg-muted data-[state=active]:text-primary dark:data-[state=active]:bg-muted/50"
              >
                <IconAdjustmentsHorizontal className="size-4" />
                <span className="truncate">{t('settings.ai.tabs.system')}</span>
              </TabsTrigger>
              <TabsTrigger
                value="ai"
                className="justify-start gap-2 px-3 py-2 data-[state=active]:bg-muted data-[state=active]:text-primary dark:data-[state=active]:bg-muted/50"
              >
                <IconRobot className="size-4" />
                <span className="truncate">{t('settings.ai.tabs.ai')}</span>
              </TabsTrigger>
            </TabsList>
          </aside>

          <div className="flex-1">
            <TabsContent value="system" className="mt-0 space-y-8 outline-none">
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
            </TabsContent>

            <TabsContent value="ai" className="mt-0 outline-none">
              <AiConfigForm />
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </motion.div>
  )
}
