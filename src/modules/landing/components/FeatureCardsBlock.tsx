'use client'

import { Zap, Shield, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { FeatureCard } from './FeatureCard'

export function FeatureCardsBlock() {
  const { t } = useTranslation()
  const features = [
    {
      icon: Zap,
      title: t('home.features.items.efficiency.title'),
      description: t('home.features.items.efficiency.description'),
    },
    {
      icon: Shield,
      title: t('home.features.items.ethics.title'),
      description: t('home.features.items.ethics.description'),
    },
    {
      icon: Sparkles,
      title: t('home.features.items.closeness.title'),
      description: t('home.features.items.closeness.description'),
    },
  ]

  return (
    <section className="px-6 py-32">
      <div className="mx-auto max-w-7xl">
        <div className="mb-20 space-y-5 text-center">
          <h2 className="text-5xl font-bold tracking-tight md:text-6xl">
            {t('home.features.title')}
          </h2>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
            {t('home.features.description')}
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
