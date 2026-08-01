import type { Container, Ticker } from 'pixi.js'
import { lerp } from '@/utils'

const TWO_PI = Math.PI * 2
const AMP_EASE_RATE = 3.0

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

/** Mutable view of a floating item's base position — GSAP can animate these directly. */
export interface FloatingBase {
  baseX: number
  baseY: number
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
  frozen?: boolean
}

/**
 * Organic dual-sine floating motion — each card suspended independently in air.
 * Depth drives amplitude: closer cards drift more, far cards barely breathe.
 * Frequencies are so slow the motion is felt rather than seen.
 */
export class FloatingMotionSystem {
  private readonly items: FloatingItem[]
  private elapsed = 0
  private amplitudeScale = 1.0
  private targetAmplitudeScale = 1.0

  constructor(targets: FloatingTarget[]) {
    this.items = targets.map(({ container, depth }) => {
      // Amplitude scales with depth: hero drifts visibly, ghosts barely breathe
      const ampScale  = lerp(0.18, 1.0, depth)
      // Frequency scales with depth: closer cards move at full cadence,
      // far cards have longer, slower cycles — reinforces parallax depth feel
      const freqScale = lerp(0.72, 1.0, depth)

      return {
        container,
        baseX: container.x,
        baseY: container.y,
        phaseX: Math.random() * TWO_PI,
        phaseY: Math.random() * TWO_PI,
        phaseR: Math.random() * TWO_PI,
        freqAx: (FREQ_A_MIN + Math.random() * (FREQ_A_MAX - FREQ_A_MIN)) * freqScale,
        freqBx: (FREQ_B_MIN + Math.random() * (FREQ_B_MAX - FREQ_B_MIN)) * freqScale,
        freqAy: (FREQ_A_MIN + Math.random() * (FREQ_A_MAX - FREQ_A_MIN)) * freqScale,
        freqBy: (FREQ_B_MIN + Math.random() * (FREQ_B_MAX - FREQ_B_MIN)) * freqScale,
        freqR:  (0.04 + Math.random() * 0.05) * freqScale,
        ampX: (BASE_AMP_X + Math.random() * 1.5) * ampScale,
        ampY: (BASE_AMP_Y + Math.random() * 2.0) * ampScale,
      }
    })
  }

  /** Smoothly scale all floating amplitudes — 1.0 = full, 0.0 = frozen. */
  setAmplitudeScale(scale: number): void {
    this.targetAmplitudeScale = scale
  }

  /**
   * Freeze a container — snaps it to its base position and excludes it from
   * the per-tick update. Used when reparenting a photo to the focus layer so
   * GSAP can animate its position without interference.
   */
  freezeItem(container: Container): void {
    const item = this.items.find(i => i.container === container)
    if (!item) return
    item.frozen        = true
    container.x        = item.baseX
    container.y        = item.baseY
    container.rotation = 0
  }

  /**
   * Unfreeze a container and reset its base position.
   * Call after returning the photo to its slot so floating resumes cleanly.
   */
  unfreezeItem(container: Container, baseX: number, baseY: number): void {
    const item = this.items.find(i => i.container === container)
    if (!item) return
    item.baseX  = baseX
    item.baseY  = baseY
    item.frozen = false
  }

  update(ticker: Ticker): void {
    const dt = ticker.deltaMS / 1000
    this.elapsed += dt

    // Smooth amplitude toward target — independent of frame rate
    this.amplitudeScale = lerp(this.amplitudeScale, this.targetAmplitudeScale, 1 - Math.exp(-AMP_EASE_RATE * dt))

    const t = this.elapsed
    const a = this.amplitudeScale

    for (const item of this.items) {
      if (item.frozen) continue

      const dx =
        (Math.sin(t * item.freqAx + item.phaseX) * item.ampX +
         Math.sin(t * item.freqBx + item.phaseX + 0.9) * (item.ampX * 0.38)) * a

      const dy =
        (Math.sin(t * item.freqAy + item.phaseY) * item.ampY +
         Math.sin(t * item.freqBy + item.phaseY + 1.4) * (item.ampY * 0.32)) * a

      const rotation = Math.sin(t * item.freqR + item.phaseR) * (0.6 * Math.PI / 180) * a

      item.container.x = item.baseX + dx
      item.container.y = item.baseY + dy
      item.container.rotation = rotation
    }
  }

  /**
   * Returns a mutable reference to the item's base position.
   * GSAP can animate baseX/baseY directly — FloatingMotionSystem applies
   * floating offsets on top of these values every tick, creating the
   * "photograph floating through space" effect during transitions.
   */
  getBaseProxy(container: Container): FloatingBase | null {
    return this.items.find(i => i.container === container) ?? null
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
