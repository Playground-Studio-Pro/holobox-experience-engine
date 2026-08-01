import { Container } from 'pixi.js'
import type { FederatedPointerEvent } from 'pixi.js'
import { gsap } from 'gsap'
import type { CompositionSlotConfig, PlayerData } from '@/config/types'
import type { FloatingMotionSystem } from '@/objects/motion/FloatingMotionSystem'
import type { OrbitDecorationLayer } from '@/objects/orbit/OrbitDecorationLayer'
import type { InteractionController } from '@/objects/composition/InteractionController'
import { CompositionFocusView } from './CompositionFocusView'
import { lerp } from '@/utils'

// Photo target — 55% of canvas height, centered horizontally
const FOCUS_HEIGHT   = 1050
const FOCUS_CENTER_X = 540
const FOCUS_CENTER_Y = 610

// Cinematic easing — very slow start, sweeps through, deliberate landing
const EASE       = 'expo.inOut'
const ENTER_DUR  = 0.82
const EXIT_DUR   = 0.72
const ENTER_DELAY = 0.06

// Background dims slowly — the world recedes, not snaps
const DIM_DURATION     = 0.55
const RESTORE_DURATION = 0.50

/**
 * Orchestrates the Focus Experience.
 *
 * The touched photograph physically leaves the composition:
 * frozen out of FloatingMotionSystem, reparented to the UI layer,
 * then GSAP-animated to the focus position. No duplicate. No texture swap.
 * No fade in/out of the source.
 *
 * On close the photograph travels back to its exact slot position,
 * is reparented to its original layer at its original z-index,
 * and floating resumes seamlessly.
 */
export class FocusController {
  private isOpen          = false
  private isTransitioning = false
  private onClosedCallback: (() => void) | null = null

  private sourceIndex       = 0
  private originX           = 0
  private originY           = 0
  private originScale       = 1
  private sourceAlpha       = 1
  private sourceParent: Container | null = null
  private sourceParentIndex = 0
  private sourceFocusBlocker: ((e: FederatedPointerEvent) => void) | null = null
  private backgroundAlphas: number[] = []

  private readonly focusView: CompositionFocusView

  onClosed(cb: () => void): void {
    this.onClosedCallback = cb
  }

  constructor(
    private readonly uiLayer: Container,
    private readonly containers: Container[],
    private readonly slots: CompositionSlotConfig[],
    private readonly players: PlayerData[],
    private readonly floating: FloatingMotionSystem,
    private readonly orbitDeco: OrbitDecorationLayer | null,
    private readonly interactionCtrl: InteractionController,
    private readonly footerName?: string,
  ) {
    this.focusView = new CompositionFocusView(() => this.close())
  }

