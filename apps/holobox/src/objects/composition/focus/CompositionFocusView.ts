import { Container, Graphics, Rectangle } from 'pixi.js'
import { gsap } from 'gsap'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/config/defaults'

// Photo area — must match FocusController constants
const FOCUS_CENTER_Y  = 610
const FOCUS_HALF_H    = 525   // FOCUS_HEIGHT / 2 = 1050 / 2

// Arrow buttons — at photo vertical centre, flanking the photo
const ARROW_Y   = FOCUS_CENTER_Y
const ARROW_L_X = 58
const ARROW_R_X = CANVAS_WIDTH - 58

// Pagination dots — just below the photo bottom
const DOTS       = 5
const DOT_R      = 4
const DOT_GAP    = 14
const DOTS_Y     = FOCUS_CENTER_Y + FOCUS_HALF_H + 44
const DOTS_START = CANVAS_WIDTH / 2 - ((DOTS - 1) * DOT_GAP) / 2

// Close button — centered, below dots
const CLOSE_Y = DOTS_Y + 84

// Shared button style — dark pill with white glyph
const BTN_R      = 38   // circle radius
const BTN_BG_CLR = 0x111111
const BTN_BG_A   = 0.58
const BTN_ICN    = 0xffffff
const BTN_ICN_A  = 0.92
const BTN_STR    = 3    // stroke width for glyphs

// Swipe detection
const SWIPE_THRESHOLD = 50

/**
 * Focus overlay: navigation arrows, pagination dots, and close button.
 *
 * All interactive elements use dark circular backgrounds so they remain
 * visible on any background colour (including white).
 *
 * Close: tap the × button or tap anywhere outside the photograph.
 * Navigate: tap arrows, swipe the backdrop, or keyboard (FocusController).
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

    // ── Backdrop — fullscreen tap-to-close / swipe-to-navigate ───────────────
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

    // ── UI group: arrows + dots + close. Fades in after photo settles. ────────
    const uiGroup = new Container()
    uiGroup.alpha = 0

    uiGroup.addChild(this.buildArrow('left'))
    uiGroup.addChild(this.buildArrow('right'))
    uiGroup.addChild(this.buildDots())
    uiGroup.addChild(this.buildCloseButton())

    this.uiGroup = uiGroup

    // z-order: backdrop → ui controls on top
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
      dot.circle(DOTS_START + i * DOT_GAP, DOTS_Y, isActive ? DOT_R + 1.5 : DOT_R)
      dot.fill({ color: BTN_ICN, alpha: isActive ? 0.85 : 0.30 })
    }
  }

  destroy(): void {
    gsap.killTweensOf(this.uiGroup)
    this.unmount()
    this.root.destroy({ children: true })
  }

  // ── Private builders ────────────────────────────────────────────────────────

  private buildArrow(dir: 'left' | 'right'): Container {
    const x = dir === 'left' ? ARROW_L_X : ARROW_R_X

    const bg = new Graphics()
    bg.circle(x, ARROW_Y, BTN_R)
    bg.fill({ color: BTN_BG_CLR, alpha: BTN_BG_A })

    const g = new Graphics()
    const arm = 13
    if (dir === 'left') {
      g.moveTo(x + arm * 0.5, ARROW_Y - arm)
        .lineTo(x - arm * 0.5, ARROW_Y)
        .lineTo(x + arm * 0.5, ARROW_Y + arm)
    } else {
      g.moveTo(x - arm * 0.5, ARROW_Y - arm)
        .lineTo(x + arm * 0.5, ARROW_Y)
        .lineTo(x - arm * 0.5, ARROW_Y + arm)
    }
    g.stroke({ color: BTN_ICN, width: BTN_STR, alpha: BTN_ICN_A, cap: 'round', join: 'round' })

    const btn = new Container()
    btn.addChild(bg, g)
    btn.eventMode = 'static'
    btn.cursor    = 'pointer'
    btn.hitArea   = new Rectangle(x - BTN_R - 8, ARROW_Y - BTN_R - 8, (BTN_R + 8) * 2, (BTN_R + 8) * 2)
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

  private buildCloseButton(): Container {
    const x = CANVAS_WIDTH / 2
    const y = CLOSE_Y
    const arm = 11

    const bg = new Graphics()
    bg.circle(x, y, BTN_R)
    bg.fill({ color: BTN_BG_CLR, alpha: BTN_BG_A })

    const g = new Graphics()
    g.moveTo(x - arm, y - arm).lineTo(x + arm, y + arm)
    g.moveTo(x + arm, y - arm).lineTo(x - arm, y + arm)
    g.stroke({ color: BTN_ICN, width: BTN_STR, alpha: BTN_ICN_A, cap: 'round' })

    const btn = new Container()
    btn.addChild(bg, g)
    btn.eventMode = 'static'
    btn.cursor    = 'pointer'
    btn.hitArea   = new Rectangle(x - BTN_R - 8, y - BTN_R - 8, (BTN_R + 8) * 2, (BTN_R + 8) * 2)
    btn.on('pointerdown', (e) => { e.stopPropagation(); this.onClose() })
    btn.on('pointerup',   (e) => e.stopPropagation())

    return btn
  }
}
