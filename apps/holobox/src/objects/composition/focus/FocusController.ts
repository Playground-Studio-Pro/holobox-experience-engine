import { Container, Assets } from 'pixi.js'
import type { Texture, FederatedPointerEvent } from 'pixi.js'
import { gsap } from 'gsap'
import type { CompositionSlotConfig, PlayerData } from '@/config/types'
import type { FloatingMotionSystem } from '@/objects/motion/FloatingMotionSystem'
import type { OrbitDecorationLayer } from '@/objects/orbit/OrbitDecorationLayer'
import type { InteractionController } from '@/objects/composition/InteractionController'
import { CompositionPhoto } from '@/objects/composition/CompositionPhoto'
import { CompositionFocusView } from './CompositionFocusView'
import { lerp } from '@/utils'
import { CANVAS_WIDTH } from '@/config/defaults'


// Focus position — photo target, centered horizontally
const FOCUS_HEIGHT   = 1050
const FOCUS_CENTER_X = 540
const FOCUS_CENTER_Y = 610

// Travel animation
const EASE        = 'expo.inOut'
const ENTER_DUR   = 0.82
const EXIT_DUR    = 0.72
const ENTER_DELAY = 0.06

// Browse slide animation
const SLIDE_DUR  = 0.38
const SLIDE_EASE = 'power2.inOut'

// Swipe threshold in canvas pixels
const SWIPE_THRESHOLD = 50

// Background dim
const DIM_DURATION     = 0.55
const RESTORE_DURATION = 0.50

/**
 * Orchestrates the Focus Experience including the Memory Browser.
 *
 * Open: the composition photo physically leaves its slot (reparented to UI
 * layer, floating frozen) and travels to the focus position.
 *
 * Browse: swipe / arrow keys / arrow buttons slide the current photo out
 * and a new one in without closing focus. The original slot is remembered.
 *
 * Close: the original composition photo always travels back to its
 * originating slot, regardless of which player is currently browsed.
 */
export class FocusController {
  private isOpen          = false
  private isTransitioning = false
  private isNavigating    = false
  private onClosedCallback: (() => void) | null = null

  // Origin — captured at open(), used unchanged until close()
  private sourceIndex   = 0
  private originX       = 0
  private originY       = 0
  private originScale   = 1
  private sourceAlpha   = 1
  private sourceParent: Container | null = null
  private sourceParentIndex = 0
  private backgroundAlphas: number[] = []

  // Browse state
  private browseIndex  = 0
  private focusScale   = 1
  private slotRef: CompositionSlotConfig | null = null

  // Active display — what's currently visible at focus position
  private activeDisplay: Container | null = null
  private activeIsSource  = true
  private browseCleanup: (() => void) | null = null  // destroys current browse photo

