'use client'

import { m } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui'

export function WorkingHoursCard() {
  const { t } = useTranslation()

  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.6, duration: 0.5 }}
    >
      <Card className="rounded-xl border border-border/40 bg-background/60 p-6 backdrop-blur-sm sm:p-8">
        <h3 className="mb-4 text-xl font-semibold text-foreground">
          {t('home.contact.workingHours.title')}
        </h3>
        <div className="space-y-3 text-sm text-muted-foreground sm:text-base">
          <div className="flex justify-between border-b border-border/40 pb-2">
            <span>{t('home.contact.workingHours.weekdays')}</span>
            <span className="font-medium text-foreground">9:00 AM - 6:00 PM</span>
          </div>
          <div className="flex justify-between border-b border-border/40 pb-2">
            <span>{t('home.contact.workingHours.saturday')}</span>
            <span className="font-medium text-foreground">10:00 AM - 4:00 PM</span>
          </div>
          <div className="flex justify-between pt-1">
            <span>{t('home.contact.workingHours.sunday')}</span>
            <span className="font-medium text-foreground">
              {t('home.contact.workingHours.closed')}
            </span>
          </div>
        </div>
      </Card>
    </m.div>
  )
}
