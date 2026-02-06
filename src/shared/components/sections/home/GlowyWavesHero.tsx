'use client'

import { motion, type Variants } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/components/ui'

type Point = {
  x: number
  y: number
}

interface WaveConfig {
  offset: number
  amplitude: number
  frequency: number
  color: string
  opacity: number
  speed: number
  chaos: number
  attraction: number // -1 (repel) to 1 (attract)
  pulseSpeed: number
  frequencyPulse: number
  particleChance: number
  noiseScale: number
  mouseResponse: 'attract' | 'repel' | 'frequency' | 'amplitude' | 'chaos'
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
}

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
  const mouseRef = useRef<Point>({ x: 0, y: 0 })
  const targetMouseRef = useRef<Point>({ x: 0, y: 0 })

  const highlightPills = ['alma', 'impacto', 'friccion'] as const

  const heroStats = [
    { id: 'hours', value: '45k+' },
    { id: 'precision', value: '99.9%' },
    { id: 'projects', value: '85+' },
  ] as const

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined

    const ctx = canvas.getContext('2d')
    if (!ctx) return undefined

    let animationId: number
    let time = 0

    const particles: Particle[] = []

    const computeThemeColors = () => {
      const rootStyles = getComputedStyle(document.documentElement)

      const resolveColor = (variables: string[], alpha = 1) => {
        const tempEl = document.createElement('div')
        tempEl.style.position = 'absolute'
        tempEl.style.visibility = 'hidden'
        tempEl.style.width = '1px'
        tempEl.style.height = '1px'
        document.body.appendChild(tempEl)

        let color = `rgba(255, 255, 255, ${alpha})`

        for (const variable of variables) {
          const value = rootStyles.getPropertyValue(variable).trim()
          if (value) {
            tempEl.style.backgroundColor = `var(${variable})`
            const computedColor = getComputedStyle(tempEl).backgroundColor

            if (computedColor && computedColor !== 'rgba(0, 0, 0, 0)') {
              if (alpha < 1) {
                const rgbMatch = computedColor.match(
                  /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/,
                )
                if (rgbMatch) {
                  color = `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, ${alpha})`
                } else {
                  color = computedColor
                }
              } else {
                color = computedColor
              }
              break
            }
          }
        }

        document.body.removeChild(tempEl)
        return color
      }

      return {
        backgroundTop: resolveColor(['--background'], 1),
        backgroundBottom: resolveColor(['--muted', '--background'], 0.95),
        wavePalette: [
          {
            offset: 0,
            amplitude: 140,
            frequency: 0.003,
            color: resolveColor(['--primary'], 0.8),
            opacity: 0.85,
            speed: 0.002,
            chaos: 1.2,
            attraction: 0.6,
            pulseSpeed: 0.001,
            frequencyPulse: 0.0002,
            particleChance: 0.06,
            noiseScale: 1.5,
            mouseResponse: 'attract',
          },
          {
            offset: Math.PI / 2,
            amplitude: 180,
            frequency: 0.0026,
            color: resolveColor(['--accent', '--primary'], 0.7),
            opacity: 0.6,
            speed: 0.0024,
            chaos: 1.5,
            attraction: -0.7,
            pulseSpeed: 0.0015,
            frequencyPulse: 0.0003,
            particleChance: 0.09,
            noiseScale: 2.2,
            mouseResponse: 'repel',
          },
          {
            offset: Math.PI,
            amplitude: 65,
            frequency: 0.0055,
            color: resolveColor(['--secondary', '--foreground'], 0.65),
            opacity: 0.4,
            speed: 0.0015,
            chaos: 0.8,
            attraction: 0.9,
            pulseSpeed: 0.0008,
            frequencyPulse: 0.0005,
            particleChance: 0.03,
            noiseScale: 0.8,
            mouseResponse: 'frequency',
          },
          {
            offset: Math.PI * 1.5,
            amplitude: 240,
            frequency: 0.0018,
            color: resolveColor(['--primary-foreground', '--foreground'], 0.25),
            opacity: 0.35,
            speed: 0.0028,
            chaos: 2.0,
            attraction: -0.4,
            pulseSpeed: 0.002,
            frequencyPulse: 0.0001,
            particleChance: 0.14,
            noiseScale: 3.5,
            mouseResponse: 'chaos',
          },
          {
            offset: Math.PI * 2,
            amplitude: 45,
            frequency: 0.0075,
            color: resolveColor(['--foreground'], 0.2),
            opacity: 0.95,
            speed: 0.0035,
            chaos: 1.1,
            attraction: 1.3,
            pulseSpeed: 0.003,
            frequencyPulse: 0.001,
            particleChance: 0.05,
            noiseScale: 1.2,
            mouseResponse: 'amplitude',
          },
          {
            offset: Math.PI * 0.3,
            amplitude: 95,
            frequency: 0.0028,
            color: '#0E21A0',
            opacity: 0.55,
            speed: 0.0022,
            chaos: 1.3,
            attraction: -0.85,
            pulseSpeed: 0.0012,
            frequencyPulse: 0.0004,
            particleChance: 0.07,
            noiseScale: 2.0,
            mouseResponse: 'repel',
          },
          {
            offset: Math.PI * 0.7,
            amplitude: 160,
            frequency: 0.0032,
            color: '#4D2FB2',
            opacity: 0.75,
            speed: 0.0026,
            chaos: 0.9,
            attraction: 0.55,
            pulseSpeed: 0.0018,
            frequencyPulse: 0.0002,
            particleChance: 0.08,
            noiseScale: 1.8,
            mouseResponse: 'attract',
          },
          {
            offset: Math.PI * 1.2,
            amplitude: 130,
            frequency: 0.0025,
            color: '#B153D7',
            opacity: 0.5,
            speed: 0.002,
            chaos: 1.4,
            attraction: -0.5,
            pulseSpeed: 0.001,
            frequencyPulse: 0.0003,
            particleChance: 0.1,
            noiseScale: 2.5,
            mouseResponse: 'frequency',
          },
          {
            offset: Math.PI * 1.8,
            amplitude: 210,
            frequency: 0.0038,
            color: '#F375C2',
            opacity: 0.4,
            speed: 0.003,
            chaos: 1.2,
            attraction: 0.35,
            pulseSpeed: 0.0022,
            frequencyPulse: 0.0006,
            particleChance: 0.12,
            noiseScale: 1.6,
            mouseResponse: 'amplitude',
          },
        ] satisfies WaveConfig[],
      }
    }

    let themeColors = computeThemeColors()

    const handleThemeMutation = () => {
      themeColors = computeThemeColors()
    }

    const observer = new MutationObserver(handleThemeMutation)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme'],
    })

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const mouseInfluence = prefersReducedMotion ? 10 : 70
    const influenceRadius = prefersReducedMotion ? 160 : 320
    const smoothing = prefersReducedMotion ? 0.04 : 0.1

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    const recenterMouse = () => {
      const centerPoint = { x: canvas.width / 2, y: canvas.height / 2 }
      mouseRef.current = centerPoint
      targetMouseRef.current = centerPoint
    }

    const handleResize = () => {
      resizeCanvas()
      recenterMouse()
    }

    const handleMouseMove = (event: MouseEvent) => {
      targetMouseRef.current = { x: event.clientX, y: event.clientY }
    }

    const handleMouseLeave = () => {
      recenterMouse()
    }

    resizeCanvas()
    recenterMouse()

    window.addEventListener('resize', handleResize)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseleave', handleMouseLeave)

    const drawWave = (wave: WaveConfig) => {
      ctx.save()
      ctx.beginPath()

      // Organic fluctuations: Personality-driven pulsing
      const pulse = Math.sin(time * wave.pulseSpeed + wave.offset)
      const freqPulse = Math.cos(time * wave.frequencyPulse + wave.offset * 0.5)

      // Variation between 40% and 200% as requested
      const currentAmplitude = wave.amplitude * (0.8 + 0.6 * pulse + 0.2 * Math.sin(time * 0.005))
      const currentFrequency = wave.frequency * (1 + 0.3 * freqPulse)

      for (let x = 0; x <= canvas.width; x += 4) {
        const dx = x - mouseRef.current.x
        const dy = canvas.height / 2 - mouseRef.current.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        const influence = Math.max(0, 1 - distance / influenceRadius)

        // Variable mouse interaction based on personality
        let mouseShift = 0
        let mouseFreqShift = 0
        let mouseAmpShift = 0
        let mouseChaosShift = 0

        switch (wave.mouseResponse) {
          case 'attract':
            mouseShift = influence * mouseInfluence * wave.attraction
            break
          case 'repel':
            mouseShift = influence * mouseInfluence * wave.attraction
            break
          case 'frequency':
            mouseFreqShift = influence * 0.01 * wave.chaos
            break
          case 'amplitude':
            mouseAmpShift = influence * 100 * wave.chaos
            break
          case 'chaos':
            mouseChaosShift = influence * 2.5
            break
        }

        // Layered sinusoidal motion for "alive" impression
        const phase = x * (currentFrequency + mouseFreqShift) + time * wave.speed + wave.offset

        // Micro-waves and chaos
        const noise = Math.sin(x * 0.05 + time * 0.1) * wave.noiseScale * (1 + mouseChaosShift)

        const wave1 = Math.sin(phase)
        const wave2 =
          Math.sin(x * (currentFrequency * 2.1) + time * (wave.speed * 2.2) + wave.offset * 0.3) *
          0.3
        const wave3 =
          Math.sin(x * (currentFrequency * 0.4) + time * (wave.speed * 0.5) + wave.offset * 1.7) *
          0.7
        const wave4 =
          Math.sin(x * 0.01 + time * 0.002 + wave.offset * 2.5) *
          (2 * (wave.chaos + mouseChaosShift))

        const combinedWave =
          (wave1 + wave2 + wave3 + wave4) * (currentAmplitude + mouseAmpShift) + noise
        const y = canvas.height / 2 + combinedWave + mouseShift

        if (x === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }

        // Particle generation: secondary effects
        if (x % 30 === 0 && Math.random() < wave.particleChance * (0.5 + 1.5 * influence)) {
          particles.push({
            x,
            y,
            vx:
              (Math.random() - 0.5) * 2 +
              (wave.mouseResponse === 'repel' ? dx * 0.01 * influence : 0),
            vy:
              (Math.random() - 0.5) * 2 +
              (wave.mouseResponse === 'repel' ? dy * 0.01 * influence : 0),
            life: 1,
            maxLife: 30 + Math.random() * 50,
            color: wave.color,
            size: 0.8 + Math.random() * 2.5,
          })
        }
      }

      ctx.lineWidth = 2.5 + 1.5 * Math.sin(time * 0.005 + wave.offset)
      ctx.strokeStyle = wave.color

      // Opacity fluctuations
      const baseOpacity = wave.opacity * (0.6 + 0.4 * Math.sin(time * 0.012 + wave.offset))
      ctx.globalAlpha = baseOpacity

      ctx.shadowBlur = 20 + 20 * Math.sin(time * 0.008)
      ctx.shadowColor = wave.color
      ctx.stroke()

      ctx.restore()
    }

    const updateParticles = () => {
      ctx.save()
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy
        p.life -= 1 / p.maxLife

        if (p.life <= 0) {
          particles.splice(i, 1)
          continue
        }

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.globalAlpha = p.life * 0.6
        ctx.shadowBlur = 10
        ctx.shadowColor = p.color
        ctx.fill()
      }
      ctx.restore()
    }

    const animate = () => {
      time += 1

      mouseRef.current.x += (targetMouseRef.current.x - mouseRef.current.x) * smoothing
      mouseRef.current.y += (targetMouseRef.current.y - mouseRef.current.y) * smoothing

      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
      gradient.addColorStop(0, themeColors.backgroundTop)
      gradient.addColorStop(1, themeColors.backgroundBottom)

      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.globalAlpha = 1
      ctx.shadowBlur = 0

      themeColors.wavePalette.forEach(drawWave)
      updateParticles()

      animationId = window.requestAnimationFrame(animate)
    }

    animationId = window.requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
      cancelAnimationFrame(animationId)
      observer.disconnect()
    }
  }, [])

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
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full"
        >
          <motion.div
            variants={itemVariants}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/40 bg-background/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-foreground/70 dark:border-border/60 dark:bg-background/70 dark:text-foreground/80"
          >
            <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
            {t('home.hero.badge')}
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl"
          >
            {t('home.hero.title')}
            <br />
            <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              {t('home.hero.titleHighlight')}
            </span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl"
          >
            {t('home.hero.description')}
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="mb-12 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Button
              size="lg"
              className="group gap-2 rounded-full px-8 text-base uppercase tracking-[0.2em]"
            >
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
          </motion.div>

          <motion.ul
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
          </motion.ul>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={statsVariants}
            className="grid gap-4 rounded-2xl border border-border/30 bg-background/60 p-6 backdrop-blur-sm dark:border-border/60 dark:bg-background/70 sm:grid-cols-3"
          >
            {heroStats.map((stat) => (
              <motion.div key={stat.id} variants={itemVariants} className="space-y-1">
                <div className="text-xs uppercase tracking-[0.3em] text-foreground/50 dark:text-foreground/60">
                  {t(`home.hero.stats.${stat.id}.label`)}
                </div>
                <div className="text-3xl font-semibold text-foreground">
                  {t(`home.hero.stats.${stat.id}.value`)}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
