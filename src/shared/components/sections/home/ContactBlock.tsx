'use client'

import { motion } from 'framer-motion'
import { Mail, Phone, MapPin, Send } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, Button, Input, Textarea, Label } from '@/shared/components/ui'

export function ContactBlock() {
  const { t } = useTranslation()
  const [mounted, setMounted] = useState(false)

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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <section className="relative w-full overflow-hidden bg-background px-4 py-12 sm:py-16 md:py-20 lg:py-24">
      <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-black bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>

      <div className="mx-auto w-full max-w-6xl">
        <motion.div
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
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="relative overflow-hidden rounded-xl border border-border/40 bg-background/60 p-6 backdrop-blur-sm sm:p-8">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />
              <form className="relative z-10 space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium">
                      {t('home.contact.form.name.label')}
                    </Label>
                    <Input
                      id="name"
                      placeholder={t('home.contact.form.name.placeholder')}
                      className="bg-background/50 transition-colors focus:bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      {t('home.contact.form.email.label')}
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder={t('home.contact.form.email.placeholder')}
                      className="bg-background/50 transition-colors focus:bg-background"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject" className="text-sm font-medium">
                    {t('home.contact.form.subject.label')}
                  </Label>
                  <Input
                    id="subject"
                    placeholder={t('home.contact.form.subject.placeholder')}
                    className="bg-background/50 transition-colors focus:bg-background"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message" className="text-sm font-medium">
                    {t('home.contact.form.message.label')}
                  </Label>
                  <Textarea
                    id="message"
                    placeholder={t('home.contact.form.message.placeholder')}
                    className="min-h-[150px] bg-background/50 transition-colors focus:bg-background"
                  />
                </div>

                <Button className="group w-full gap-2 py-6 text-base font-semibold transition-all hover:shadow-lg hover:shadow-primary/20">
                  {t('home.contact.form.submit')}
                  <Send className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                </Button>
              </form>
            </Card>
          </motion.div>

          <div className="space-y-6 lg:space-y-8">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {contactInfo.map((info, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
                >
                  <Card className="group relative overflow-hidden rounded-xl border border-border/40 bg-background/60 p-4 transition-all duration-300 hover:border-foreground/20 hover:shadow-md hover:-translate-y-1 backdrop-blur-sm sm:p-6">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <a href={info.href} className="relative z-10 flex items-center gap-4">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                        <info.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="mb-1 font-semibold text-foreground">{info.label}</h3>
                        <p className="text-sm text-muted-foreground transition-colors group-hover:text-foreground/80">
                          {info.value}
                        </p>
                      </div>
                    </a>
                  </Card>
                </motion.div>
              ))}
            </div>

            <motion.div
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
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
