import { Container } from 'pixi.js'
import { gsap } from 'gsap'
import type { OrbitItemType, OrbitLayer } from './types'

export abstract class OrbitItem {
  abstract readonly type: OrbitItemType

  /** Outer container — OrbitEngine controls position, depth scale, depth alpha */
  readonly container: Container
  /** Inner container — focus/dim animations live here, isolated from depth math */
  protected readonly visual: Container

  currentLayer: OrbitLayer = 'orbitBack'

  /** When true, OrbitEngine skips updating this item's container — Gallery owns it */
  isDetached = false

  /** Last computed orbit position/scale/alpha — updated every frame even when detached */
  orbitX = 0
  orbitY = 0
  orbitScale = 1
  orbitAlpha = 1

  constructor() {
    this.container = new Container()
    this.visual = new Container()
    this.container.addChild(this.visual)
  }

  abstract focus(): void
  abstract unfocus(): void

  dim(): void {
    gsap.to(this.visual, { alpha: 0.28, duration: 0.4, ease: 'power2.out', overwrite: true })
  }

  undim(): void {
    gsap.to(this.visual, { alpha: 1, duration: 0.5, ease: 'power2.inOut', overwrite: true })
  }

  destroy(): void {
    gsap.killTweensOf(this.visual)
    gsap.killTweensOf(this.visual.scale)
    this.container.destroy({ children: true })
  }
}
