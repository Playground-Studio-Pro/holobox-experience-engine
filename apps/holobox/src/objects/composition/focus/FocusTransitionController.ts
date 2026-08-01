import { Container, Rectangle } from 'pixi.js'
import type { Texture } from 'pixi.js'
import { gsap } from 'gsap'
import { CompositionPhoto } from '@/objects/composition/CompositionPhoto'
import type { CompositionSlotConfig } from '@/config/types'

// Cinematic easing — very slow start, sweeps through, deliberate landing
const EASE         = 'expo.inOut'
// Travel durations — long enough to feel intentional, not instantaneous
const ENTER_DUR    = 0.82  // opening: photo lifts toward viewer
const EXIT_DUR     = 0.72  // closing: memory returns to collection
// Small delay on enter: lets the press-lift settle before the journey begins
const ENTER_DELAY  = 0.06

/**
 * Creates a visual duplicate of a composition photo and animates it
 * between its editorial slot position and the Focus view position.
 *
 * The duplicate lives on the ui layer — above all composition content.
 * expo.inOut easing gives the photo physical weight: reluctant start,
 * purposeful sweep, precise landing.
 */
export class FocusTransitionController {
  private photo: CompositionPhoto | null = null
  private root: Container | null = null

  create(
    texture: Texture,
    slot: CompositionSlotConfig,
    originX: number,
    originY: number,
    originScale: number,
  ): Container {
    const photo = new CompositionPhoto({
      width:  slot.width,
      height: slot.height,
      radius: slot.radius ?? 14,
      alpha:  1.0,
    })
    photo.setTexture(texture)

    const root = new Container()
    root.addChild(photo.container)
    root.x = originX
    root.y = originY
    root.scale.set(originScale)

    root.eventMode = 'static'
    root.hitArea   = new Rectangle(-slot.width / 2, -slot.height / 2, slot.width, slot.height)
    root.on('pointerdown', (e) => e.stopPropagation())

    this.photo = photo
    this.root  = root
    return root
  }

  /** Animate photo from its editorial slot to the focus position. */
  animateTo(
    targetX: number,
    targetY: number,
    targetScale: number,
    onComplete: () => void,
  ): void {
    if (!this.root) return
    gsap.to(this.root, {
      x: targetX, y: targetY,
      delay: ENTER_DELAY, duration: ENTER_DUR, ease: EASE, overwrite: true,
    })
    gsap.to(this.root.scale, {
      x: targetScale, y: targetScale,
      delay: ENTER_DELAY, duration: ENTER_DUR, ease: EASE, overwrite: true,
      onComplete,
    })
  }

  /** Animate photo back to its original slot — feels like memory returning. */
  animateBack(
    originX: number,
    originY: number,
    originScale: number,
    onComplete: () => void,
  ): void {
    if (!this.root) return
    gsap.to(this.root, { x: originX, y: originY, duration: EXIT_DUR, ease: EASE, overwrite: true })
    gsap.to(this.root.scale, {
      x: originScale, y: originScale,
      duration: EXIT_DUR, ease: EASE, overwrite: true,
      onComplete,
    })
  }

  destroy(): void {
    if (!this.root) return
    gsap.killTweensOf(this.root)
    gsap.killTweensOf(this.root.scale)
    this.root.parent?.removeChild(this.root)
    this.photo?.destroy()
    this.photo = null
    this.root  = null
  }
}
