import { Container, Sprite, BlurFilter } from 'pixi.js'
import type { Texture, Ticker } from 'pixi.js'
import type { Vec2 } from '@/types'

const TWO_PI = Math.PI * 2

// Ghosts orbit at 0.78–0.90× the main ellipse radii — safely within canvas bounds
// while appearing to belong to a more distant spatial layer.
const RADIUS_SCALE_MIN = 0.78
const RADIUS_SCALE_MAX = 0.90

// Extremely slow drift — ghosts should feel geological, not animated
const SPEED_FRAC_MIN = 0.12
const SPEED_FRAC_MAX = 0.22

// Visual parameters — barely perceptible, suggesting infinite archive
const GHOST_SCALE_MIN = 0.18
const GHOST_SCALE_MAX = 0.28
const GHOST_ALPHA_MIN = 0.05
const GHOST_ALPHA_MAX = 0.10
const GHOST_BLUR      = 10
const GHOST_BLUR_PAD  = 40   // = GHOST_BLUR × 4

interface Ghost {
  container:    Container
  sprite:       Sprite
  angle:        number
  speed:        number
  radiusScale:  number
  textureIndex: number   // index into the allTextures array this ghost currently shows
}

/**
 * 2–3 heavily blurred, near-invisible photographs orbiting slowly behind the main orbit.
 *
 * Part 1 (Ticket 0014) — Active texture registry:
 *   Each ghost tracks which texture index it displays. When the orbit scheduler confirms
 *   a swap, OrbitEngine calls updateExclusions() with the new active set. Any ghost whose
 *   textureIndex conflicts is immediately reassigned to an unused texture.
 *
 *   This guarantees no photograph appears simultaneously in an orbit slot AND a ghost.
 */
export class ArchiveGhostLayer {
  private ghosts:              Ghost[] = []
  private readonly center:    Vec2
  private readonly baseSpeed: number

  constructor(center: Vec2, baseSpeed: number) {
    this.center    = center
    this.baseSpeed = baseSpeed
  }

  /**
   * Create ghost sprites, picking initial textures that don't conflict with
   * the orbit's currently active set.
   *
   * @param orbiting - texture indices already visible in orbit slots at mount time
   */
  mount(
    backLayer:  Container,
    textures:   Texture[],
    orbiting:   Set<number> = new Set(),
    count = 3,
  ): void {
    if (textures.length === 0) return

    const taken = new Set(orbiting)  // grows as each ghost claims its texture

    for (let i = 0; i < count; i++) {
      const idx = this.pickIndex(textures, taken)
      taken.add(idx)

      const sprite = new Sprite(textures[idx])
      sprite.anchor.set(0.5)
      sprite.scale.set(GHOST_SCALE_MIN + Math.random() * (GHOST_SCALE_MAX - GHOST_SCALE_MIN))

      const blur = new BlurFilter({ strength: GHOST_BLUR, quality: 3 })
      blur.padding = GHOST_BLUR_PAD
      sprite.filters = [blur]

      const ct   = new Container()
      ct.alpha   = GHOST_ALPHA_MIN + Math.random() * (GHOST_ALPHA_MAX - GHOST_ALPHA_MIN)
      ct.addChild(sprite)
      backLayer.addChild(ct)

      this.ghosts.push({
        container:   ct,
        sprite,
        angle:       Math.random() * TWO_PI,
        speed:       (SPEED_FRAC_MIN + Math.random() * (SPEED_FRAC_MAX - SPEED_FRAC_MIN)) * this.baseSpeed,
        radiusScale: RADIUS_SCALE_MIN + Math.random() * (RADIUS_SCALE_MAX - RADIUS_SCALE_MIN),
        textureIndex: idx,
      })
    }
  }

  /**
   * Called by OrbitEngine after every confirmed orbit swap.
   *
   * Any ghost currently showing a texture that entered the orbit active set
   * is quietly reassigned to a different texture — no animation, just a silent
   * texture swap on a nearly invisible sprite.
   */
  updateExclusions(textures: Texture[], orbiting: Set<number>): void {
    for (const ghost of this.ghosts) {
      if (orbiting.has(ghost.textureIndex)) {
        const ghostsUsed = new Set(this.ghosts.map((g) => g.textureIndex))
        const newIdx = this.pickIndex(textures, new Set([...orbiting, ...ghostsUsed]))
        ghost.textureIndex   = newIdx
        ghost.sprite.texture = textures[newIdx]
      }
    }
  }

  /** Advance ghost positions every frame. Receives live breathing ellipse radii. */
  update(ticker: Ticker, ellipseX: number, ellipseY: number): void {
    const dt = ticker.deltaMS / 1000

    for (const g of this.ghosts) {
      g.angle = (g.angle + g.speed * dt) % TWO_PI
      g.container.x = this.center.x + ellipseX * g.radiusScale * Math.cos(g.angle)
      g.container.y = this.center.y + ellipseY * g.radiusScale * Math.sin(g.angle)
    }
  }

  destroy(): void {
    for (const g of this.ghosts) g.container.destroy({ children: true })
    this.ghosts = []
  }

  // ── Private ─────────────────────────────────────────────────────────────────

  /**
   * Pick a texture index not in `exclude`.
   * Falls back to a random index if every texture is excluded
   * (only possible when textureCount ≤ totalSlots, unlikely in practice).
   */
  private pickIndex(textures: Texture[], exclude: Set<number>): number {
    const available = textures.map((_, i) => i).filter((i) => !exclude.has(i))
    const pool = available.length > 0 ? available : textures.map((_, i) => i)
    return pool[Math.floor(Math.random() * pool.length)]
  }
}
