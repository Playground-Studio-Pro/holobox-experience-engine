import { Container, Assets } from 'pixi.js'
import type { Texture } from 'pixi.js'
import { gsap } from 'gsap'
import type { CompositionSlotConfig, PlayerData } from '@/config/types'
import type { FloatingMotionSystem } from '@/objects/motion/FloatingMotionSystem'
import type { OrbitDecorationLayer } from '@/objects/orbit/OrbitDecorationLayer'
import type { InteractionController } from '@/objects/composition/InteractionController'
import { FocusTransitionController } from './FocusTransitionController'
import { CompositionFocusView } from './CompositionFocusView'

// Photo target: 55% of canvas height, centered horizontally
const FOCUS_HEIGHT    = 1050
const FOCUS_CENTER_X  = 540
const FOCUS_CENTER_Y  = 610

// Timing for background dimming / restore
const DIM_DURATION    = 0.40
const RESTORE_DURATION = 0.35

/**
 * Orchestrates the composition Focus Experience.
 *
 * - open(slotIndex, slot): photo travels from its editorial position
 *   to the focus view. Editorial composition remains underneath.
 * - close(): reverses the animation and restores all ambient motion.
 *
 * EditorialComposition owns idle layout — this controller owns focus state.
 * Slot positions are never mutated.
 */
export class FocusController {
  private isOpen          = false
  private isTransitioning = false
  private onClosedCallback: (() => void) | null = null

  private sourceIndex = 0
  private originX     = 0
  private originY     = 0
  private originScale = 1
  private backgroundAlphas: number[] = []

  private transitionCtrl: FocusTransitionController | null = null
  private readonly focusView: CompositionFocusView

  /** Register a callback fired once the close animation fully completes. */
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

  open(slotIndex: number, slot: CompositionSlotConfig): void {
    if (this.isOpen || this.isTransitioning) return

    const source = this.containers[slotIndex]
    if (!source) return

    // Texture must already be cached — EditorialComposition loads it at mount
    const player   = this.players[slot.playerIndex]
    const texture  = player?.photoUrl ? Assets.get<Texture>(player.photoUrl) : null
    if (!texture) return

    this.isOpen         = true
    this.isTransitioning = true
    this.sourceIndex    = slotIndex

    // Snapshot base position from FloatingMotionSystem proxy (not live offset)
    const proxy      = this.floating.getBaseProxy(source)
    this.originX     = proxy?.baseX ?? source.x
    this.originY     = proxy?.baseY ?? source.y
    this.originScale = source.scale.x

    // Snapshot all card alphas before modifying anything
    this.backgroundAlphas = this.containers.map((c) => c.alpha)

    // Create duplicate at origin, place on ui layer AFTER focusView so it's on top
    const transitionCtrl = new FocusTransitionController()
    const duplicate = transitionCtrl.create(texture, slot, this.originX, this.originY, this.originScale)
    this.transitionCtrl = transitionCtrl

    // focusView (backdrop + panel) goes in first → lower z → behind duplicate photo
    this.focusView.mount(this.uiLayer)
    this.uiLayer.addChild(duplicate)

    // Dim all background cards; hide the source
    for (let i = 0; i < this.containers.length; i++) {
      if (i === slotIndex) {
        // Source fades out with slight delay so duplicate starts visible above it
        gsap.to(this.containers[i], { alpha: 0, delay: 0.08, duration: 0.30, ease: 'power2.in', overwrite: true })
      } else {
        const target = this.slots[i]?.blur
          ? this.backgroundAlphas[i] * 0.55
          : this.backgroundAlphas[i] * 0.38
        gsap.to(this.containers[i], { alpha: target, duration: DIM_DURATION, ease: 'power2.out', overwrite: true })
      }
    }

    this.floating.setAmplitudeScale(0.22)
    this.orbitDeco?.setSlowMotion(true)
    this.interactionCtrl.setEnabled(false)

    const focusScale = FOCUS_HEIGHT / slot.height
    transitionCtrl.animateTo(FOCUS_CENTER_X, FOCUS_CENTER_Y, focusScale, () => {
      this.isTransitioning = false
      this.focusView.showPanel(player ?? null, this.footerName)
    })
  }

  close(): void {
    if (!this.isOpen || this.isTransitioning) return
    this.isTransitioning = true
    this.isOpen          = false

    this.focusView.hidePanel(() => {
      // Restore non-source card alphas as soon as the panel disappears
      for (let i = 0; i < this.containers.length; i++) {
        if (i !== this.sourceIndex) {
          gsap.to(this.containers[i], {
            alpha: this.backgroundAlphas[i],
            duration: RESTORE_DURATION, ease: 'power2.out', overwrite: true,
          })
        }
      }

      this.floating.setAmplitudeScale(1.0)
      this.orbitDeco?.setSlowMotion(false)

      this.transitionCtrl?.animateBack(
        this.originX, this.originY, this.originScale,
        () => {
          // Swap duplicate for original — instant, positions are identical
          this.containers[this.sourceIndex].alpha = this.backgroundAlphas[this.sourceIndex]

          this.transitionCtrl?.destroy()
          this.transitionCtrl = null
          this.focusView.unmount()

          this.isTransitioning = false
          this.interactionCtrl.setEnabled(true)
          this.onClosedCallback?.()
        },
      )
    })
  }

  destroy(): void {
    // Kill any in-progress card tweens
    for (const c of this.containers) gsap.killTweensOf(c)

    this.transitionCtrl?.destroy()
    this.transitionCtrl = null
    this.focusView.destroy()
    this.isOpen         = false
    this.isTransitioning = false
  }
}
