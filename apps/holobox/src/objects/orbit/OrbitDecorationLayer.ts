import { Container, Graphics, BlurFilter } from 'pixi.js'
import type { Ticker } from 'pixi.js'
import type { CompositionEllipseConfig } from '@/config/types'

const TWO_PI = Math.PI * 2
const TRAIL_DOTS = 6
const TRAIL_STEP = 0.026  // radians between comet trail dots

interface Spark {
  container: Container
  angle: number
  speed: number
  maxAlpha: number
}

/**
 * Adds 2 orbit sparks and 1 faint comet that travel continuously along the
 * composition ellipse. Sparks depth-route between orbitBack/orbitFront based
 * on their Y position vs the layerSplit threshold.
 */
export class OrbitDecorationLayer {
  private readonly cx: number
  private readonly cy: number
  private readonly rx: number
  private readonly ry: number
  private readonly layerSplit: number

  private sparks: Spark[] = []
  private cometDots: Graphics[] = []
  private cometAngle = Math.random() * TWO_PI
  private readonly cometSpeed = 0.21

  private backLayer: Container | null = null
  private frontLayer: Container | null = null

  constructor(ellipse: CompositionEllipseConfig, layerSplit: number) {
    this.cx = ellipse.cx
    this.cy = ellipse.cy
    this.rx = ellipse.rx
    this.ry = ellipse.ry
    this.layerSplit = layerSplit
  }

  mount(backLayer: Container, frontLayer: Container): void {
    this.backLayer = backLayer
    this.frontLayer = frontLayer

    // ── 2 sparks ──────────────────────────────────────────────────────────────
    const sparkDefs = [
      { speed: 0.55, phase: Math.random() * TWO_PI, maxAlpha: 0.75 },
      { speed: 0.37, phase: Math.random() * TWO_PI, maxAlpha: 0.58 },
    ]

    for (const def of sparkDefs) {
      // Soft outer glow
      const glow = new Graphics()
      glow.circle(0, 0, 6)
      glow.fill({ color: 0xffd700, alpha: 0.85 })
      glow.filters = [new BlurFilter({ strength: 8 })]

      // Sharp inner dot
      const dot = new Graphics()
      dot.circle(0, 0, 2.5)
      dot.fill({ color: 0xffffff })

      const c = new Container()
      c.addChild(glow, dot)
      frontLayer.addChild(c)

      this.sparks.push({
        container: c,
        angle: def.phase,
        speed: def.speed,
        maxAlpha: def.maxAlpha,
      })
    }

    // ── 1 comet: head + trailing dots ─────────────────────────────────────────
    for (let i = 0; i < TRAIL_DOTS; i++) {
      const size = i === 0 ? 3 : Math.max(0.8, 2.8 - i * 0.4)
      const gfx = new Graphics()
      gfx.circle(0, 0, size)
      gfx.fill({ color: 0xffffff })
      if (i === 0) gfx.filters = [new BlurFilter({ strength: 5 })]
      frontLayer.addChild(gfx)
      this.cometDots.push(gfx)
    }
  }

  update(ticker: Ticker): void {
    const dt = ticker.deltaMS / 1000

    // ── Sparks ─────────────────────────────────────────────────────────────────
    for (const spark of this.sparks) {
      spark.angle = (spark.angle + spark.speed * dt) % TWO_PI

      const x = this.cx + this.rx * Math.cos(spark.angle)
      const y = this.cy + this.ry * Math.sin(spark.angle)

      // Depth: sinA=1 (bottom, front) → full alpha; sinA=-1 (top, back) → faint
      const t = (Math.sin(spark.angle) + 1) / 2
      spark.container.x = x
      spark.container.y = y
      spark.container.alpha = 0.07 + (spark.maxAlpha - 0.07) * t

      // Route between layers for true depth vs the physical trophy
      const target = y >= this.layerSplit ? this.frontLayer! : this.backLayer!
      if (spark.container.parent !== target) target.addChild(spark.container)
    }

    // ── Comet ──────────────────────────────────────────────────────────────────
    this.cometAngle = (this.cometAngle + this.cometSpeed * dt) % TWO_PI

    for (let i = 0; i < this.cometDots.length; i++) {
      const dotAngle = this.cometAngle - i * TRAIL_STEP

      const x = this.cx + this.rx * Math.cos(dotAngle)
      const y = this.cy + this.ry * Math.sin(dotAngle)

      const depthT = (Math.sin(dotAngle) + 1) / 2
      const depthAlpha = 0.05 + 0.60 * depthT
      const trailFade = 1 - i / TRAIL_DOTS

      this.cometDots[i].x = x
      this.cometDots[i].y = y
      this.cometDots[i].alpha = depthAlpha * trailFade
    }
  }

  destroy(): void {
    for (const spark of this.sparks) spark.container.destroy({ children: true })
    for (const dot of this.cometDots) dot.destroy()
    this.sparks = []
    this.cometDots = []
    this.backLayer = null
    this.frontLayer = null
  }
}
