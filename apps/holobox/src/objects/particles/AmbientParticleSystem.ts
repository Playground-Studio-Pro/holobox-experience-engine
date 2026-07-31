import { Container, Graphics, BlurFilter } from 'pixi.js'
import type { Ticker } from 'pixi.js'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/config/defaults'

const TWO_PI = Math.PI * 2
const DEFAULT_COUNT = 30
const BLUR_FRACTION = 0.30  // 30% soft blurred circles, 70% tiny dots

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
 * 30 ambient particles that drift upward very slowly, resembling illuminated dust.
 * 70% are tiny sharp dots; 30% are soft blurred circles.
 * No explosions, no bursts — just continuous subtle drift.
 */
export class AmbientParticleSystem {
  readonly container = new Container()
  private readonly particles: Particle[] = []
  private elapsed = 0

  mount(layer: Container, count = DEFAULT_COUNT): void {
    const blurCount = Math.floor(count * BLUR_FRACTION)

    for (let i = 0; i < count; i++) {
      const isBlurred = i < blurCount
      const size = isBlurred ? 5 + Math.random() * 9 : 1 + Math.random() * 2
      const baseAlpha = isBlurred
        ? 0.05 + Math.random() * 0.08
        : 0.10 + Math.random() * 0.20

      const gfx = new Graphics()
      gfx.circle(0, 0, size)
      gfx.fill({ color: 0xffffff })

      if (isBlurred) {
        gfx.filters = [new BlurFilter({ strength: size * 1.4 })]
      }

      const p: Particle = {
        gfx,
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        // Slow horizontal drift ± 0.2px/s, gentle upward float 0.06–0.28px/s
        vx: (Math.random() - 0.5) * 0.40,
        vy: -0.06 - Math.random() * 0.22,
        baseAlpha,
        phaseSpeed: 0.12 + Math.random() * 0.22,
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

      // Seamless wrap at ±60px margin so particles never pop in
      if (p.x < -60) p.x = CANVAS_WIDTH + 60
      if (p.x > CANVAS_WIDTH + 60) p.x = -60
      if (p.y < -60) p.y = CANVAS_HEIGHT + 60
      if (p.y > CANVAS_HEIGHT + 60) p.y = -60

      // Slow alpha breathing — each particle breathes at its own rate
      p.gfx.alpha = p.baseAlpha * (0.55 + 0.45 * Math.sin(this.elapsed * p.phaseSpeed + p.phase))
      p.gfx.x = p.x
      p.gfx.y = p.y
    }
  }

  destroy(): void {
    this.container.destroy({ children: true })
    this.particles.length = 0
  }
}
