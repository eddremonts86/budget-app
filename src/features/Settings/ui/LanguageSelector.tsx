import { IconLanguage } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { languageNames, supportedLanguages } from '@/shared/lib/i18n'

interface LanguageSelectorProps {
  value: string
  onChange: (value: string) => void
}

export function LanguageSelector({ value, onChange }: LanguageSelectorProps) {
  const { t } = useTranslation()

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <IconLanguage className="size-5 text-muted-foreground" />
          <CardTitle className="text-lg">{t('settings.language.title')}</CardTitle>
        </div>
        <CardDescription>{t('settings.language.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          <Label htmlFor="language-select">{t('language.select')}</Label>
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger id="language-select" className="w-full max-w-xs">
              <SelectValue placeholder={t('language.select')} />
            </SelectTrigger>
            <SelectContent>
              {supportedLanguages.map((lang) => (
                <SelectItem key={lang} value={lang}>
                  {languageNames[lang]} ({t(`language.${lang}`)})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}
