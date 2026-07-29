import { Graphics } from 'pixi.js'
import { gsap } from 'gsap'
import { OrbitItem } from '../OrbitItem'
import type { OrbitItemType } from '../types'

const W = 140
const H = 180
const RADIUS = 12

export class PhotoItem extends OrbitItem {
  readonly type: OrbitItemType = 'photo'
  private readonly glowRing: Graphics

  constructor() {
    super()
    this.container.label = 'orbit:photo'

    const hw = W / 2
    const hh = H / 2

    // Double-ring glow — soft outer + crisp inner — hidden by default
    const glowRing = new Graphics()
    glowRing.roundRect(-hw - 10, -hh - 10, W + 20, H + 20, RADIUS + 8)
    glowRing.stroke({ color: 0xffffff, width: 8, alpha: 0.15 })
    glowRing.roundRect(-hw - 4, -hh - 4, W + 8, H + 8, RADIUS + 3)
    glowRing.stroke({ color: 0xffffff, width: 2, alpha: 0.7 })
    glowRing.alpha = 0
    this.glowRing = glowRing

    const card = new Graphics()
    card.roundRect(-hw, -hh, W, H, RADIUS)
    card.fill({ color: 0x0d0d1a, alpha: 0.78 })
    card.stroke({ color: 0xffffff, width: 2, alpha: 0.65 })

    this.visual.addChild(glowRing, card)
  }

  focus(): void {
    gsap.to(this.visual.scale, { x: 1.12, y: 1.12, duration: 0.4, ease: 'back.out(1.5)', overwrite: true })
    gsap.to(this.glowRing, { alpha: 1, duration: 0.35, ease: 'power2.out', overwrite: true })
  }

  unfocus(): void {
    gsap.to(this.visual.scale, { x: 1, y: 1, duration: 0.4, ease: 'power2.inOut', overwrite: true })
    gsap.to(this.glowRing, { alpha: 0, duration: 0.3, ease: 'power2.in', overwrite: true })
  }

  destroy(): void {
    gsap.killTweensOf(this.glowRing)
    super.destroy()
  }
}
