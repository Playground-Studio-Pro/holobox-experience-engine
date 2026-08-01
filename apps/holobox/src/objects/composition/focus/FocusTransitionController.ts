import { Container, Rectangle } from 'pixi.js'
import type { Texture } from 'pixi.js'
import { gsap } from 'gsap'
import { CompositionPhoto } from '@/objects/composition/CompositionPhoto'
import type { CompositionSlotConfig } from '@/config/types'

const ENTER_DURATION = 0.65
const EXIT_DURATION  = 0.55
const EASE           = 'power2.inOut'

/**
 * Creates a visual duplicate of a composition photo and animates it
 * between its editorial slot position and the Focus view position.
 *
 * The duplicate lives on the ui layer — above all composition content.
 * The original slot photo is hidden (alpha → 0) while the duplicate travels.
 */
export class FocusTransitionController {
  private photo: CompositionPhoto | null = null
  private root: Container | null = null

  /**
   * Build the duplicate container at the origin position.
   * Caller must add the returned container to the ui layer.
   */
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

    // Block backdrop tap events while finger is on the photo
    root.eventMode = 'static'
    root.hitArea   = new Rectangle(-slot.width / 2, -slot.height / 2, slot.width, slot.height)
    root.on('pointerdown', (e) => e.stopPropagation())

    this.photo = photo
    this.root  = root
    return root
  }

  animateTo(
    targetX: number,
    targetY: number,
    targetScale: number,
    onComplete: () => void,
  ): void {
    if (!this.root) return
    gsap.to(this.root, { x: targetX, y: targetY, duration: ENTER_DURATION, ease: EASE, overwrite: true })
    gsap.to(this.root.scale, {
      x: targetScale, y: targetScale,
      duration: ENTER_DURATION, ease: EASE, overwrite: true,
      onComplete,
    })
  }

  animateBack(
    originX: number,
    originY: number,
    originScale: number,
    onComplete: () => void,
  ): void {
    if (!this.root) return
    gsap.to(this.root, { x: originX, y: originY, duration: EXIT_DURATION, ease: EASE, overwrite: true })
    gsap.to(this.root.scale, {
      x: originScale, y: originScale,
      duration: EXIT_DURATION, ease: EASE, overwrite: true,
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
