import fs from 'node:fs'
import path from 'node:path'
import { type Locator, type Page, type TestInfo } from '@playwright/test'

const supportedLanguages = ['en', 'es', 'dk'] as const
type SupportedLanguage = (typeof supportedLanguages)[number]
type Namespace = 'common' | 'errors'

const languageAliases: Record<string, SupportedLanguage> = {
  en: 'en',
  'en-us': 'en',
  en_us: 'en',
  es: 'es',
  'es-es': 'es',
  es_es: 'es',
  dk: 'dk',
  da: 'dk',
  'da-dk': 'dk',
  da_dk: 'dk',
}

const resources = {
  en: {
    common: loadJson('en', 'common'),
    errors: loadJson('en', 'errors'),
  },
  es: {
    common: loadJson('es', 'common'),
    errors: loadJson('es', 'errors'),
  },
  dk: {
    common: loadJson('dk', 'common'),
    errors: loadJson('dk', 'errors'),
  },
} satisfies Record<SupportedLanguage, Record<Namespace, Record<string, unknown>>>

function loadJson(language: SupportedLanguage, namespace: Namespace) {
  const filePath = path.resolve(
    process.cwd(),
    'src',
    'shared',
    'lib',
    'i18n',
    'locales',
    language,
    `${namespace}.json`,
  )
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Record<string, unknown>
}

function normalizeLanguage(value?: string | null): SupportedLanguage | null {
  if (!value) return null
  const normalized = value.toLowerCase().replace('_', '-')
  if (normalized in languageAliases) return languageAliases[normalized]
  const base = normalized.split('-')[0]
  return base in languageAliases ? languageAliases[base] : null
}

function parseKey(key: string): { namespace: Namespace; pathSegments: string[] } {
  const [namespaceCandidate, rest] = key.includes(':') ? key.split(':') : ['common', key]
  const namespace = namespaceCandidate === 'errors' ? 'errors' : 'common'
  return { namespace, pathSegments: rest.split('.').filter(Boolean) }
}

function getNestedValue(value: unknown, pathSegments: string[]): unknown {
  return pathSegments.reduce<unknown>((acc, segment) => {
    if (acc && typeof acc === 'object' && segment in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[segment]
    }
    return undefined
  }, value)
}

function getTranslation(language: SupportedLanguage, key: string): string | undefined {
  const { namespace, pathSegments } = parseKey(key)
  const value = getNestedValue(resources[language][namespace], pathSegments)
  return typeof value === 'string' ? value : undefined
}

function assertKeyInAllLanguages(key: string) {
  const missing = supportedLanguages.filter((lang) => !getTranslation(lang, key))
  if (missing.length) {
    throw new Error(`Faltan traducciones para la clave "${key}": ${missing.join(', ')}`)
  }
}

async function detectAppLanguage(page: Page): Promise<SupportedLanguage> {
  const language = await page.evaluate(() => {
    return (
      window.localStorage.getItem('i18nextLng') ||
      document.documentElement.lang ||
      navigator.language
    )
  })
  return normalizeLanguage(language) ?? 'en'
}

function getLanguageOrder(current: SupportedLanguage) {
  return [current, ...supportedLanguages.filter((lang) => lang !== current)]
}

async function findByKey(
  page: Page,
  key: string,
  buildLocator: (text: string) => Locator,
  options?: { timeout?: number },
) {
  assertKeyInAllLanguages(key)
  const currentLanguage = await detectAppLanguage(page)
  const languages = getLanguageOrder(currentLanguage)
  const timeout = options?.timeout ?? 2000

  for (const language of languages) {
    const text = getTranslation(language, key)
    if (!text) continue
    const locator = buildLocator(text)
    const start = Date.now()
    while (Date.now() - start < timeout) {
      const count = await locator.count()
      for (let index = 0; index < count; index += 1) {
        const candidate = locator.nth(index)
        if (await candidate.isVisible()) {
          return candidate
        }
      }
      await page.waitForTimeout(100)
    }
  }

  const candidates = languages
    .map((language) => getTranslation(language, key))
    .filter((value): value is string => Boolean(value))
  throw new Error(
    `No se encontró el elemento para la clave "${key}". Textos probados: ${candidates.join(' | ')}`,
  )
}

export function getProjectLanguage(testInfo?: TestInfo): SupportedLanguage {
  const projectLanguage = normalizeLanguage(testInfo?.project?.metadata?.language)
  return projectLanguage ?? 'en'
}

export async function applyLanguage(page: Page, testInfo?: TestInfo) {
  const language = getProjectLanguage(testInfo)
  await page.addInitScript((lang) => {
    window.localStorage.setItem('i18nextLng', lang)
    document.documentElement.lang = lang
  }, language)
  return language
}

export async function getByRoleI18n(
  page: Page,
  role: Parameters<Page['getByRole']>[0],
  key: string,
  options?: { exact?: boolean; timeout?: number },
) {
  return findByKey(
    page,
    key,
    (text) => page.getByRole(role, { name: text, exact: options?.exact }),
    { timeout: options?.timeout },
  )
}

export async function getByLabelI18n(
  page: Page,
  key: string,
  options?: { exact?: boolean; timeout?: number },
) {
  return findByKey(page, key, (text) => page.getByLabel(text, { exact: options?.exact }), {
    timeout: options?.timeout,
  })
}

export async function getByPlaceholderI18n(
  page: Page,
  key: string,
  options?: { exact?: boolean; timeout?: number },
) {
  return findByKey(page, key, (text) => page.getByPlaceholder(text, { exact: options?.exact }), {
    timeout: options?.timeout,
  })
}

export async function getByTextI18n(
  page: Page,
  key: string,
  options?: { exact?: boolean; timeout?: number },
) {
  return findByKey(
    page,
    key,
    (text) =>
      page
        .locator('[data-slot]')
        .filter({
          hasText: text,
        })
        .or(page.getByText(text, { exact: options?.exact })),
    {
      timeout: options?.timeout,
    },
  )
}
