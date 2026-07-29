import { Container, Graphics } from 'pixi.js'
import { gsap } from 'gsap'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/config/defaults'

const PANEL_W = 620
const PANEL_H = 800
const PANEL_RADIUS = 20
const CLOSE_R = 26

export class GalleryModule {
  private readonly root: Container
  private readonly overlay: Graphics
  private readonly panel: Container
  private isOpen = false
  private timeoutHandle: ReturnType<typeof setTimeout> | null = null

  constructor(
    private readonly layer: Container,
    private readonly timeoutMs: number,
    private readonly onCloseRequest: () => void,
  ) {
    this.root = new Container()
    this.root.label = 'gallery'

    this.overlay = this.buildOverlay()
    this.panel = this.buildPanel()

    this.root.addChild(this.overlay, this.panel)
    layer.addChild(this.root)

    this.root.alpha = 0
    this.root.visible = false
  }

  open(): void {
    if (this.isOpen) return
    this.isOpen = true

    this.root.visible = true
    this.panel.scale.set(0.88)

    gsap.to(this.root, { alpha: 1, duration: 0.35, ease: 'power2.out', overwrite: true })
    gsap.to(this.panel.scale, { x: 1, y: 1, duration: 0.45, ease: 'back.out(1.3)', overwrite: true })

    this.startTimeout()
  }

  close(): void {
    if (!this.isOpen) return
    this.isOpen = false
    this.clearTimeout()

    gsap.to(this.panel.scale, { x: 0.92, y: 0.92, duration: 0.28, ease: 'power2.in', overwrite: true })
    gsap.to(this.root, {
      alpha: 0,
      duration: 0.32,
      ease: 'power2.in',
      overwrite: true,
      onComplete: () => { this.root.visible = false },
    })
  }

  destroy(): void {
    this.clearTimeout()
    gsap.killTweensOf(this.root)
    gsap.killTweensOf(this.panel.scale)
    this.layer.removeChild(this.root)
    this.root.destroy({ children: true })
  }

  private buildOverlay(): Graphics {
    const overlay = new Graphics()
    overlay.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    overlay.fill({ color: 0x000000, alpha: 0.58 })
    overlay.eventMode = 'static'
    overlay.cursor = 'default'
    overlay.on('pointerdown', () => {
      this.clearTimeout()
      this.onCloseRequest()
    })
    return overlay
  }

  private buildPanel(): Container {
    const panel = new Container()
    panel.x = (CANVAS_WIDTH - PANEL_W) / 2
    panel.y = (CANVAS_HEIGHT - PANEL_H) / 2

    // Background card
    const card = new Graphics()
    card.roundRect(0, 0, PANEL_W, PANEL_H, PANEL_RADIUS)
    card.fill({ color: 0x0a0a18, alpha: 0.96 })
    card.stroke({ color: 0xffffff, width: 1.5, alpha: 0.2 })

    // Inner content placeholder — mimics an orbit item, large
    const placeholder = new Graphics()
    const pw = PANEL_W - 80
    const ph = Math.floor(pw * (180 / 140))  // same aspect as PhotoItem
    const px = 40
    const py = (PANEL_H - ph) / 2 - 40
    placeholder.roundRect(px, py, pw, ph, 12)
    placeholder.fill({ color: 0x0d0d1a, alpha: 0.9 })
    placeholder.stroke({ color: 0xffffff, width: 1.5, alpha: 0.25 })

    // Close button
    const closeBtn = this.buildCloseButton()
    closeBtn.x = PANEL_W - CLOSE_R - 16
    closeBtn.y = CLOSE_R + 16

    // Intercept taps on the panel so they don't bubble to overlay
    card.eventMode = 'static'
    card.on('pointerdown', (e) => e.stopPropagation())

    closeBtn.eventMode = 'static'
    closeBtn.cursor = 'pointer'
    closeBtn.on('pointerdown', (e) => {
      e.stopPropagation()
      this.clearTimeout()
      this.onCloseRequest()
    })

    panel.addChild(card, placeholder, closeBtn)
    return panel
  }

  private buildCloseButton(): Container {
    const btn = new Container()

    const circle = new Graphics()
    circle.circle(0, 0, CLOSE_R)
    circle.fill({ color: 0xffffff, alpha: 0.08 })
    circle.stroke({ color: 0xffffff, width: 1.5, alpha: 0.35 })

    const cross = new Graphics()
    const arm = CLOSE_R * 0.38
    cross.moveTo(-arm, -arm).lineTo(arm, arm)
    cross.moveTo(arm, -arm).lineTo(-arm, arm)
    cross.stroke({ color: 0xffffff, width: 2, alpha: 0.7 })

    btn.addChild(circle, cross)
    return btn
  }

  private startTimeout(): void {
    this.clearTimeout()
    this.timeoutHandle = setTimeout(() => this.onCloseRequest(), this.timeoutMs)
  }

  private clearTimeout(): void {
    if (this.timeoutHandle !== null) {
      clearTimeout(this.timeoutHandle)
      this.timeoutHandle = null
    }
  }
}
