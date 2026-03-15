'use client'

import { motion } from 'framer-motion'
import { Calendar, CheckCircle2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui'
import { TimelineItem } from './TimelineItem'

export function TimelineBlock() {
  const { t } = useTranslation()
  const [mounted, setMounted] = useState(false)

  const timelineEvents = [
    {
      year: '2020',
      title: t('home.timeline.events.seed.title'),
      description: t('home.timeline.events.seed.description'),
      icon: CheckCircle2,
    },
    {
      year: '2021',
      title: t('home.timeline.events.listening.title'),
      description: t('home.timeline.events.listening.description'),
      icon: CheckCircle2,
    },
    {
      year: '2022',
      title: t('home.timeline.events.growth.title'),
      description: t('home.timeline.events.growth.description'),
      icon: CheckCircle2,
    },
    {
      year: '2023',
      title: t('home.timeline.events.impact.title'),
      description: t('home.timeline.events.impact.description'),
      icon: CheckCircle2,
    },
    {
      year: '2024',
      title: t('home.timeline.events.purpose.title'),
      description: t('home.timeline.events.purpose.description'),
      icon: CheckCircle2,
    },
  ]

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <section className="w-full bg-background px-4 py-16 md:py-24">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center md:mb-16"
        >
          <Badge className="mb-4" variant="secondary">
            <Calendar className="mr-1 h-3 w-3" />
            {t('home.timeline.badge')}
          </Badge>
          <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            {t('home.timeline.title')}
          </h2>
          <p className="mx-auto max-w-2xl text-base text-muted-foreground md:text-lg">
            {t('home.timeline.description')}
          </p>
        </motion.div>

        <div className="relative">
          <motion.div
            className="absolute left-4 top-0 h-full w-0.5 bg-gradient-to-b from-primary via-primary/50 to-primary/20 md:left-1/2 md:-translate-x-1/2"
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            style={{ transformOrigin: 'top' }}
          />

          <div className="space-y-12 md:space-y-16">
            {timelineEvents.map((event, index) => (
              <TimelineItem key={event.year} {...event} index={index} isEven={index % 2 === 0} />
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center md:mt-16"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="h-2 w-2 rounded-full bg-primary"
            />
            <span className="text-sm font-medium">{t('home.timeline.footer')}</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
