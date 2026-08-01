import { Container, Graphics, Rectangle } from 'pixi.js'
import { gsap } from 'gsap'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/config/defaults'

// Photo area reference — arrows align with the photo centre
const FOCUS_CENTER_Y = 610

// Arrow glyphs — positioned at canvas edges, clear of any photo size
const ARROW_Y     = FOCUS_CENTER_Y
const ARROW_L_X   = 58
const ARROW_R_X   = CANVAS_WIDTH - 58
const ARROW_ALPHA = 0.55

// Pagination dots — just below the focus photo bottom (525px below centre)
const DOTS       = 5
const DOT_R      = 3
const DOT_GAP    = 12
const DOTS_Y     = FOCUS_CENTER_Y + 525 + 32
const DOTS_START = CANVAS_WIDTH / 2 - ((DOTS - 1) * DOT_GAP) / 2

// Swipe detection
const SWIPE_THRESHOLD = 50

/**
 * Minimal focus overlay: two navigation arrows + pagination dots.
 *
 * Everything else — metadata panel, close button, decorative frames — removed.
 * The photograph is the hero. The interface is invisible.
 *
 * Close: tap anywhere outside the photograph (backdrop handles it).
 * Navigate: tap arrows, swipe backdrop, or keyboard (handled by FocusController).
 */
export class CompositionFocusView {
  readonly root: Container
  private readonly uiGroup: Container
  private readonly dotGraphics: Graphics[] = []
  private isVisible = false

  constructor(
    private readonly onClose: () => void,
    private readonly onNavigate: (direction: 'prev' | 'next') => void,
  ) {
    this.root = new Container()
    this.root.label = 'focus:view'

    // ── Backdrop — fullscreen. Tap (no swipe) → close. Swipe → navigate. ─────
    let swipeStartX = 0
    const backdrop = new Container()
    backdrop.eventMode = 'static'
    backdrop.cursor    = 'default'
    backdrop.hitArea   = new Rectangle(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    backdrop.on('pointerdown', (e) => { swipeStartX = e.globalX })
    backdrop.on('pointerup',   (e) => {
      const dx = e.globalX - swipeStartX
      if (Math.abs(dx) > SWIPE_THRESHOLD) {
        this.onNavigate(dx < 0 ? 'next' : 'prev')
      } else {
        this.onClose()
      }
    })

    // ── UI group: arrows + dots. Fades in after photo settles. ───────────────
    const uiGroup = new Container()
    uiGroup.alpha = 0

    uiGroup.addChild(this.buildArrow('left'))
    uiGroup.addChild(this.buildArrow('right'))
    uiGroup.addChild(this.buildDots())

    this.uiGroup = uiGroup

    // z-order: backdrop (bottom) → uiGroup (arrows + dots on top)
    this.root.addChild(backdrop, uiGroup)
  }

  mount(uiLayer: Container): void {
    uiLayer.addChild(this.root)
  }

  unmount(): void {
    this.root.parent?.removeChild(this.root)
  }

  showPanel(): void {
    if (this.isVisible) return
    this.isVisible = true
    gsap.killTweensOf(this.uiGroup)
    this.uiGroup.alpha = 0
    gsap.to(this.uiGroup, { alpha: 1, duration: 0.35, ease: 'expo.out', overwrite: true })
  }

  hidePanel(onComplete?: () => void): void {
    if (!this.isVisible) { onComplete?.(); return }
    this.isVisible = false
    gsap.killTweensOf(this.uiGroup)
    gsap.to(this.uiGroup, {
      alpha: 0, duration: 0.22, ease: 'power2.in', overwrite: true, onComplete,
    })
  }

  setActiveDot(activeIndex: number): void {
    const activePos = activeIndex % DOTS
    for (let i = 0; i < this.dotGraphics.length; i++) {
      const dot = this.dotGraphics[i]
      const isActive = i === activePos
      dot.clear()
      dot.circle(DOTS_START + i * DOT_GAP, DOTS_Y, isActive ? DOT_R + 1 : DOT_R)
      dot.fill({ color: 0xffffff, alpha: isActive ? 0.60 : 0.20 })
    }
  }

  destroy(): void {
    gsap.killTweensOf(this.uiGroup)
    this.unmount()
    this.root.destroy({ children: true })
  }

  private buildArrow(dir: 'left' | 'right'): Container {
    const x   = dir === 'left' ? ARROW_L_X : ARROW_R_X
    const btn = new Container()

    const g = new Graphics()
    if (dir === 'left') {
      g.moveTo(x + 10, ARROW_Y - 14).lineTo(x - 6, ARROW_Y).lineTo(x + 10, ARROW_Y + 14)
    } else {
      g.moveTo(x - 10, ARROW_Y - 14).lineTo(x + 6, ARROW_Y).lineTo(x - 10, ARROW_Y + 14)
    }
    g.stroke({ color: 0xffffff, width: 2, alpha: ARROW_ALPHA, cap: 'round', join: 'round' })

    btn.addChild(g)
    btn.eventMode = 'static'
    btn.cursor    = 'pointer'
    btn.hitArea   = new Rectangle(x - 36, ARROW_Y - 44, 72, 88)
    btn.on('pointerdown', (e) => { e.stopPropagation(); this.onNavigate(dir === 'left' ? 'prev' : 'next') })
    btn.on('pointerup',   (e) => e.stopPropagation())

    return btn
  }

  private buildDots(): Container {
    const ct = new Container()
    ct.eventMode = 'none'

    for (let i = 0; i < DOTS; i++) {
      const dot = new Graphics()
      dot.eventMode = 'none'
      this.dotGraphics.push(dot)
      ct.addChild(dot)
    }

    this.setActiveDot(0)
    return ct
  }
}
