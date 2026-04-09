'use client'

import { m, type Variants } from 'framer-motion'
import { ArrowRight, Sparkles, Play } from 'lucide-react'
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui'
import { useWaveAnimation } from '../hooks/useWaveAnimation'

export function NewHeroSection() {
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // Use the extracted wave animation logic
  useWaveAnimation({ canvasRef })

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  }

  const floatingVariants: Variants = {
    animate: {
      y: [0, -10, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  }

  return (
    <section
      className="relative isolate flex min-h-[80vh] w-full items-center justify-center overflow-hidden bg-background px-4 py-20 md:py-32"
      role="region"
      aria-label="New hero section"
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />

      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute left-1/2 top-0 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-foreground/[0.035] blur-[140px] dark:bg-foreground/[0.06]" />
        <div className="absolute bottom-0 right-0 h-[360px] w-[360px] rounded-full bg-foreground/[0.025] blur-[120px] dark:bg-foreground/[0.05]" />
        <div className="absolute top-1/2 left-1/4 h-[400px] w-[400px] rounded-full bg-primary/[0.02] blur-[150px] dark:bg-primary/[0.05]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        <m.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative z-10 text-center"
        >
          <m.div variants={itemVariants} className="mb-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              {t('home.newHero.badge')}
            </span>
          </m.div>

          <m.h1
            variants={itemVariants}
            className="mb-6 text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl"
          >
            {t('home.newHero.title')}
            <br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {t('home.newHero.titleHighlight')}
            </span>
          </m.h1>

          <m.p
            variants={itemVariants}
            className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground md:text-xl"
          >
            {t('home.newHero.description')}
          </m.p>

          <m.div
            variants={itemVariants}
            className="flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Button size="lg" className="group gap-2">
              {t('home.newHero.ctaPrimary')}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button size="lg" variant="outline" className="group gap-2">
              <Play className="h-4 w-4" />
              {t('home.newHero.ctaSecondary')}
            </Button>
          </m.div>

          <m.div
            variants={floatingVariants}
            animate="animate"
            className="mt-16 flex items-center justify-center gap-8 text-sm text-muted-foreground"
          >
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {t('home.newHero.stats.customers.value')}
              </div>
              <div>{t('home.newHero.stats.customers.label')}</div>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {t('home.newHero.stats.projects.value')}
              </div>
              <div>{t('home.newHero.stats.projects.label')}</div>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {t('home.newHero.stats.satisfaction.value')}
              </div>
              <div>{t('home.newHero.stats.satisfaction.label')}</div>
            </div>
          </m.div>
        </m.div>
      </div>
    </section>
  )
}
