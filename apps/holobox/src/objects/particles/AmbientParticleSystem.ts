import { Container, Graphics, BlurFilter } from 'pixi.js'
import type { Ticker } from 'pixi.js'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/config/defaults'

const TWO_PI = Math.PI * 2
const DEFAULT_COUNT = 30
const BLUR_FRACTION = 0.30  // 30% large blurred circles, 70% tiny sharp dots

interface Particle {
  gfx: Graphics
  x: number
  y: number
  vx: number
  vy: number
  baseAlpha: number
  phaseSpeed: number
  phase: number
}

/**
 * Illuminated dust in a gallery: very slow upward drift, independent alpha breathing.
 * 70% tiny sharp dots; 30% large soft blurred circles in the far background.
 * Quantity fixed at 30 — never more, never fewer.
 */
export class AmbientParticleSystem {
  readonly container = new Container()
  private readonly particles: Particle[] = []
  private elapsed = 0

  mount(layer: Container, count = DEFAULT_COUNT): void {
    const blurCount = Math.floor(count * BLUR_FRACTION)

    for (let i = 0; i < count; i++) {
      const isBlurred = i < blurCount

      // Blurred far-background circles are larger and more varied in size
      const size = isBlurred
        ? 8 + Math.random() * 18   // 8–26px — large, impressionistic
        : 0.8 + Math.random() * 1.8  // 0.8–2.6px — crisp, fine

      // Very faint — dust not snow. Blurred circles even fainter (they're larger)
      const baseAlpha = isBlurred
        ? 0.04 + Math.random() * 0.07
        : 0.08 + Math.random() * 0.18

      const gfx = new Graphics()
      gfx.circle(0, 0, size)
      gfx.fill({ color: 0xffffff })

      if (isBlurred) {
        // Heavier blur for background circles — creates real depth variation
        gfx.filters = [new BlurFilter({ strength: size * 1.6 })]
      }

      const p: Particle = {
        gfx,
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        // Very slow — drift is felt, not watched. Max 0.3px/s horizontal.
        vx: (Math.random() - 0.5) * 0.28,
        vy: -0.04 - Math.random() * 0.12,  // gentle upward float only
        baseAlpha,
        // Each particle breathes at its own rate: cycle 28–80 seconds
        phaseSpeed: 0.08 + Math.random() * 0.15,
        phase: Math.random() * TWO_PI,
      }

      gfx.x = p.x
      gfx.y = p.y
      gfx.alpha = baseAlpha

      this.particles.push(p)
      this.container.addChild(gfx)
    }

    layer.addChild(this.container)
  }

  update(ticker: Ticker): void {
    const dt = ticker.deltaMS / 1000
    this.elapsed += dt

    for (const p of this.particles) {
      p.x += p.vx
      p.y += p.vy

      // Seamless wrap — particles appear continuously without popping
      if (p.x < -80) p.x = CANVAS_WIDTH + 80
      if (p.x > CANVAS_WIDTH + 80) p.x = -80
      if (p.y < -80) p.y = CANVAS_HEIGHT + 80
      if (p.y > CANVAS_HEIGHT + 80) p.y = -80

      // Slow breathing alpha — range 50–100% of baseAlpha
      p.gfx.alpha = p.baseAlpha * (0.50 + 0.50 * Math.sin(this.elapsed * p.phaseSpeed + p.phase))
      p.gfx.x = p.x
      p.gfx.y = p.y
    }
  }

  destroy(): void {
    this.container.destroy({ children: true })
    this.particles.length = 0
  }
}
