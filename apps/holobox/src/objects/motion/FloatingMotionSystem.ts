import type { Container, Ticker } from 'pixi.js'
import { lerp } from '@/utils'

const TWO_PI = Math.PI * 2

// Base amplitudes before depth scaling — very small, almost invisible
const BASE_AMP_X = 2.0
const BASE_AMP_Y = 3.2

// Frequency ranges (rad/s) — very slow for organic, suspension-in-air feel
// At 0.08 rad/s one cycle takes ~78 seconds
const FREQ_A_MIN = 0.08
const FREQ_A_MAX = 0.14
const FREQ_B_MIN = 0.03
const FREQ_B_MAX = 0.07

export interface FloatingTarget {
  container: Container
  /** 0 = far background, 1 = closest. Scales amplitude and speed. */
  depth: number
}

interface FloatingItem {
  container: Container
  baseX: number
  baseY: number
  phaseX: number
  phaseY: number
  phaseR: number
  freqAx: number
  freqBx: number
  freqAy: number
  freqBy: number
  freqR: number
  ampX: number
  ampY: number
}

/**
 * Organic dual-sine floating motion — each card suspended independently in air.
 * Depth drives amplitude: closer cards drift more, far cards barely breathe.
 * Frequencies are so slow the motion is felt rather than seen.
 */
export class FloatingMotionSystem {
  private readonly items: FloatingItem[]
  private elapsed = 0

  constructor(targets: FloatingTarget[]) {
    this.items = targets.map(({ container, depth }) => {
      // Amplitude scales with depth: hero drifts visibly, ghosts barely move
      const ampScale = lerp(0.18, 1.0, depth)

      return {
        container,
        baseX: container.x,
        baseY: container.y,
        phaseX: Math.random() * TWO_PI,
        phaseY: Math.random() * TWO_PI,
        phaseR: Math.random() * TWO_PI,
        // Each card has slightly different frequencies — nothing ever syncs
        freqAx: FREQ_A_MIN + Math.random() * (FREQ_A_MAX - FREQ_A_MIN),
        freqBx: FREQ_B_MIN + Math.random() * (FREQ_B_MAX - FREQ_B_MIN),
        freqAy: FREQ_A_MIN + Math.random() * (FREQ_A_MAX - FREQ_A_MIN),
        freqBy: FREQ_B_MIN + Math.random() * (FREQ_B_MAX - FREQ_B_MIN),
        freqR:  0.04 + Math.random() * 0.05,
        ampX: (BASE_AMP_X + Math.random() * 1.5) * ampScale,
        ampY: (BASE_AMP_Y + Math.random() * 2.0) * ampScale,
      }
    })
  }

  update(ticker: Ticker): void {
    this.elapsed += ticker.deltaMS / 1000
    const t = this.elapsed

    for (const item of this.items) {
      // Dual-sine X: dominant + slow secondary at 38% amplitude
      const dx =
        Math.sin(t * item.freqAx + item.phaseX) * item.ampX +
        Math.sin(t * item.freqBx + item.phaseX + 0.9) * (item.ampX * 0.38)

      // Dual-sine Y: similar structure, independent frequencies
      const dy =
        Math.sin(t * item.freqAy + item.phaseY) * item.ampY +
        Math.sin(t * item.freqBy + item.phaseY + 1.4) * (item.ampY * 0.32)

      // Very subtle rotation: max ±0.6°
      const rotation = Math.sin(t * item.freqR + item.phaseR) * (0.6 * Math.PI / 180)

      item.container.x = item.baseX + dx
      item.container.y = item.baseY + dy
      item.container.rotation = rotation
    }
  }

  destroy(): void {
    for (const item of this.items) {
      item.container.x = item.baseX
      item.container.y = item.baseY
      item.container.rotation = 0
    }
    this.items.length = 0
  }
}
