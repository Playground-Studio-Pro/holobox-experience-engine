import { Container, Graphics, BlurFilter } from 'pixi.js'
import type { Ticker } from 'pixi.js'

const TWO_PI = Math.PI * 2
const BREATHE_PERIOD = 8   // seconds
const ALPHA_MIN = 0.10
const ALPHA_MAX = 0.16
const ALPHA_MID = (ALPHA_MIN + ALPHA_MAX) / 2
const ALPHA_AMP = (ALPHA_MAX - ALPHA_MIN) / 2

/**
 * A large radial glow placed behind the trophy on orbitBack.
 * Multiple concentric fills simulate a soft radial gradient.
 * Breathes on an 8-second cycle — no flashing, no pulsing.
 */
export class TrophyHalo {
  readonly container = new Container()
  private elapsed = 0

  constructor(cx: number, cy: number, radius: number) {
    // Build radial gradient: outer = transparent, inner = bright
    const layers = [
      { r: radius,        a: 0.25 },
      { r: radius * 0.70, a: 0.45 },
      { r: radius * 0.45, a: 0.65 },
      { r: radius * 0.25, a: 1.00 },
    ]

    // Draw outermost first so inner circles render on top
    for (const layer of layers) {
      const g = new Graphics()
      g.circle(0, 0, layer.r)
      g.fill({ color: 0xfff5e0, alpha: layer.a })
      this.container.addChild(g)
    }

    // One heavy blur softens all the hard circle edges into a smooth glow
    this.container.filters = [new BlurFilter({ strength: 90 })]
    this.container.x = cx
    this.container.y = cy
    this.container.alpha = ALPHA_MID
  }

  mount(layer: Container): void {
    // Insert at index 0 so halo sits below all other items in this layer
    layer.addChildAt(this.container, 0)
  }

  update(ticker: Ticker): void {
    this.elapsed += ticker.deltaMS / 1000
    this.container.alpha = ALPHA_MID + ALPHA_AMP * Math.sin(this.elapsed * (TWO_PI / BREATHE_PERIOD))
  }

  destroy(): void {
    this.container.destroy({ children: true })
  }
}
