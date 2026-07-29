import { Container, Graphics, Sprite, BlurFilter } from 'pixi.js'
import type { Texture } from 'pixi.js'
import { gsap } from 'gsap'
import { OrbitItem } from '../OrbitItem'
import type { OrbitItemType } from '../types'

const W = 140
const H = 180
const RADIUS = 12

export class PhotoItem extends OrbitItem {
  readonly type: OrbitItemType = 'photo'

  private readonly shadow: Container
  private readonly outerGlow: Container
  private readonly innerGlow: Container
  private photoSprite: Sprite | null = null

  constructor() {
    super()
    this.container.label = 'orbit:photo'

    const hw = W / 2
    const hh = H / 2

    // Shadow — blurred dark shape offset downward
    const shadowShape = new Graphics()
    shadowShape.roundRect(-hw, -hh, W, H, RADIUS)
    shadowShape.fill({ color: 0x000000, alpha: 0.75 })
    const shadow = new Container()
    shadow.addChild(shadowShape)
    shadow.filters = [new BlurFilter({ strength: 16 })]
    shadow.y = 14
    shadow.alpha = 0
    this.shadow = shadow

    // Outer glow — wide soft bloom
    const outerGlowShape = new Graphics()
    outerGlowShape.roundRect(-hw, -hh, W, H, RADIUS)
    outerGlowShape.fill({ color: 0xffffff, alpha: 0.55 })
    const outerGlow = new Container()
    outerGlow.addChild(outerGlowShape)
    outerGlow.filters = [new BlurFilter({ strength: 28 })]
    outerGlow.alpha = 0
    this.outerGlow = outerGlow

    // Inner glow — tighter, keeps the card edge luminous
    const innerGlowShape = new Graphics()
    innerGlowShape.roundRect(-hw, -hh, W, H, RADIUS)
    innerGlowShape.fill({ color: 0xffffff, alpha: 0.8 })
    const innerGlow = new Container()
    innerGlow.addChild(innerGlowShape)
    innerGlow.filters = [new BlurFilter({ strength: 10 })]
    innerGlow.alpha = 0
    this.innerGlow = innerGlow

    // Card surface
    const card = new Graphics()
    card.roundRect(-hw, -hh, W, H, RADIUS)
    card.fill({ color: 0x0d0d1a, alpha: 0.88 })
    card.stroke({ color: 0xffffff, width: 1.5, alpha: 0.55 })

    this.visual.addChild(shadow, outerGlow, innerGlow, card)
  }

  /** Replace placeholder card with a loaded photo texture */
  setTexture(texture: Texture): void {
    if (this.photoSprite) {
      this.photoSprite.texture = texture
      return
    }
    const sprite = new Sprite(texture)
    sprite.anchor.set(0.5)
    sprite.width = W - 6
    sprite.height = H - 6
    // Insert above the card (index 3 = after shadow, outerGlow, innerGlow, card)
    this.visual.addChild(sprite)
    this.photoSprite = sprite
  }

  focus(): void {
    // Glow ramps in first
    gsap.to(this.outerGlow, { alpha: 0.85, duration: 0.13, ease: 'power2.out', overwrite: true })
    gsap.to(this.innerGlow, { alpha: 0.9, duration: 0.13, ease: 'power2.out', overwrite: true })
    gsap.to(this.shadow, { alpha: 0.8, duration: 0.13, ease: 'power2.out', overwrite: true })
    // Scale breathes in 80ms after glow peaks
    gsap.to(this.visual.scale, {
      x: 1.12,
      y: 1.12,
      duration: 0.35,
      ease: 'back.out(1.5)',
      delay: 0.08,
      overwrite: true,
    })
  }

  unfocus(duration = 0.3): void {
    gsap.to(this.visual.scale, { x: 1, y: 1, duration, ease: 'power2.inOut', overwrite: true })
    gsap.to(this.outerGlow, { alpha: 0, duration, ease: 'power2.in', overwrite: true })
    gsap.to(this.innerGlow, { alpha: 0, duration, ease: 'power2.in', overwrite: true })
    gsap.to(this.shadow, { alpha: 0, duration, ease: 'power2.in', overwrite: true })
  }

  /** Glow fades while card travels to Gallery; scale returns to 1 so container zoom takes over */
  override fadeGlowForGallery(duration: number): void {
    gsap.to(this.outerGlow, { alpha: 0, duration, ease: 'power1.in', overwrite: true })
    gsap.to(this.innerGlow, { alpha: 0, duration, ease: 'power1.in', overwrite: true })
    gsap.to(this.shadow, { alpha: 0, duration, ease: 'power1.in', overwrite: true })
    gsap.to(this.visual.scale, { x: 1, y: 1, duration: duration * 0.7, ease: 'power2.inOut', overwrite: true })
  }

  destroy(): void {
    gsap.killTweensOf(this.outerGlow)
    gsap.killTweensOf(this.innerGlow)
    gsap.killTweensOf(this.shadow)
    super.destroy()
  }
}
