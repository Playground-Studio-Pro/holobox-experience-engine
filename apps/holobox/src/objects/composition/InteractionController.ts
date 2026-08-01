import { Container, Graphics, BlurFilter, FederatedPointerEvent } from 'pixi.js'
import { gsap } from 'gsap'
import type { CompositionSlotConfig } from '@/config/types'
import type { OrbitDecorationLayer } from '@/objects/orbit/OrbitDecorationLayer'

export type PhotoSelectedCallback = (index: number, slot: CompositionSlotConfig) => void

const HOVER_DURATION = 0.12   // 120ms
const PRESS_DURATION = 0.06   // 60ms — immediate response
const HOVER_SCALE    = 1.02   // +2%
const PRESS_SCALE    = 1.05   // +5% lift above slot
const HOVER_GLOW     = 0.70
const PRESS_GLOW     = 1.00

/**
 * Adds hover and press-lift interaction to editorial composition photos.
 *
 * - Ghost cards (blur > 0) are never interactive.
 * - Hero and supporting cards are equally touchable — all open Focus.
 * - Slot positions are never mutated. Cards do not exchange slots.
 * - onPhotoSelected fires on pointerdown with the card index and its slot config.
 *   The next Focus ticket wires this to the Focus Experience.
 */
export class InteractionController {
  private readonly containers: Container[]
  private readonly slots: CompositionSlotConfig[]
  private readonly orbitDeco: OrbitDecorationLayer | null

  // Per-slot hover assets — null for ghost (non-interactive) slots
  private readonly hoverGlows: (Container | null)[] = []
  private readonly shadowRefs: (Container | null)[] = []
  private readonly baseShadowAlphas: number[] = []
  private readonly baseScales: number[] = []

  // Which slots are currently in a pressed state (prevents double-fire)
  private readonly pressedSlots = new Set<number>()

  private onPhotoSelectedCallback: PhotoSelectedCallback | null = null

  constructor(
    containers: Container[],
    slots: CompositionSlotConfig[],
    orbitDeco: OrbitDecorationLayer | null = null,
  ) {
    this.containers = containers
    this.slots = slots
    this.orbitDeco = orbitDeco
  }

  /**
   * Register the callback fired when a touchable photo is selected.
   * Receives the slot index and its config — source of truth for position,
   * size, and depth for the Focus Experience to build from.
   */
  onPhotoSelected(cb: PhotoSelectedCallback): void {
    this.onPhotoSelectedCallback = cb
  }

  mount(): void {
    for (let i = 0; i < this.containers.length; i++) {
      const slot      = this.slots[i]
      const container = this.containers[i]

      // Ghost cards are not interactive
      if (slot.blur) {
        this.hoverGlows.push(null)
        this.shadowRefs.push(null)
        this.baseShadowAlphas.push(0)
        this.baseScales.push(container.scale.x)
        continue
      }

      // ── Snapshot shadow reference ────────────────────────────────────────────
      // injectShadow() in useAmbientMotion inserts shadowCt at children[0].
      const shadowCt  = container.children[0] as Container | null
      const hasShadow = shadowCt instanceof Container && (shadowCt.filters?.length ?? 0) > 0
      this.shadowRefs.push(hasShadow ? shadowCt : null)
      this.baseShadowAlphas.push(hasShadow ? (shadowCt?.alpha ?? 0) : 0)

      // ── Hover / press glow ───────────────────────────────────────────────────
      const hw = slot.width  / 2
      const hh = slot.height / 2
      const r  = slot.radius ?? 14

      const bloom = new Graphics()
      bloom.roundRect(-hw, -hh, slot.width, slot.height, r)
      bloom.stroke({ color: 0xffffff, width: 10, alpha: 0.35 })
      bloom.filters = [new BlurFilter({ strength: 8 })]

      const border = new Graphics()
      border.roundRect(-hw, -hh, slot.width, slot.height, r)
      border.stroke({ color: 0xffffff, width: 2, alpha: 0.85 })

      const hoverGlow = new Container()
      hoverGlow.addChild(bloom, border)
      hoverGlow.alpha = 0
      container.addChild(hoverGlow)
      this.hoverGlows.push(hoverGlow)

      // Snapshot depth scale — set by useAmbientMotion before this mount runs
      this.baseScales.push(container.scale.x)

      // ── Events ───────────────────────────────────────────────────────────────
      container.eventMode = 'static'
      container.cursor    = 'pointer'

      const idx = i
      container.on('pointerover',      () => this.onHover(idx))
      container.on('pointerout',       () => this.onOut(idx))
      container.on('pointerdown',      (e: FederatedPointerEvent) => { e.stopPropagation(); this.onPress(idx) })
      container.on('pointerup',        () => this.onRelease(idx))
      container.on('pointerupoutside', () => this.onOut(idx))
    }
  }