  open(slotIndex: number, slot: CompositionSlotConfig, currentPlayerIndex?: number): void {
    if (this.isOpen || this.isTransitioning) return

    const source = this.containers[slotIndex]
    if (!source) return

    const playerIdx = currentPlayerIndex ?? slot.playerIndex
    const player    = this.players[playerIdx]

    this.isOpen          = true
    this.isTransitioning = true
    this.sourceIndex     = slotIndex

    // Freeze floating — snaps source to base position, stops per-tick drift
    this.floating.freezeItem(source)

    // Capture exact slot position (now snapped clean by freezeItem)
    this.originX     = source.x
    this.originY     = source.y
    this.originScale = lerp(0.65, 1.0, slot.depth ?? 0.5)
    this.sourceAlpha = source.alpha

    // Snapshot background alphas before any dimming
    this.backgroundAlphas = this.containers.map((c) => c.alpha)

    // Kill any in-progress tweens on source (e.g. compress/lift from touch)
    gsap.killTweensOf(source)
    gsap.killTweensOf(source.scale)

    // ── Photo physically leaves the composition ───────────────────────────────
    this.sourceParent      = source.parent
    this.sourceParentIndex = source.parent?.getChildIndex(source) ?? 0
    source.parent?.removeChild(source)

    // focusView (backdrop + panel) mounts first — lower z-order than the photo
    this.focusView.mount(this.uiLayer)
    this.uiLayer.addChild(source)

    // Snap scale to origin (clear any lift animation remnant)
    source.scale.set(this.originScale)

    // Prevent backdrop close when tapping the focus photo
    const blocker = (e: FederatedPointerEvent) => e.stopPropagation()
    source.on('pointerdown', blocker)
    this.sourceFocusBlocker = blocker

    // ── Background recedes ────────────────────────────────────────────────────
    for (let i = 0; i < this.containers.length; i++) {
      if (i === slotIndex) continue
      const target = this.slots[i]?.blur
        ? this.backgroundAlphas[i] * 0.50
        : this.backgroundAlphas[i] * 0.36
      gsap.to(this.containers[i], { alpha: target, delay: 0.05, duration: DIM_DURATION, ease: 'power1.out', overwrite: true })
    }

    this.floating.setAmplitudeScale(0.22)
    this.orbitDeco?.setSlowMotion(true)
    this.interactionCtrl.setEnabled(false)

    // ── Photo travels toward viewer ───────────────────────────────────────────
    const focusScale = FOCUS_HEIGHT / slot.height
    gsap.to(source, {
      x: FOCUS_CENTER_X, y: FOCUS_CENTER_Y, alpha: 1,
      delay: ENTER_DELAY, duration: ENTER_DUR, ease: EASE, overwrite: true,
    })
    gsap.to(source.scale, {
      x: focusScale, y: focusScale,
      delay: ENTER_DELAY, duration: ENTER_DUR, ease: EASE, overwrite: true,
      onComplete: () => {
        this.isTransitioning = false
        this.focusView.showPanel(player ?? null, this.footerName)
      },
    })
  }

  close(): void {
    if (!this.isOpen || this.isTransitioning) return
    this.isTransitioning = true
    this.isOpen          = false

    this.focusView.hidePanel(() => {
      const source = this.containers[this.sourceIndex]

      // World re-enters awareness
      for (let i = 0; i < this.containers.length; i++) {
        if (i === this.sourceIndex) continue
        gsap.to(this.containers[i], {
          alpha: this.backgroundAlphas[i],
          duration: RESTORE_DURATION, ease: 'expo.out', overwrite: true,
        })
      }

      this.floating.setAmplitudeScale(1.0)
      this.orbitDeco?.setSlowMotion(false)

      // ── Photo returns precisely to its slot ───────────────────────────────
      gsap.to(source, {
        x: this.originX, y: this.originY, alpha: this.sourceAlpha,
        duration: EXIT_DUR, ease: EASE, overwrite: true,
      })
      gsap.to(source.scale, {
        x: this.originScale, y: this.originScale,
        duration: EXIT_DUR, ease: EASE, overwrite: true,
        onComplete: () => {
          this._restoreSource(source)
          this.focusView.unmount()
          this.isTransitioning = false
          this.interactionCtrl.setEnabled(true)
          this.onClosedCallback?.()
        },
      })
    })
  }

  destroy(): void {
    const source = this.containers[this.sourceIndex]

    for (const c of this.containers) {
      gsap.killTweensOf(c)
      gsap.killTweensOf(c.scale)
    }

    if (source && source.parent === this.uiLayer) {
      this._restoreSource(source)
    }

    this.focusView.destroy()
    this.isOpen          = false
    this.isTransitioning = false
  }

  private _restoreSource(source: Container): void {
    if (this.sourceFocusBlocker) {
      source.off('pointerdown', this.sourceFocusBlocker)
      this.sourceFocusBlocker = null
    }

    if (source.parent === this.uiLayer) {
      this.uiLayer.removeChild(source)
    }

    if (this.sourceParent && !this.sourceParent.destroyed) {
      const maxIdx = this.sourceParent.children.length
      this.sourceParent.addChildAt(source, Math.min(this.sourceParentIndex, maxIdx))
    }

    this.floating.unfreezeItem(source, this.originX, this.originY)
  }
}
