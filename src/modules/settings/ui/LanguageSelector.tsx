import { languageFlags, languageNames, supportedLanguages } from '@/shared/lib/i18n'
import { ToggleSelector } from '@/shared/ui/selectores/ToggleSelector'

interface LanguageSelectorProps {
  value: string
  onChange: (value: string) => void
}

export function LanguageSelector({ value, onChange }: LanguageSelectorProps) {
  const items = supportedLanguages.map((lang) => ({
    id: lang,
    name: languageNames[lang],
    flag: languageFlags[lang],
  }))

  return <ToggleSelector items={items} value={value} onChange={onChange} />
}
