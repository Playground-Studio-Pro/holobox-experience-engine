import { Container, Graphics, Rectangle, Text, FillGradient } from 'pixi.js'
import { gsap } from 'gsap'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/config/defaults'
import type { PlayerData } from '@/config/types'

const FONT = '"Helvetica Neue", Helvetica, Arial, sans-serif'
const GOLD = 0xd4af37

// Glass panel dimensions — sits below the focus photo
const PANEL_W = 860
const PANEL_H = 290
const PANEL_X = (CANVAS_WIDTH - PANEL_W) / 2  // 110
const PANEL_Y = 1185
const PANEL_R = 20

// Close button — top-right of the panel area
const CLOSE_X = PANEL_X + PANEL_W - 30
const CLOSE_Y = PANEL_Y + 30

// Pagination dots — bottom center of panel
const DOTS      = 5
const DOT_R     = 4
const DOT_GAP   = 14
const DOTS_Y    = PANEL_Y + PANEL_H - 28
const DOTS_CX   = CANVAS_WIDTH / 2
const DOTS_START = DOTS_CX - ((DOTS - 1) * DOT_GAP) / 2

// Swipe — minimum horizontal movement to trigger navigation
const SWIPE_THRESHOLD = 50

/**
 * Glass metadata panel for the Focus Experience.
 *
 * - Backdrop: tap → close, horizontal swipe → navigate
 * - Nav arrows: left/right, positioned above the panel blocker
 * - Pagination dots: dynamic — call setActiveDot(playerIndex) to update
 * - updatePanel(): updates name/meta while panel is visible (no animation)
 */
export class CompositionFocusView {
  readonly root: Container
  private readonly panelVisual: Container
  private readonly nameText: Text
  private readonly metaText: Text
  private readonly dotGraphics: Graphics[] = []
  private isVisible = false

  constructor(
    private readonly onClose: () => void,
    private readonly onNavigate: (direction: 'prev' | 'next') => void,
  ) {
    this.root = new Container()
    this.root.label = 'focus:view'

    // ── Backdrop — full canvas. Tap → close, swipe → navigate ────────────────
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

    // ── Panel visual ──────────────────────────────────────────────────────────
    const panelVisual = new Container()
    panelVisual.alpha = 0

    const panelBg = new Graphics()
    panelBg.roundRect(PANEL_X, PANEL_Y, PANEL_W, PANEL_H, PANEL_R)
    panelBg.fill({ color: 0x0a1020, alpha: 0.80 })

    const sheen = new FillGradient({
      type: 'linear', start: { x: 0, y: 0 }, end: { x: 0, y: 1 }, textureSpace: 'local',
    })
    sheen.addColorStop(0,    'rgba(255,255,255,0.07)')
    sheen.addColorStop(0.30, 'rgba(255,255,255,0.01)')
    sheen.addColorStop(1,    'rgba(255,255,255,0)')
    const panelSheen = new Graphics()
    panelSheen.roundRect(PANEL_X, PANEL_Y, PANEL_W, PANEL_H, PANEL_R)
    panelSheen.fill({ fill: sheen })

    const topEdge = new Graphics()
    topEdge.roundRect(PANEL_X + 1, PANEL_Y + 1, PANEL_W - 2, 3, PANEL_R)
    topEdge.fill({ color: 0xffffff, alpha: 0.20 })

    const bottomAccent = new Graphics()
    bottomAccent.rect(PANEL_X + 40, PANEL_Y + PANEL_H - 1, PANEL_W - 80, 1)
    bottomAccent.fill({ color: GOLD, alpha: 0.22 })

    const panelBorder = new Graphics()
    panelBorder.roundRect(PANEL_X, PANEL_Y, PANEL_W, PANEL_H, PANEL_R)
    panelBorder.stroke({ color: 0xffffff, width: 1, alpha: 0.13 })

    panelVisual.addChild(panelBg, panelSheen, topEdge, bottomAccent, panelBorder)

    // ── Player name ───────────────────────────────────────────────────────────
    const nameText = new Text({
      text: '',
      style: { fontFamily: FONT, fontSize: 36, fontWeight: '300', fill: 0xffffff, letterSpacing: 6 },
    })
    nameText.anchor.set(0.5, 0)
    nameText.x = CANVAS_WIDTH / 2
    nameText.y = PANEL_Y + 32
    nameText.eventMode = 'none'
    panelVisual.addChild(nameText)
    this.nameText = nameText

    const divider = new Graphics()
    divider.rect(PANEL_X + 60, PANEL_Y + 88, PANEL_W - 120, 1)
    divider.fill({ color: 0xffffff, alpha: 0.12 })
    panelVisual.addChild(divider)

    // ── Meta row ──────────────────────────────────────────────────────────────
    const metaText = new Text({
      text: '',
      style: { fontFamily: FONT, fontSize: 14, fontWeight: '400', fill: GOLD, letterSpacing: 3, align: 'center' },
    })
    metaText.anchor.set(0.5, 0)
    metaText.x = CANVAS_WIDTH / 2
    metaText.y = PANEL_Y + 102
    metaText.alpha = 0.85
    metaText.eventMode = 'none'
    panelVisual.addChild(metaText)
    this.metaText = metaText

    // ── Pagination dots (visual, updated via setActiveDot) ────────────────────
    for (let i = 0; i < DOTS; i++) {
      const dot = new Graphics()
      dot.eventMode = 'none'
      this.dotGraphics.push(dot)
      panelVisual.addChild(dot)
    }
    this.setActiveDot(0)

    this.panelVisual = panelVisual

    // ── Panel blocker — stops backdrop close when tapping panel area ──────────
    const panelBlocker = new Container()
    panelBlocker.eventMode = 'static'
    panelBlocker.hitArea   = new Rectangle(PANEL_X, PANEL_Y, PANEL_W, PANEL_H)
    panelBlocker.on('pointerdown', (e) => e.stopPropagation())
    panelBlocker.on('pointerup',   (e) => e.stopPropagation())

    // ── Nav arrows — above panelBlocker in z-order so they receive events ─────
    const leftArrow  = this.buildArrowButton('left',  PANEL_X + 40,          PANEL_Y + PANEL_H / 2 - 10)
    const rightArrow = this.buildArrowButton('right', PANEL_X + PANEL_W - 40, PANEL_Y + PANEL_H / 2 - 10)

    // ── Close button ──────────────────────────────────────────────────────────
    const closeBtn = this.buildCloseButton()

    // Draw order: backdrop → panelVisual → panelBlocker → arrows → closeBtn
    this.root.addChild(backdrop, panelVisual, panelBlocker, leftArrow, rightArrow, closeBtn)
  }

