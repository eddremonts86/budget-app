import { Globe } from 'lucide-react'
import { useEffect, useState, memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { languageNames, type SupportedLanguage, supportedLanguages } from '@/shared/lib/i18n'
import { cn } from '@/shared/utils'

const languageFlags: Record<SupportedLanguage, string> = {
  en: '🇺🇸',
  es: '🇪🇸',
  dk: '🇩🇰',
}

export const LanguageSelector = memo(function LanguageSelector() {
  const { i18n, t } = useTranslation()
  const currentLanguage = i18n.language as SupportedLanguage
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  const handleLanguageChange = useCallback((lang: SupportedLanguage) => {
    i18n.changeLanguage(lang)
  }, [i18n])

  return (
    <div className="relative group">
      <button
        type="button"
        className="flex items-center gap-2 p-2 rounded-md hover:bg-secondary transition-colors"
        aria-label={t('language.select')}
      >
        {mounted ? (
          <span className="text-base leading-none">{languageFlags[currentLanguage]}</span>
        ) : (
          <Globe className="h-4 w-4" />
        )}
        <span className="text-sm font-medium uppercase">{mounted ? currentLanguage : '--'}</span>
      </button>

      <div
        className={cn(
          'absolute right-0 top-full mt-1 w-40 rounded-md border bg-popover p-1 shadow-md',
          'opacity-0 invisible group-hover:opacity-100 group-hover:visible',
          'transition-all duration-200',
          'z-50',
          !mounted && 'hidden',
        )}
      >
        {supportedLanguages.map((lang) => (
          <button
            key={lang}
            type="button"
            onClick={() => handleLanguageChange(lang)}
            className={cn(
              'w-full px-3 py-2 text-left text-sm rounded-sm flex items-center gap-3',
              'hover:bg-secondary transition-colors',
              mounted && currentLanguage === lang && 'bg-secondary font-medium',
            )}
          >
            <span className="text-base leading-none">{languageFlags[lang]}</span>
            <span>{languageNames[lang]}</span>
          </button>
        ))}
      </div>
    </div>
  )
})
