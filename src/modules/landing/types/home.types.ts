export type Point = {
  x: number
  y: number
}

export interface WaveConfig {
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

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
}
