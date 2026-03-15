'use client'

import { m } from 'framer-motion'
import { Mail, Phone, MapPin } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui'
import { ContactForm } from './ContactForm'
import { ContactInfoCard } from './ContactInfoCard'
import { WorkingHoursCard } from './WorkingHoursCard'

export function ContactBlock() {
  const { t } = useTranslation()
  const contactInfo = [
    {
      icon: Mail,
      label: t('home.contact.info.email'),
      value: 'hello@example.com',
      href: 'mailto:hello@example.com',
    },
    {
      icon: Phone,
      label: t('home.contact.info.phone'),
      value: '+1 (555) 123-4567',
      href: 'tel:+15551234567',
    },
    {
      icon: MapPin,
      label: t('home.contact.info.location'),
      value: 'San Francisco, CA',
      href: '#',
    },
  ]

  return (
    <section className="relative w-full overflow-hidden bg-background px-4 py-12 sm:py-16 md:py-20 lg:py-24">
      <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-black bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>

      <div className="mx-auto w-full max-w-6xl">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12 sm:mb-16 md:mb-20 text-center"
        >
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            {t('home.contact.title')}
          </h2>
          <p className="mx-auto max-w-2xl px-4 text-base text-muted-foreground sm:text-lg">
            {t('home.contact.description')}
          </p>
        </m.div>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <m.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="relative overflow-hidden rounded-xl border border-border/40 bg-background/60 p-6 backdrop-blur-sm sm:p-8">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />
              <ContactForm />
            </Card>
          </m.div>

          <div className="space-y-6 lg:space-y-8">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {contactInfo.map((info, index) => (
                <ContactInfoCard key={info.label} {...info} index={index} />
              ))}
            </div>

            <WorkingHoursCard />
          </div>
        </div>
      </div>
    </section>
  )
}
