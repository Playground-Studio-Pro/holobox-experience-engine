import { Container, Graphics, BlurFilter, FederatedPointerEvent } from 'pixi.js'
import { gsap } from 'gsap'
import type { CompositionSlotConfig } from '@/config/types'
import type { OrbitDecorationLayer } from '@/objects/orbit/OrbitDecorationLayer'

export type PhotoSelectedCallback = (index: number, slot: CompositionSlotConfig) => void

// ── Hover ─────────────────────────────────────────────────────────────────────
const HOVER_DUR   = 0.18
const OUT_DUR     = 0.24
const HOVER_SCALE = 1.02
const HOVER_GLOW  = 0.58

// ── Press: two-phase compress → lift ─────────────────────────────────────────
// Phase 1 — compress on contact (physical confirmation)
const COMPRESS_DUR   = 0.06
const COMPRESS_SCALE = 0.96
const COMPRESS_GLOW  = 0.28
// Pause between compress and lift
const LIFT_DELAY     = 0.08
// Phase 2 — lift above slot before focus begins
const LIFT_DUR       = 0.15
const LIFT_SCALE     = 1.04
const LIFT_GLOW      = 0.78
// Callback fires this far into the lift (photo is visibly rising when focus starts)
const SELECT_OFFSET  = 0.06

/**
 * Adds hover and press interaction to editorial composition photos.
 *
 * Press sequence: compress (60ms) → 80ms pause → lift → onPhotoSelected fires.
 * The user feels physical contact at compress, gets confirmation at lift,
 * then the focus transition takes over — all within ~200ms of touch.
 *
 * Ghost cards (blur > 0) are never interactive.
 * Slot positions are never mutated.
 */
export class InteractionController {
  private readonly containers: Container[]
  private readonly slots: CompositionSlotConfig[]
  private readonly orbitDeco: OrbitDecorationLayer | null

  private readonly hoverGlows: (Container | null)[] = []
  private readonly shadowRefs: (Container | null)[] = []
  private readonly baseShadowAlphas: number[] = []
  private readonly baseScales: number[] = []

  private readonly pressedSlots = new Set<number>()
  // Pending delayed calls — killed in destroy() and on setEnabled(false)
  private pendingDelays: gsap.core.Tween[] = []

  private enabled = true
  private onPhotoSelectedCallback: PhotoSelectedCallback | null = null

  constructor(
    containers: Container[],
    slots: CompositionSlotConfig[],
    orbitDeco: OrbitDecorationLayer | null = null,
  ) {
    this.containers = containers
    this.slots      = slots
    this.orbitDeco  = orbitDeco
  }

  onPhotoSelected(cb: PhotoSelectedCallback): void {
    this.onPhotoSelectedCallback = cb
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    if (!enabled) {
      this.pressedSlots.clear()
      this.orbitDeco?.setSlowMotion(false)
      // Kill pending press delays so no deferred callbacks fire after focus opens
      for (const d of this.pendingDelays) d.kill()
      this.pendingDelays = []
    }
  }

