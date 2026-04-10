import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import dkCommon from './locales/dk/common.json'
import dkErrors from './locales/dk/errors.json'
// Import locale files directly for better bundling
import enCommon from './locales/en/common.json'
import enErrors from './locales/en/errors.json'
import esCommon from './locales/es/common.json'
import esErrors from './locales/es/errors.json'

export const supportedLanguages = ['en', 'es', 'dk'] as const
export type SupportedLanguage = (typeof supportedLanguages)[number]

export const languageNames: Record<SupportedLanguage, string> = {
  en: 'English',
  es: 'Español',
  dk: 'Dansk',
}

export const languageFlags: Record<SupportedLanguage, string> = {
  en: '🇺🇸',
  es: '🇪🇸',
  dk: '🇩🇰',
}

const resources = {
  en: {
    common: enCommon,
    errors: enErrors,
  },
  es: {
    common: esCommon,
    errors: esErrors,
  },
  dk: {
    common: dkCommon,
    errors: dkErrors,
  },
}

const defaultLocale = import.meta.env.VITE_DEFAULT_LOCALE || 'en'

const shouldIgnoreI18nLog = (args: unknown[]) =>
  args.some((arg) => typeof arg === 'string' && arg.includes('locize.com'))

const i18nLogger = {
  type: 'logger' as const,
  log: (...args: unknown[]) => {
    if (shouldIgnoreI18nLog(args)) return
  },
  warn: () => {},
  error: () => {},
}

i18n
  .use(i18nLogger)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: defaultLocale,
    fallbackLng: 'en',
    supportedLngs: supportedLanguages,
    ns: ['common', 'errors'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false, // React already escapes
    },
    detection: {
      order: [],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
  })

export default i18n
