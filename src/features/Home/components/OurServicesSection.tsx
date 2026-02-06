'use client'

import { motion, type Variants } from 'framer-motion'
import { Code, Palette, Smartphone, Search, Rocket, Shield } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui'
import { ServiceCard } from './ServiceCard'

export function OurServicesSection() {
  const { t } = useTranslation()

  const services = [
    { id: 'software', icon: Code },
    { id: 'design', icon: Palette },
    { id: 'mobility', icon: Smartphone },
    { id: 'clarity', icon: Search },
    { id: 'growth', icon: Rocket },
    { id: 'trust', icon: Shield },
  ] as const

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  }

  return (
    <section className="bg-background px-4 py-20 md:py-24">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <Badge className="mb-4">{t('home.services.badge')}</Badge>
          <h2 className="mb-4 text-3xl font-bold md:text-4xl lg:text-5xl">
            {t('home.services.title')}
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            {t('home.services.description')}
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {services.map((service) => {
            const badgeKey = `home.services.items.${service.id}.badge`
            const badge = t(badgeKey)
            const hasBadge = badge !== badgeKey
            return (
              <motion.div key={service.id} variants={itemVariants}>
                <ServiceCard
                  icon={service.icon}
                  title={t(`home.services.items.${service.id}.title`)}
                  description={t(`home.services.items.${service.id}.description`)}
                  badge={hasBadge ? badge : undefined}
                  ctaText={t('home.services.cta')}
                />
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
