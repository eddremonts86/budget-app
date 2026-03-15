export type Theme = 'dark' | 'light' | 'system'

export interface SettingsState {
  language: string
  theme: Theme
  devtoolsVisible: boolean
}

export const DEFAULT_SETTINGS: SettingsState = {
  language: 'en',
  theme: 'system',
  devtoolsVisible: true,
}

export const SETTINGS_STORAGE_KEY = 'tanstack-template-settings'
export const DEVTOOLS_STORAGE_KEY = 'tanstack-template-devtools-visible'
