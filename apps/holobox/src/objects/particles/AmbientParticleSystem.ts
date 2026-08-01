import { Container, Graphics, BlurFilter } from 'pixi.js'
import type { Ticker } from 'pixi.js'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/config/defaults'

const TWO_PI = Math.PI * 2

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
 * Three depth layers of illuminated dust — far, mid, near.
 *
 * Far layer   — large blurred hazes; very slow drift; barely visible.
 *               Creates the impression of depth and atmosphere.
 * Mid layer   — medium soft-blurred motes; moderate speed.
 *               The gallery "air" between subject and viewer.
 * Near layer  — tiny sharp specks; fastest drift; brightest.
 *               Reinforce the sense of a close physical space.
 *
 * Different movement speeds per layer create natural parallax.
 */
export class AmbientParticleSystem {
  readonly container = new Container()
  private readonly particles: Particle[] = []
  private elapsed = 0

  mount(layer: Container): void {
    this._spawnLayer({
      count:       12,
      sizeMin:     12, sizeMax:  32,
      alphaMin:  0.025, alphaMax: 0.065,
      blurFactor:  1.8,
      vxRange:     0.10,
      vyMin:     -0.025, vyMax: -0.065,
      breatheMin:  0.05, breatheMax: 0.10,   // 63–126s cycle
    })

    this._spawnLayer({
      count:      12,
      sizeMin:     2, sizeMax:   7,
      alphaMin:  0.06, alphaMax: 0.14,
      blurFactor:  0.9,
      vxRange:    0.18,
      vyMin:    -0.045, vyMax: -0.110,
      breatheMin: 0.09, breatheMax: 0.16,   // 39–70s cycle
    })

    this._spawnLayer({
      count:      10,
      sizeMin:   0.6, sizeMax:   2.0,
      alphaMin:  0.10, alphaMax: 0.24,
      blurFactor:  0,                        // sharp — nearest layer
      vxRange:    0.28,
      vyMin:    -0.065, vyMax: -0.165,
      breatheMin: 0.12, breatheMax: 0.22,   // 29–52s cycle
    })

    layer.addChild(this.container)
  }

  update(ticker: Ticker): void {
    const dt = ticker.deltaMS / 1000
    this.elapsed += dt

    for (const p of this.particles) {
      p.x += p.vx
      p.y += p.vy

      if (p.x < -80)                  p.x = CANVAS_WIDTH  + 80
      if (p.x > CANVAS_WIDTH  + 80)   p.x = -80
      if (p.y < -80)                  p.y = CANVAS_HEIGHT + 80
      if (p.y > CANVAS_HEIGHT + 80)   p.y = -80

      // Breathing alpha — never fully disappears (floor at 40% of base)
      p.gfx.alpha = p.baseAlpha * (0.40 + 0.60 * Math.sin(this.elapsed * p.phaseSpeed + p.phase))
      p.gfx.x = p.x
      p.gfx.y = p.y
    }
  }

  destroy(): void {
    this.container.destroy({ children: true })
    this.particles.length = 0
  }

  private _spawnLayer(opts: {
    count: number
    sizeMin: number; sizeMax: number
    alphaMin: number; alphaMax: number
    blurFactor: number
    vxRange: number
    vyMin: number; vyMax: number
    breatheMin: number; breatheMax: number
  }): void {
    for (let i = 0; i < opts.count; i++) {
      const size = opts.sizeMin + Math.random() * (opts.sizeMax - opts.sizeMin)
      const baseAlpha = opts.alphaMin + Math.random() * (opts.alphaMax - opts.alphaMin)

      const gfx = new Graphics()
      gfx.circle(0, 0, size)
      gfx.fill({ color: 0xffffff })

      if (opts.blurFactor > 0) {
        gfx.filters = [new BlurFilter({ strength: size * opts.blurFactor })]
      }

      const p: Particle = {
        gfx,
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        vx: (Math.random() - 0.5) * opts.vxRange * 2,
        vy: opts.vyMin + Math.random() * (opts.vyMax - opts.vyMin),
        baseAlpha,
        phaseSpeed: opts.breatheMin + Math.random() * (opts.breatheMax - opts.breatheMin),
        phase: Math.random() * TWO_PI,
      }

      gfx.x = p.x
      gfx.y = p.y
      gfx.alpha = baseAlpha

      this.particles.push(p)
      this.container.addChild(gfx)
    }
  }
}
