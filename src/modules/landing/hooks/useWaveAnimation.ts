import { useEffect, useRef } from 'react'
import type { WaveConfig, Particle, Point } from '../types/home.types'

interface UseWaveAnimationProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  prefersReducedMotion?: boolean
}

export function useWaveAnimation({
  canvasRef,
  prefersReducedMotion = false,
}: UseWaveAnimationProps) {
  const mouseRef = useRef<Point>({ x: 0, y: 0 })
  const targetMouseRef = useRef<Point>({ x: 0, y: 0 })

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
            color: '#7132CA',
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
            color: '#A167E1',
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
            color: '#D84EB7',
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

      const pulse = Math.sin(time * wave.pulseSpeed + wave.offset)
      const freqPulse = Math.cos(time * wave.frequencyPulse + wave.offset * 0.5)
      const currentAmplitude = wave.amplitude * (0.85 + 0.35 * pulse + 0.1 * Math.sin(time * 0.005))
      const currentFrequency = wave.frequency * (1 + 0.3 * freqPulse)

      for (let x = 0; x <= canvas.width; x += 4) {
        const dx = x - mouseRef.current.x
        const dy = canvas.height / 2 - mouseRef.current.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        const influence = Math.max(0, 1 - distance / influenceRadius)

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

        const phase = x * (currentFrequency + mouseFreqShift) + time * wave.speed + wave.offset
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
      ctx.globalAlpha = wave.opacity * (0.6 + 0.4 * Math.sin(time * 0.012 + wave.offset))
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
  }, [canvasRef, prefersReducedMotion])
}