  mount(): void {
    for (let i = 0; i < this.containers.length; i++) {
      const slot      = this.slots[i]
      const container = this.containers[i]

      if (slot.blur) {
        this.hoverGlows.push(null)
        this.shadowRefs.push(null)
        this.baseShadowAlphas.push(0)
        this.baseScales.push(container.scale.x)
        continue
      }

      // ── Shadow reference (injected at children[0] by useAmbientMotion) ───────
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
      bloom.stroke({ color: 0xffffff, width: 12, alpha: 0.30 })
      bloom.filters = [new BlurFilter({ strength: 10 })]

      const border = new Graphics()
      border.roundRect(-hw, -hh, slot.width, slot.height, r)
      border.stroke({ color: 0xffffff, width: 1.5, alpha: 0.80 })

      const hoverGlow = new Container()
      hoverGlow.addChild(bloom, border)
      hoverGlow.alpha = 0
      container.addChild(hoverGlow)
      this.hoverGlows.push(hoverGlow)

      this.baseScales.push(container.scale.x)

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
    if (!this.enabled) return
    if (this.pressedSlots.has(i)) return
    const base = this.baseScales[i]
    gsap.to(this.containers[i].scale, { x: base * HOVER_SCALE, y: base * HOVER_SCALE, duration: HOVER_DUR, ease: 'expo.out', overwrite: true })
    const glow = this.hoverGlows[i]
    if (glow) gsap.to(glow, { alpha: HOVER_GLOW, duration: HOVER_DUR, ease: 'expo.out', overwrite: true })
    const shadow = this.shadowRefs[i]
    if (shadow) gsap.to(shadow, { alpha: this.baseShadowAlphas[i] * 1.6, duration: HOVER_DUR, ease: 'expo.out', overwrite: true })
  }

  private onOut(i: number): void {
    if (!this.enabled) return
    this.pressedSlots.delete(i)
    this.orbitDeco?.setSlowMotion(false)
    const base = this.baseScales[i]
    gsap.to(this.containers[i].scale, { x: base, y: base, duration: OUT_DUR, ease: 'power2.inOut', overwrite: true })
    const glow = this.hoverGlows[i]
    if (glow) gsap.to(glow, { alpha: 0, duration: OUT_DUR, ease: 'power2.inOut', overwrite: true })
    const shadow = this.shadowRefs[i]
    if (shadow) gsap.to(shadow, { alpha: this.baseShadowAlphas[i], duration: OUT_DUR, ease: 'power2.inOut', overwrite: true })
  }

  private onPress(i: number): void {
    if (!this.enabled || this.pressedSlots.has(i)) return
    this.pressedSlots.add(i)

    const container = this.containers[i]
    const base      = this.baseScales[i]
    const glow      = this.hoverGlows[i]
    const shadow    = this.shadowRefs[i]
    const shadowBase = this.baseShadowAlphas[i]

    // ── Phase 1: compress — immediate physical confirmation ───────────────────
    gsap.to(container.scale, { x: base * COMPRESS_SCALE, y: base * COMPRESS_SCALE, duration: COMPRESS_DUR, ease: 'power3.out', overwrite: true })
    if (glow)   gsap.to(glow,   { alpha: COMPRESS_GLOW,             duration: COMPRESS_DUR, ease: 'power2.out', overwrite: true })
    if (shadow) gsap.to(shadow, { alpha: shadowBase * 2.0,           duration: COMPRESS_DUR, ease: 'power2.out', overwrite: true })

    // ── Phase 2: lift — 80ms later, confirms gesture ──────────────────────────
    const liftDelay = gsap.delayedCall(LIFT_DELAY, () => {
      if (!this.pressedSlots.has(i)) return

      gsap.to(container.scale, { x: base * LIFT_SCALE, y: base * LIFT_SCALE, duration: LIFT_DUR, ease: 'power2.out', overwrite: true })
      if (glow)   gsap.to(glow,   { alpha: LIFT_GLOW,         duration: LIFT_DUR, ease: 'power2.out', overwrite: true })
      if (shadow) gsap.to(shadow, { alpha: shadowBase * 2.8,   duration: LIFT_DUR, ease: 'power2.out', overwrite: true })

      this.orbitDeco?.setSlowMotion(true)

      // Fire selection partway into the lift — photo is visibly rising when focus starts
      const selectDelay = gsap.delayedCall(SELECT_OFFSET, () => {
        if (this.pressedSlots.has(i)) this.onPhotoSelectedCallback?.(i, this.slots[i])
      })
      this.pendingDelays.push(selectDelay)
    })
    this.pendingDelays.push(liftDelay)
  }

  private onRelease(i: number): void {
    if (!this.enabled) return
    this.pressedSlots.delete(i)
    this.orbitDeco?.setSlowMotion(false)
    this.onHover(i)
  }

  destroy(): void {
    for (const d of this.pendingDelays) d.kill()
    this.pendingDelays = []

    for (let i = 0; i < this.containers.length; i++) {
      const container = this.containers[i]
      const hoverGlow = this.hoverGlows[i]
      const shadowRef = this.shadowRefs[i]

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
