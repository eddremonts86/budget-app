'use client'

import { m, type Variants } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui'
import { useWaveAnimation } from '../hooks/useWaveAnimation'

const containerVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, staggerChildren: 0.12 },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
}

const statsVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: 'easeOut', staggerChildren: 0.08 },
  },
}

export function GlowyWavesHero() {
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // Use the extracted wave animation logic
  useWaveAnimation({ canvasRef })

  const highlightPills = ['alma', 'impacto', 'friccion'] as const

  const heroStats = [
    { id: 'hours', value: '45k+' },
    { id: 'precision', value: '99.9%' },
    { id: 'projects', value: '85+' },
  ] as const

  return (
    <section
      className="relative isolate flex min-h-screen w-full items-center justify-center overflow-hidden bg-background"
      role="region"
      aria-label="Glowing waves hero section"
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />

      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute left-1/2 top-0 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-foreground/[0.035] blur-[140px] dark:bg-foreground/[0.06]" />
        <div className="absolute bottom-0 right-0 h-[360px] w-[360px] rounded-full bg-foreground/[0.025] blur-[120px] dark:bg-foreground/[0.05]" />
        <div className="absolute top-1/2 left-1/4 h-[400px] w-[400px] rounded-full bg-primary/[0.02] blur-[150px] dark:bg-primary/[0.05]" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center px-6 py-24 text-center md:px-8 lg:px-12">
        <m.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full"
        >
          <m.div
            variants={itemVariants}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/40 bg-background/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-foreground/70 dark:border-border/60 dark:bg-background/70 dark:text-foreground/80"
          >
            <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
            {t('home.hero.badge')}
          </m.div>

          <m.h1
            variants={itemVariants}
            className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl"
          >
            {t('home.hero.title')}
            <br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {t('home.hero.titleHighlight')}
            </span>
          </m.h1>

          <m.p
            variants={itemVariants}
            className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl"
          >
            {t('home.hero.description')}
          </m.p>

          <m.div
            variants={itemVariants}
            className="mb-12 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Button size="lg" className="group gap-2 rounded-full px-8 text-base">
              {t('home.hero.ctaPrimary')}
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-full border-border/40 bg-background/60 px-8 text-base text-foreground/80 backdrop-blur transition-all hover:border-border/60 hover:bg-background/70 dark:border-border/50 dark:bg-background/40 dark:text-foreground/70 dark:hover:border-border/70 dark:hover:bg-background/50"
            >
              {t('home.hero.ctaSecondary')}
            </Button>
          </m.div>

          <m.ul
            variants={itemVariants}
            className="mb-12 flex flex-wrap items-center justify-center gap-3 text-xs uppercase tracking-[0.2em] text-foreground/70 dark:text-foreground/80"
          >
            {highlightPills.map((pill) => (
              <li
                key={pill}
                className="rounded-full border border-border/40 bg-background/60 px-4 py-2 backdrop-blur dark:border-border/60 dark:bg-background/70"
              >
                {t(`home.hero.pills.${pill}`)}
              </li>
            ))}
          </m.ul>

          <m.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={statsVariants}
            className="grid gap-4 rounded-2xl border border-border/30 bg-background/60 p-6 backdrop-blur-sm dark:border-border/60 dark:bg-background/70 sm:grid-cols-3"
          >
            {heroStats.map((stat) => (
              <m.div key={stat.id} variants={itemVariants} className="space-y-1">
                <div className="text-xs uppercase tracking-[0.3em] text-foreground/50 dark:text-foreground/60">
                  {t(`home.hero.stats.${stat.id}.label`)}
                </div>
                <div className="text-3xl font-semibold text-foreground">
                  {t(`home.hero.stats.${stat.id}.value`)}
                </div>
              </m.div>
            ))}
          </m.div>
        </m.div>
      </div>
    </section>
  )
}
