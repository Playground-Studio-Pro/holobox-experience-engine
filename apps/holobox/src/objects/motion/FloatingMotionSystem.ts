import type { Container, Ticker } from 'pixi.js'

const TWO_PI = Math.PI * 2

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
 * Applies independent dual-sine floating motion to a set of containers.
 * Records base positions on construction — motion is purely additive.
 * Frequencies are randomised per item so nothing ever syncs up.
 */
export class FloatingMotionSystem {
  private readonly items: FloatingItem[]
  private elapsed = 0

  constructor(containers: Container[]) {
    this.items = containers.map((container) => ({
      container,
      baseX: container.x,
      baseY: container.y,
      phaseX: Math.random() * TWO_PI,
      phaseY: Math.random() * TWO_PI,
      phaseR: Math.random() * TWO_PI,
      freqAx: 0.30 + Math.random() * 0.22,
      freqBx: 0.10 + Math.random() * 0.14,
      freqAy: 0.22 + Math.random() * 0.18,
      freqBy: 0.08 + Math.random() * 0.12,
      freqR:  0.06 + Math.random() * 0.09,
      ampX: 2.5 + Math.random() * 2.0,
      ampY: 4.0 + Math.random() * 3.5,
    }))
  }

  update(ticker: Ticker): void {
    this.elapsed += ticker.deltaMS / 1000
    const t = this.elapsed

    for (const item of this.items) {
      // Dual sine X: dominant wave + slower secondary at ~35% amplitude
      const dx =
        Math.sin(t * item.freqAx + item.phaseX) * item.ampX +
        Math.sin(t * item.freqBx + item.phaseX + 0.8) * (item.ampX * 0.35)

      // Dual sine Y: same pattern, different frequencies
      const dy =
        Math.sin(t * item.freqAy + item.phaseY) * item.ampY +
        Math.sin(t * item.freqBy + item.phaseY + 1.3) * (item.ampY * 0.30)

      // Subtle rotation: ±0.7°
      const rotation =
        Math.sin(t * item.freqR + item.phaseR) * (0.7 * Math.PI / 180)

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
