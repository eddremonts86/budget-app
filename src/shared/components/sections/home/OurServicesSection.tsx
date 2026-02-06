'use client'

import { motion, type Variants } from 'framer-motion'
import { Code, Palette, Smartphone, Search, Rocket, Shield } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge, Card, Button } from '@/shared/components/ui'

export function OurServicesSection() {
  const { t } = useTranslation()
  const [mounted, setMounted] = useState(false)

  const services = [
    { id: 'software', icon: Code },
    { id: 'design', icon: Palette },
    { id: 'mobility', icon: Smartphone },
    { id: 'clarity', icon: Search },
    { id: 'growth', icon: Rocket },
    { id: 'trust', icon: Shield },
  ] as const

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

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

  if (!mounted) return null

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
            const Icon = service.icon
            const badgeKey = `home.services.items.${service.id}.badge`
            const badge = t(badgeKey)
            const hasBadge = badge !== badgeKey
            return (
              <motion.div key={service.id} variants={itemVariants}>
                <Card className="group relative h-full border-2 p-6 transition-all hover:border-primary hover:shadow-xl">
                  {hasBadge && <Badge className="absolute -right-2 -top-2">{badge}</Badge>}
                  <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3 transition-transform group-hover:scale-110">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold">
                    {t(`home.services.items.${service.id}.title`)}
                  </h3>
                  <p className="mb-4 text-muted-foreground">
                    {t(`home.services.items.${service.id}.description`)}
                  </p>
                  <Button variant="ghost" size="sm" className="group/btn">
                    {t('home.services.cta')}
                    <motion.span className="ml-1 inline-block" whileHover={{ x: 5 }}>
                      →
                    </motion.span>
                  </Button>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
