import { Container, Graphics } from 'pixi.js'
import type { Ticker } from 'pixi.js'
import type { CompositionEllipseConfig } from '@/config/types'
import { lerp } from '@/utils'

const TWO_PI = Math.PI * 2

// Comet trail: 9 dots with tighter spacing = longer, softer tail
const TRAIL_DOTS = 9
const TRAIL_STEP = 0.022  // radians between dots

// Orbit ellipse breathing: dual-frequency for an organic, never-mechanical feel
const ELLIPSE_ALPHA_MID  = 0.080
const ELLIPSE_ALPHA_AMP  = 0.028   // primary amplitude
const ELLIPSE_ALPHA_AMP2 = 0.012   // secondary (42% of primary, incommensurate period)
const ELLIPSE_BREATHE_PERIOD  = 11
const ELLIPSE_BREATHE_PERIOD2 = 19  // ≈ 1.73× primary — avoids repetition for minutes

interface Spark {
  container: Container
  angle: number
  speed: number
  maxAlpha: number
}

/**
 * Draws and animates the orbit ellipse (breathing opacity) plus 2 sparks and 1 comet.
 * Owns the visible ellipse — EditorialComposition's ellipse should be set to alpha 0.
 * Sparks depth-route between orbitBack/orbitFront for physical trophy occlusion.
 */
export class OrbitDecorationLayer {
  private readonly cx: number
  private readonly cy: number
  private readonly rx: number
  private readonly ry: number
  private readonly layerSplit: number
  private readonly ellipseColor: number
  private readonly ellipseLineWidth: number

  private ellipseGfx: Graphics | null = null
  private sparks: Spark[] = []
  private cometDots: Graphics[] = []

  private cometAngle = Math.random() * TWO_PI
  private readonly cometSpeed = 0.19

  private backLayer: Container | null = null
  private frontLayer: Container | null = null
  private elapsed = 0

  private speedMultiplier = 1.0
  private targetSpeedMultiplier = 1.0
  private static readonly SPEED_EASE_RATE = 1.6

  constructor(ellipse: CompositionEllipseConfig, layerSplit: number) {
    this.cx = ellipse.cx
    this.cy = ellipse.cy
    this.rx = ellipse.rx
    this.ry = ellipse.ry
    this.layerSplit = layerSplit
    this.ellipseColor = typeof ellipse.color === 'string'
      ? parseInt((ellipse.color as string).replace('#', ''), 16)
      : (ellipse.color ?? 0x999999)
    this.ellipseLineWidth = ellipse.lineWidth ?? 1.2
  }

  mount(backLayer: Container, frontLayer: Container): void {
    this.backLayer = backLayer
    this.frontLayer = frontLayer

    // ── Breathing ellipse — drawn here, not in EditorialComposition ───────────
    const ell = new Graphics()
    ell.ellipse(this.cx, this.cy, this.rx, this.ry)
    ell.stroke({ color: this.ellipseColor, alpha: 1, width: this.ellipseLineWidth })
    ell.alpha = ELLIPSE_ALPHA_MID
    backLayer.addChild(ell)
    this.ellipseGfx = ell

    // TEST C1: spark core only — no blur, no comet
    const sparkDefs = [
      { speed: 0.52, phase: Math.random() * TWO_PI, maxAlpha: 0.82 },
      { speed: 0.34, phase: Math.random() * TWO_PI, maxAlpha: 0.65 },
    ]
    for (const def of sparkDefs) {
      const core = new Graphics()
      core.circle(0, 0, 3)
      core.fill({ color: 0xffffff })
      const c = new Container()
      c.addChild(core)
      frontLayer.addChild(c)
      this.sparks.push({ container: c, angle: def.phase, speed: def.speed, maxAlpha: def.maxAlpha })
    }
    // comet: disabled
  }

  /** Smoothly reduce orbit decoration speed to ~25% during a hero transition. */
  setSlowMotion(active: boolean): void {
    this.targetSpeedMultiplier = active ? 0.25 : 1.0
  }

  update(ticker: Ticker): void {
    const dt = ticker.deltaMS / 1000
    this.elapsed += dt

    // Smooth speed transition — frame-rate independent
    const smoothFactor = 1 - Math.exp(-OrbitDecorationLayer.SPEED_EASE_RATE * dt)
    this.speedMultiplier = lerp(this.speedMultiplier, this.targetSpeedMultiplier, smoothFactor)

    // ── Ellipse breathing — dual frequency for organic, never-mechanical feel ──
    if (this.ellipseGfx) {
      this.ellipseGfx.alpha =
        ELLIPSE_ALPHA_MID +
        ELLIPSE_ALPHA_AMP  * Math.sin(this.elapsed * (TWO_PI / ELLIPSE_BREATHE_PERIOD)) +
        ELLIPSE_ALPHA_AMP2 * Math.sin(this.elapsed * (TWO_PI / ELLIPSE_BREATHE_PERIOD2))
    }

    // ── Sparks ─────────────────────────────────────────────────────────────────
    for (const spark of this.sparks) {
      spark.angle = (spark.angle + spark.speed * this.speedMultiplier * dt) % TWO_PI

      const x = this.cx + this.rx * Math.cos(spark.angle)
      const y = this.cy + this.ry * Math.sin(spark.angle)

      // Depth alpha: faint at top of orbit (behind trophy), full at bottom (front)
      const depthT = (Math.sin(spark.angle) + 1) / 2
      spark.container.x = x
      spark.container.y = y
      spark.container.alpha = 0.06 + (spark.maxAlpha - 0.06) * depthT

      // Physical depth routing — true occlusion by layer order
      const target = y >= this.layerSplit ? this.frontLayer! : this.backLayer!
      if (spark.container.parent !== target) target.addChild(spark.container)
    }

    // ── Comet ──────────────────────────────────────────────────────────────────
    this.cometAngle = (this.cometAngle + this.cometSpeed * this.speedMultiplier * dt) % TWO_PI

    for (let i = 0; i < this.cometDots.length; i++) {
      const dotAngle = this.cometAngle - i * TRAIL_STEP
      const x = this.cx + this.rx * Math.cos(dotAngle)
      const y = this.cy + this.ry * Math.sin(dotAngle)

      const depthT = (Math.sin(dotAngle) + 1) / 2
      const trailFade = 1 - i / TRAIL_DOTS

      this.cometDots[i].x = x
      this.cometDots[i].y = y
      this.cometDots[i].alpha = (0.04 + 0.65 * depthT) * trailFade
    }
  }

  destroy(): void {
    this.ellipseGfx?.destroy()
    for (const spark of this.sparks) spark.container.destroy({ children: true })
    for (const dot of this.cometDots) dot.destroy()
    this.ellipseGfx = null
    this.sparks = []
    this.cometDots = []
    this.backLayer = null
    this.frontLayer = null
  }
}
