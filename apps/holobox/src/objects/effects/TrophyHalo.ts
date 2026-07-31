import { Container, Graphics, BlurFilter } from 'pixi.js'
import type { Ticker } from 'pixi.js'

const TWO_PI = Math.PI * 2
const BREATHE_PERIOD = 8
const ALPHA_MIN = 0.10
const ALPHA_MAX = 0.16
const ALPHA_MID = (ALPHA_MIN + ALPHA_MAX) / 2
const ALPHA_AMP = (ALPHA_MAX - ALPHA_MIN) / 2

/**
 * Warm radial glow behind the trophy that illuminates the surrounding white environment.
 * Multiple concentric fills simulate a radial gradient; a single heavy blur unifies them.
 * Breathes over 8 seconds — imperceptibly slow, no flashing.
 */
export class TrophyHalo {
  readonly container = new Container()
  private elapsed = 0

  constructor(cx: number, cy: number, radius: number) {
    // Six gradient layers — outermost drawn first (lowest z), innermost last
    const layers = [
      { r: radius * 1.15, a: 0.08 },  // very wide, extremely faint
      { r: radius,        a: 0.18 },
      { r: radius * 0.72, a: 0.35 },
      { r: radius * 0.48, a: 0.55 },
      { r: radius * 0.28, a: 0.75 },
      { r: radius * 0.12, a: 1.00 },  // bright core
    ]

    for (const layer of layers) {
      const g = new Graphics()
      g.circle(0, 0, layer.r)
      // Warm gallery light — slightly golden white, not blue-white
      g.fill({ color: 0xfff8f0, alpha: layer.a })
      this.container.addChild(g)
    }

    // Single heavy blur collapses hard circle edges into a seamless glow
    this.container.filters = [new BlurFilter({ strength: 130 })]
    this.container.x = cx
    this.container.y = cy
    this.container.alpha = ALPHA_MID
  }

  mount(layer: Container): void {
    layer.addChildAt(this.container, 0)
  }

  update(ticker: Ticker): void {
    this.elapsed += ticker.deltaMS / 1000
    this.container.alpha =
      ALPHA_MID + ALPHA_AMP * Math.sin(this.elapsed * (TWO_PI / BREATHE_PERIOD))
  }

  destroy(): void {
    this.container.destroy({ children: true })
  }
}
