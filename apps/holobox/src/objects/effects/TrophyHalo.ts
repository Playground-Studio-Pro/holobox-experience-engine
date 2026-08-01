import { Container, Graphics, BlurFilter } from 'pixi.js'
import type { Ticker } from 'pixi.js'

const TWO_PI = Math.PI * 2

// Inner halo — tight radial glow around the trophy base
const INNER_ALPHA_MID = 0.14
const INNER_ALPHA_AMP = 0.032
const INNER_PERIOD    = 8

// Outer atmosphere — fills the room with warm gallery light
const OUTER_ALPHA_MID = 0.038
const OUTER_ALPHA_AMP = 0.012
const OUTER_PERIOD    = 15
const OUTER_PHASE     = 2.1  // offset so the two layers never peak simultaneously

/**
 * Warm radial glow behind the trophy that illuminates the surrounding environment.
 *
 * Two concentric layers:
 *   Inner halo  — focused glow centered on the trophy base (480px).
 *   Outer atmosphere — room-scale haze (≈900px) that tints the whole canvas warm.
 *
 * Both layers breathe at different rates and phases so the trophy presence
 * always feels alive but never mechanical.
 */
export class TrophyHalo {
  private readonly innerContainer = new Container()
  private readonly outerContainer = new Container()
  private elapsed = 0

  constructor(cx: number, cy: number, radius: number) {
    // ── Outer atmosphere (drawn first — lowest z) ────────────────────────────
    const outerLayers = [
      { r: radius * 2.10, a: 0.05 },  // vast, barely visible warm tint
      { r: radius * 1.70, a: 0.12 },
      { r: radius * 1.30, a: 0.22 },
    ]
    for (const layer of outerLayers) {
      const g = new Graphics()
      g.circle(0, 0, layer.r)
      g.fill({ color: 0xfff4e6, alpha: layer.a })
      this.outerContainer.addChild(g)
    }
    this.outerContainer.filters = [new BlurFilter({ strength: 240 })]
    this.outerContainer.x     = cx
    this.outerContainer.y     = cy
    this.outerContainer.alpha = OUTER_ALPHA_MID

    // ── Inner halo (focused trophy glow) ────────────────────────────────────
    const innerLayers = [
      { r: radius * 1.15, a: 0.08 },  // very wide, extremely faint
      { r: radius,        a: 0.20 },
      { r: radius * 0.72, a: 0.38 },
      { r: radius * 0.48, a: 0.60 },
      { r: radius * 0.28, a: 0.78 },
      { r: radius * 0.12, a: 1.00 },  // bright warm core
    ]
    for (const layer of innerLayers) {
      const g = new Graphics()
      g.circle(0, 0, layer.r)
      g.fill({ color: 0xfff8f0, alpha: layer.a })
      this.innerContainer.addChild(g)
    }
    this.innerContainer.filters = [new BlurFilter({ strength: 130 })]
    this.innerContainer.x     = cx
    this.innerContainer.y     = cy
    this.innerContainer.alpha = INNER_ALPHA_MID
  }

  mount(layer: Container): void {
    layer.addChildAt(this.outerContainer, 0)
    layer.addChildAt(this.innerContainer, 1)
  }

  update(ticker: Ticker): void {
    this.elapsed += ticker.deltaMS / 1000

    this.innerContainer.alpha =
      INNER_ALPHA_MID + INNER_ALPHA_AMP * Math.sin(this.elapsed * (TWO_PI / INNER_PERIOD))

    this.outerContainer.alpha =
      OUTER_ALPHA_MID + OUTER_ALPHA_AMP * Math.sin(this.elapsed * (TWO_PI / OUTER_PERIOD) + OUTER_PHASE)
  }

  destroy(): void {
    this.innerContainer.destroy({ children: true })
    this.outerContainer.destroy({ children: true })
  }
}