  // Event cleanup
  private sourceFocusBlocker: ((e: FederatedPointerEvent) => void) | null = null
  private keyListener: ((e: KeyboardEvent) => void) | null = null

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
  ) {
    this.focusView = new CompositionFocusView(
      () => this.close(),
      (dir) => this.navigate(dir),
    )
  }

  open(slotIndex: number, slot: CompositionSlotConfig, currentPlayerIndex?: number): void {
    if (this.isOpen || this.isTransitioning) return

    const source = this.containers[slotIndex]
    if (!source) return

    this.isOpen          = true
    this.isTransitioning = true
    this.isNavigating    = false
    this.sourceIndex     = slotIndex

    // Freeze floating — snaps source to base position, stops per-tick drift
    this.floating.freezeItem(source)

    // Capture exact slot position (clean after freeze)
    this.originX     = source.x
    this.originY     = source.y
    this.originScale = lerp(0.65, 1.0, slot.depth ?? 0.5)
    this.sourceAlpha = source.alpha

    // Snapshot background alphas before dimming
    this.backgroundAlphas = this.containers.map((c) => c.alpha)

    // Kill any in-progress tweens on source (e.g. lift from touch)
    gsap.killTweensOf(source)
    gsap.killTweensOf(source.scale)

    // Browse state
    this.browseIndex    = currentPlayerIndex ?? slot.playerIndex
    this.focusScale     = FOCUS_HEIGHT / slot.height
    this.slotRef        = slot
    this.activeDisplay  = source
    this.activeIsSource = true
    this.browseCleanup  = null

    // ── Photo physically leaves the composition ───────────────────────────────
    this.sourceParent      = source.parent
    this.sourceParentIndex = source.parent?.getChildIndex(source) ?? 0
    source.parent?.removeChild(source)

    // focusView (backdrop + panel) mounts first — lower z than the photo
    this.focusView.mount(this.uiLayer)
    this.uiLayer.addChild(source)

    // Snap scale to origin (clear lift animation remnant)
    source.scale.set(this.originScale)

    // Stop backdrop close when tapping the focus photo; detect swipe
    const blocker = (e: FederatedPointerEvent) => e.stopPropagation()
    source.on('pointerdown', blocker)
    this.sourceFocusBlocker = blocker
    this._addSwipeHandlers(source)

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

    // ── Keyboard navigation ───────────────────────────────────────────────────
    this.keyListener = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') this.navigate('next')
      else if (e.key === 'ArrowLeft') this.navigate('prev')
      else if (e.key === 'Escape') this.close()
    }
    window.addEventListener('keydown', this.keyListener)

    // ── Photo travels toward viewer ───────────────────────────────────────────
    gsap.to(source, {
      x: FOCUS_CENTER_X, y: FOCUS_CENTER_Y, alpha: 1,
      delay: ENTER_DELAY, duration: ENTER_DUR, ease: EASE, overwrite: true,
    })
    gsap.to(source.scale, {
      x: this.focusScale, y: this.focusScale,
      delay: ENTER_DELAY, duration: ENTER_DUR, ease: EASE, overwrite: true,
      onComplete: () => {
        this.isTransitioning = false
        this.focusView.showPanel()
      },
    })
  }

  navigate(direction: 'prev' | 'next'): void {
    if (!this.isOpen || this.isTransitioning || this.isNavigating) return
    if (!this.slotRef) return

    const total    = this.players.length
    const newIndex = ((this.browseIndex + (direction === 'next' ? 1 : -1)) % total + total) % total
    const player   = this.players[newIndex]
    if (!player?.photoUrl) return

    this.isNavigating = true

    Assets.load<Texture>(player.photoUrl)
      .then((texture) => this._slideToPlayer(newIndex, texture, direction))
      .catch(() => { this.isNavigating = false })
  }

  close(): void {
    if (!this.isOpen || this.isTransitioning) return

    this._removeKeyListener()

    this.isTransitioning = true
    this.isOpen          = false

    this.focusView.hidePanel(() => {
      const source = this.containers[this.sourceIndex]

      // Restore background cards
      for (let i = 0; i < this.containers.length; i++) {
        if (i === this.sourceIndex) continue
        gsap.to(this.containers[i], {
          alpha: this.backgroundAlphas[i],
          duration: RESTORE_DURATION, ease: 'expo.out', overwrite: true,
        })
      }

      this.floating.setAmplitudeScale(1.0)
      this.orbitDeco?.setSlowMotion(false)

      // If browsed away from source, destroy browse photo and restore source to center
      if (!this.activeIsSource) {
        gsap.killTweensOf(this.activeDisplay)
        this.browseCleanup?.()
        this.browseCleanup  = null
        this.activeDisplay  = null
        this.activeIsSource = true

        // Source was parked at focus center with alpha=0 — restore it
        gsap.killTweensOf(source)
        gsap.killTweensOf(source.scale)
        source.x = FOCUS_CENTER_X
        source.y = FOCUS_CENTER_Y
        source.scale.set(this.focusScale)
        source.alpha = this.sourceAlpha
      }

      // ── Source returns precisely to its slot ──────────────────────────────
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
          this.isNavigating    = false
          this.interactionCtrl.setEnabled(true)
          this.onClosedCallback?.()
        },
      })
    })
  }

  destroy(): void {
    this._removeKeyListener()

    const source = this.containers[this.sourceIndex]
    for (const c of this.containers) {
      gsap.killTweensOf(c)
      gsap.killTweensOf(c.scale)
    }

    if (!this.activeIsSource) {
      gsap.killTweensOf(this.activeDisplay)
      this.browseCleanup?.()
      this.browseCleanup = null
    }

    if (source && source.parent === this.uiLayer) {
      this._restoreSource(source)
    }

    this.focusView.destroy()
    this.isOpen          = false
    this.isTransitioning = false
    this.isNavigating    = false
  }

  // ── Private ────────────────────────────────────────────────────────────────

  private _slideToPlayer(newIndex: number, texture: Texture, direction: 'prev' | 'next'): void {
    const slot = this.slotRef!

    const newPhoto = new CompositionPhoto({
      width:  slot.width,
      height: slot.height,
      radius: slot.radius ?? 14,
      alpha:  1,
    })
    newPhoto.setTexture(texture)

    const newContainer = newPhoto.container
    const slideDir     = direction === 'next' ? 1 : -1

    newContainer.x = FOCUS_CENTER_X + slideDir * CANVAS_WIDTH
    newContainer.y = FOCUS_CENTER_Y
    newContainer.scale.set(this.focusScale)
    newContainer.eventMode = 'static'
    this.uiLayer.addChild(newContainer)

    // Swipe + propagation block on browse photos
    newContainer.on('pointerdown', (e: FederatedPointerEvent) => e.stopPropagation())
    this._addSwipeHandlers(newContainer)

    const prevDisplay   = this.activeDisplay!
    const prevIsSource  = this.activeIsSource
    const prevCleanup   = this.browseCleanup

    // Slide current display out
    gsap.to(prevDisplay, {
      x: FOCUS_CENTER_X - slideDir * CANVAS_WIDTH,
      duration: SLIDE_DUR, ease: SLIDE_EASE, overwrite: true,
      onComplete: () => {
        if (prevIsSource) {
          // Park source invisibly at focus center — needed for return animation
          prevDisplay.x     = FOCUS_CENTER_X
          prevDisplay.y     = FOCUS_CENTER_Y
          prevDisplay.alpha = 0
          prevDisplay.scale.set(this.focusScale)
        } else {
          prevCleanup?.()
        }
      },
    })

    // Slide new photo in
    gsap.to(newContainer, {
      x: FOCUS_CENTER_X,
      duration: SLIDE_DUR, ease: SLIDE_EASE, overwrite: true,
      onComplete: () => {
        this.activeDisplay  = newContainer
        this.activeIsSource = false
        this.browseCleanup  = () => { newPhoto.destroy() }
        this.isNavigating   = false
      },
    })

    this.browseIndex = newIndex
    this.focusView.setActiveDot(newIndex)
  }

  private _addSwipeHandlers(container: Container): void {
    let swipeStartX = 0
    container.on('pointerdown', (e: FederatedPointerEvent) => { swipeStartX = e.globalX })
    container.on('pointerup',   (e: FederatedPointerEvent) => {
      const dx = e.globalX - swipeStartX
      if (Math.abs(dx) > SWIPE_THRESHOLD) {
        this.navigate(dx < 0 ? 'next' : 'prev')
      }
    })
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

  private _removeKeyListener(): void {
    if (this.keyListener) {
      window.removeEventListener('keydown', this.keyListener)
      this.keyListener = null
    }
  }
}