  mount(uiLayer: Container): void {
    uiLayer.addChild(this.root)
  }

  unmount(): void {
    this.root.parent?.removeChild(this.root)
  }

  /** Update name/meta text. Safe to call at any time — no animation. */
  updatePanel(player: PlayerData | null, fallbackName?: string): void {
    const name = player?.name ?? fallbackName ?? ''
    this.nameText.text = name.toUpperCase()

    const parts: string[] = []
    if (player?.country) parts.push(player.country.toUpperCase())
    if (player?.rank !== undefined) parts.push(`#${player.rank}`)
    else if (parts.length === 0 && fallbackName) parts.push('LPGA · DANA OPEN')
    this.metaText.text = parts.join('  ·  ')
  }

  /** Fade panel in. Should only be called once per focus session. */
  showPanel(player: PlayerData | null, fallbackName?: string): void {
    if (this.isVisible) return
    this.isVisible = true

    this.updatePanel(player, fallbackName)
    this.setActiveDot(0)

    gsap.killTweensOf(this.panelVisual)
    this.panelVisual.alpha = 0
    this.panelVisual.y     = 22
    gsap.to(this.panelVisual, { alpha: 1, y: 0, duration: 0.42, ease: 'expo.out', overwrite: true })
  }

  /** Update the active pagination dot. activeIndex is the current player index. */
  setActiveDot(activeIndex: number): void {
    const activePos = activeIndex % DOTS
    for (let i = 0; i < this.dotGraphics.length; i++) {
      const dot = this.dotGraphics[i]
      const isActive = i === activePos
      dot.clear()
      dot.circle(DOTS_START + i * DOT_GAP, DOTS_Y, isActive ? DOT_R + 1 : DOT_R)
      dot.fill({ color: 0xffffff, alpha: isActive ? 0.70 : 0.25 })
    }
  }

  hidePanel(onComplete?: () => void): void {
    if (!this.isVisible) { onComplete?.(); return }
    this.isVisible = false
    gsap.killTweensOf(this.panelVisual)
    gsap.to(this.panelVisual, {
      alpha: 0, y: 12,
      duration: 0.30, ease: 'power2.in', overwrite: true,
      onComplete,
    })
  }

  destroy(): void {
    gsap.killTweensOf(this.panelVisual)
    this.unmount()
    this.root.destroy({ children: true })
  }

  private buildArrowButton(dir: 'left' | 'right', x: number, y: number): Container {
    const btn = new Container()

    const g = new Graphics()
    if (dir === 'left') {
      g.moveTo(x + 10, y - 12).lineTo(x - 4, y).lineTo(x + 10, y + 12)
    } else {
      g.moveTo(x - 10, y - 12).lineTo(x + 4, y).lineTo(x - 10, y + 12)
    }
    g.stroke({ color: 0xffffff, width: 1.5, alpha: 0.55, cap: 'round', join: 'round' })

    btn.addChild(g)
    btn.eventMode = 'static'
    btn.cursor    = 'pointer'
    btn.hitArea   = new Rectangle(x - 30, y - 30, 60, 60)
    btn.on('pointerdown', (e) => { e.stopPropagation(); this.onNavigate(dir === 'left' ? 'prev' : 'next') })
    btn.on('pointerup',   (e) => e.stopPropagation())

    return btn
  }

  private buildCloseButton(): Container {
    const btn = new Container()
    btn.x = CLOSE_X
    btn.y = CLOSE_Y

    const bg = new Graphics()
    bg.circle(0, 0, 18)
    bg.fill({ color: 0x000000, alpha: 0.45 })
    bg.circle(0, 0, 18)
    bg.stroke({ color: 0xffffff, width: 1, alpha: 0.30 })

    const mark = new Graphics()
    const D = 6
    mark.moveTo(-D, -D).lineTo(D, D)
    mark.moveTo(D, -D).lineTo(-D, D)
    mark.stroke({ color: 0xffffff, width: 1.5, alpha: 0.80, cap: 'round' })

    btn.addChild(bg, mark)
    btn.eventMode = 'static'
    btn.cursor    = 'pointer'
    btn.hitArea   = new Rectangle(-28, -28, 56, 56)
    btn.on('pointerdown', (e) => { e.stopPropagation(); this.onClose() })
    return btn
  }
}
