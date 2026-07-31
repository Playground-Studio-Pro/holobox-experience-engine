import { Container, Graphics, BlurFilter, FederatedPointerEvent } from 'pixi.js'
import { gsap } from 'gsap'
import type { CompositionSlotConfig } from '@/config/types'

const HOVER_DURATION = 0.12  // 120ms
const HOVER_SCALE    = 1.02  // +2%

export class InteractionController {
  private readonly containers: Container[]
  private readonly slots: CompositionSlotConfig[]

  private heroIndex = 0

  // Per-slot hover assets — null for ghost slots (non-interactive)
  private readonly hoverGlows: (Container | null)[] = []
  private readonly shadowRefs: (Container | null)[] = []
  private readonly baseShadowAlphas: number[] = []
  // Current base scale per slot — updated after each hero swap
  private readonly baseScales: number[] = []

  private onClickCallback: ((index: number) => void) | null = null

  constructor(containers: Container[], slots: CompositionSlotConfig[]) {
    this.containers = containers
    this.slots = slots
  }

  onSlotClick(cb: (index: number) => void): void {
    this.onClickCallback = cb
  }

  /** Called by HeroTransitionController after each swap completes. */
  setHeroIndex(index: number): void {
    this.heroIndex = index
  }

  /**
   * Called by HeroTransitionController after a swap to keep hover
   * scale calculations in sync with the new depth-scaled sizes.
   */
  updateBaseScale(index: number, scale: number): void {
    this.baseScales[index] = scale
  }

  mount(): void {
    for (let i = 0; i < this.containers.length; i++) {
      const slot = this.slots[i]
      const container = this.containers[i]

      // Ghost cards (blurred) are not interactive
      if (slot.blur) {
        this.hoverGlows.push(null)
        this.shadowRefs.push(null)
        this.baseShadowAlphas.push(0)
        this.baseScales.push(container.scale.x)
        continue
      }

      // ── Snapshot shadow reference ────────────────────────────────────────────
      // injectShadow() inserts shadowCt at children[0]; photoContainer moves to [1].
      // We snapshot alpha here so hover can amplify it then restore exactly.
      const shadowCt = container.children[0] as Container | null
      const hasShadow = shadowCt instanceof Container && shadowCt.filters?.length > 0
      this.shadowRefs.push(hasShadow ? shadowCt : null)
      this.baseShadowAlphas.push(hasShadow ? (shadowCt?.alpha ?? 0) : 0)

      // ── Hover glow — white border stroke + soft bloom ───────────────────────
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

      // ── Base scale (depth-driven, set by useAmbientMotion before mount) ──────
      this.baseScales.push(container.scale.x)

      // ── Events ───────────────────────────────────────────────────────────────
      container.eventMode = 'static'
      container.cursor = 'pointer'
      const idx = i
      container.on('pointerover', () => this.onHover(idx))
      container.on('pointerout',  () => this.onOut(idx))
      container.on('pointerdown', (e: FederatedPointerEvent) => {
        e.stopPropagation()
        if (idx !== this.heroIndex) {
          this.onClickCallback?.(idx)
        }
      })
    }
  }

  private onHover(i: number): void {
    const container  = this.containers[i]
    const hoverGlow  = this.hoverGlows[i]
    const shadowRef  = this.shadowRefs[i]
    const baseScale  = this.baseScales[i]
    const baseShadow = this.baseShadowAlphas[i]

    gsap.to(container.scale, {
      x: baseScale * HOVER_SCALE,
      y: baseScale * HOVER_SCALE,
      duration: HOVER_DURATION,
      ease: 'power2.out',
      overwrite: true,
    })
    if (hoverGlow) {
      gsap.to(hoverGlow, { alpha: 1, duration: HOVER_DURATION, ease: 'power2.out', overwrite: true })
    }
    if (shadowRef && baseShadow > 0) {
      gsap.to(shadowRef, { alpha: baseShadow * 2.2, duration: HOVER_DURATION, ease: 'power2.out', overwrite: true })
    }
  }

  private onOut(i: number): void {
    const container  = this.containers[i]
    const hoverGlow  = this.hoverGlows[i]
    const shadowRef  = this.shadowRefs[i]
    const baseScale  = this.baseScales[i]
    const baseShadow = this.baseShadowAlphas[i]

    gsap.to(container.scale, {
      x: baseScale,
      y: baseScale,
      duration: HOVER_DURATION,
      ease: 'power2.in',
      overwrite: true,
    })
    if (hoverGlow) {
      gsap.to(hoverGlow, { alpha: 0, duration: HOVER_DURATION, ease: 'power2.in', overwrite: true })
    }
    if (shadowRef && baseShadow > 0) {
      gsap.to(shadowRef, { alpha: baseShadow, duration: HOVER_DURATION, ease: 'power2.in', overwrite: true })
    }
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
        container.cursor = 'default'
      }
      gsap.killTweensOf(container.scale)

      if (hoverGlow) {
        gsap.killTweensOf(hoverGlow)
        if (!hoverGlow.destroyed) hoverGlow.destroy({ children: true })
      }
      if (shadowRef) {
        gsap.killTweensOf(shadowRef)
      }
    }
    this.hoverGlows.length = 0
    this.shadowRefs.length = 0
    this.onClickCallback = null
  }
}