  private onHover(i: number): void {
    if (this.pressedSlots.has(i)) return  // stay in press state if still held
    const base = this.baseScales[i]
    gsap.to(this.containers[i].scale, { x: base * HOVER_SCALE, y: base * HOVER_SCALE, duration: HOVER_DURATION, ease: 'power2.out', overwrite: true })
    const glow = this.hoverGlows[i]
    if (glow) gsap.to(glow, { alpha: HOVER_GLOW, duration: HOVER_DURATION, ease: 'power2.out', overwrite: true })
    const shadow = this.shadowRefs[i]
    if (shadow) gsap.to(shadow, { alpha: this.baseShadowAlphas[i] * 1.8, duration: HOVER_DURATION, ease: 'power2.out', overwrite: true })
  }

  private onOut(i: number): void {
    this.pressedSlots.delete(i)
    this.orbitDeco?.setSlowMotion(false)
    const base = this.baseScales[i]
    gsap.to(this.containers[i].scale, { x: base, y: base, duration: HOVER_DURATION, ease: 'power2.in', overwrite: true })
    const glow = this.hoverGlows[i]
    if (glow) gsap.to(glow, { alpha: 0, duration: HOVER_DURATION, ease: 'power2.in', overwrite: true })
    const shadow = this.shadowRefs[i]
    if (shadow) gsap.to(shadow, { alpha: this.baseShadowAlphas[i], duration: HOVER_DURATION, ease: 'power2.in', overwrite: true })
  }

  private onPress(i: number): void {
    if (this.pressedSlots.has(i)) return
    this.pressedSlots.add(i)

    // Immediate lift — photograph rises above its slot
    const base = this.baseScales[i]
    gsap.to(this.containers[i].scale, { x: base * PRESS_SCALE, y: base * PRESS_SCALE, duration: PRESS_DURATION, ease: 'power2.out', overwrite: true })
    const glow = this.hoverGlows[i]
    if (glow) gsap.to(glow, { alpha: PRESS_GLOW, duration: PRESS_DURATION, ease: 'power2.out', overwrite: true })
    const shadow = this.shadowRefs[i]
    if (shadow) gsap.to(shadow, { alpha: this.baseShadowAlphas[i] * 2.5, duration: PRESS_DURATION, ease: 'power2.out', overwrite: true })

    // Slow ambient orbit during touch response
    this.orbitDeco?.setSlowMotion(true)

    // Emit selection — Focus ticket wires this to its controller
    this.onPhotoSelectedCallback?.(i, this.slots[i])
  }

  private onRelease(i: number): void {
    // Restore orbit, drop back to hover state (pointer is still over the card)
    this.pressedSlots.delete(i)
    this.orbitDeco?.setSlowMotion(false)
    this.onHover(i)
  }

  destroy(): void {
    for (let i = 0; i < this.containers.length; i++) {
      const container = this.containers[i]
      const hoverGlow = this.hoverGlows[i]
      const shadowRef = this.shadowRefs[i]

      // Container may already be destroyed if composition.destroy() ran first
      if (!container.destroyed) {
        container.removeAllListeners()
        container.eventMode = 'none'
        container.cursor    = 'default'
      }
      gsap.killTweensOf(container.scale)

      if (hoverGlow) {
        gsap.killTweensOf(hoverGlow)
        if (!hoverGlow.destroyed) hoverGlow.destroy({ children: true })
      }
      if (shadowRef) gsap.killTweensOf(shadowRef)
    }
    this.hoverGlows.length = 0
    this.shadowRefs.length = 0
    this.pressedSlots.clear()
    this.onPhotoSelectedCallback = null
  }
}
