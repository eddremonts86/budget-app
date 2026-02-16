import { useEffect, type ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { i18n, supportedLanguages, type SupportedLanguage } from '@/shared/lib/i18n'

interface I18nProviderProps {
  children: ReactNode
}

export function I18nProvider({ children }: I18nProviderProps) {
  useEffect(() => {
    if (!globalThis.window) return

    const normalizeLanguage = (value?: string | null): SupportedLanguage | null => {
      if (!value) return null
      const base = value.toLowerCase().split('-')[0]
      return supportedLanguages.includes(base as SupportedLanguage)
        ? (base as SupportedLanguage)
        : null
    }

    const stored = normalizeLanguage(globalThis.localStorage.getItem('i18nextLng'))
    const browser = normalizeLanguage(globalThis.navigator.language)
    const target = stored || browser

    if (target && i18n.language !== target) {
      i18n.changeLanguage(target)
    }

    if (target) {
      globalThis.localStorage.setItem('i18nextLng', target)
    }
  }, [])

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}
