import type { Container } from 'pixi.js'
import { gsap } from 'gsap'
import type { OrbitItem } from '@/objects/orbit'
import type { GalleryConfig } from '@/config/types'

export class GalleryModule {
  private item: OrbitItem | null = null
  private backLayer: Container | null = null
  private frontLayer: Container | null = null
  private timeoutHandle: ReturnType<typeof setTimeout> | null = null

  constructor(
    private readonly config: GalleryConfig,
    private readonly timeoutMs: number,
    private readonly onCloseRequest: () => void,
  ) {}

  open(
    item: OrbitItem,
    galleryLayer: Container,
    backLayer: Container,
    frontLayer: Container,
  ): void {
    this.item = item
    this.backLayer = backLayer
    this.frontLayer = frontLayer

    // Detach from orbit — engine will skip this item's container updates
    item.isDetached = true

    // Reparent to ui layer so it renders above everything
    galleryLayer.addChild(item.container)

    gsap.killTweensOf(item.container)
    gsap.killTweensOf(item.container.scale)

    gsap.to(item.container, {
      x: this.config.targetX,
      y: this.config.targetY,
      alpha: 1,
      duration: 0.65,
      ease: 'power3.out',
      overwrite: true,
    })
    gsap.to(item.container.scale, {
      x: this.config.targetScale,
      y: this.config.targetScale,
      duration: 0.65,
      ease: 'power3.out',
      overwrite: true,
    })

    // Glow fades over the same duration the card travels — peaks just before movement
    item.fadeGlowForGallery(0.65)

    this.startTimeout()
  }

  close(): void {
    const item = this.item
    if (!item) return

    this.clearTimeout()
    this.item = null

    // Start unfocus animation now — glow fades as the item travels back
    item.unfocus()

    gsap.killTweensOf(item.container)
    gsap.killTweensOf(item.container.scale)

    gsap.to(item.container, {
      x: item.orbitX,
      y: item.orbitY,
      alpha: item.orbitAlpha,
      duration: 0.55,
      ease: 'power2.inOut',
      overwrite: true,
      onComplete: () => this.reattach(item),
    })
    gsap.to(item.container.scale, {
      x: item.orbitScale,
      y: item.orbitScale,
      duration: 0.55,
      ease: 'power2.inOut',
      overwrite: true,
    })
  }

  destroy(): void {
    this.clearTimeout()
    // If a close animation is in flight, stop it and reattach immediately
    if (this.item) {
      gsap.killTweensOf(this.item.container)
      gsap.killTweensOf(this.item.container.scale)
      this.reattach(this.item)
      this.item = null
    }
  }

  private reattach(item: OrbitItem): void {
    const layer = item.currentLayer === 'orbitFront' ? this.frontLayer! : this.backLayer!
    layer.addChild(item.container)
    item.isDetached = false
    this.backLayer = null
    this.frontLayer = null
  }

  private startTimeout(): void {
    this.clearTimeout()
    this.timeoutHandle = setTimeout(() => this.onCloseRequest(), this.timeoutMs)
  }

  private clearTimeout(): void {
    if (this.timeoutHandle !== null) {
      clearTimeout(this.timeoutHandle)
      this.timeoutHandle = null
    }
  }
}
