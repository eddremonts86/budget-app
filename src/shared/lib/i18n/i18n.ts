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

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: supportedLanguages,
    ns: ['common', 'errors'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false, // React already escapes
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
  })

export default i18n
