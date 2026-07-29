import { Container, Graphics, Rectangle, Sprite, Text, Assets } from 'pixi.js'
import type { Texture } from 'pixi.js'
import { gsap } from 'gsap'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/config/defaults'
import type { PlayerData } from '@/config/types'

// ── Layout constants ──────────────────────────────────────────────────────────
const PANEL_W      = 880
const PANEL_H      = 940
const PANEL_X      = (CANVAS_WIDTH - PANEL_W) / 2   // 100
const PANEL_Y      = 70
const PANEL_RADIUS = 20

// Photo display area (within panel)
const PHOTO_MAX_W  = 800
const PHOTO_MAX_H  = 660
const PHOTO_CX     = CANVAS_WIDTH / 2               // 540
const PHOTO_CY     = PANEL_Y + 60 + PHOTO_MAX_H / 2 // ~460

// Arrows — at horizontal canvas edges, vertically centred on photo
const ARROW_Y      = PHOTO_CY
const ARROW_L_X    = 50
const ARROW_R_X    = CANVAS_WIDTH - 50

// Controls below the photo, inside the panel
const VIEW_ALL_Y   = PANEL_Y + PANEL_H - 130         // ~880
const NAME_Y       = PANEL_Y + PANEL_H - 85          // ~925
const DETAIL_Y     = PANEL_Y + PANEL_H - 42          // ~968

// Close button — top-right corner, outside the panel
const CLOSE_X      = CANVAS_WIDTH - 60
const CLOSE_Y      = PANEL_Y + 30

export class FocusView {
  private readonly root: Container
  private readonly panel: Container
  private readonly photoContainer: Container
  private photoSprite: Sprite | null = null
  private readonly nameTxt: Text
  private readonly detailTxt: Text
  private currentIndex = 0

  constructor(
    private readonly players: PlayerData[],
    private readonly onClose: () => void,
    private readonly onGallery: () => void,
  ) {
    this.root = new Container()
    this.root.label = 'focus:root'
    this.root.alpha = 0

    // ── Backdrop — semi-transparent, orbit and centerpiece visible behind ──────
    // Keep alpha low so the scene breathes underneath.
    const backdropShape = new Graphics()
    backdropShape.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    backdropShape.fill({ color: 0x000205, alpha: 0.52 })
    const backdrop = new Container()
    backdrop.addChild(backdropShape)
    backdrop.eventMode = 'static'
    backdrop.cursor = 'default'
    backdrop.on('pointerdown', () => this.onClose())

    // ── Glass panel ────────────────────────────────────────────────────────────
    // Semi-transparent dark panel — stops ALL propagation so touching the panel
    // or any of its contents never reaches the backdrop's close handler.
    this.panel = new Container()
    this.panel.x = PANEL_X
    this.panel.y = PANEL_Y
    this.panel.eventMode = 'static'
    this.panel.hitArea = new Rectangle(0, 0, PANEL_W, PANEL_H)
    this.panel.on('pointerdown', (e) => e.stopPropagation())

    // Panel background — dark glass (navy, semi-transparent)
    const panelBg = new Graphics()
    panelBg.roundRect(0, 0, PANEL_W, PANEL_H, PANEL_RADIUS)
    panelBg.fill({ color: 0x03080f, alpha: 0.78 })

    // Subtle top-edge highlight — simulates light catching glass surface
    const edgeHighlight = new Graphics()
    edgeHighlight.roundRect(1, 1, PANEL_W - 2, 2, PANEL_RADIUS)
    edgeHighlight.fill({ color: 0xffffff, alpha: 0.18 })

    // Panel border — barely visible frame
    const panelBorder = new Graphics()
    panelBorder.roundRect(0, 0, PANEL_W, PANEL_H, PANEL_RADIUS)
    panelBorder.stroke({ color: 0xffffff, width: 1, alpha: 0.12 })

    this.panel.addChild(panelBg, edgeHighlight, panelBorder)

    // ── Photo container (local coords relative to canvas, not panel) ──────────
    this.photoContainer = new Container()
    this.photoContainer.x = PHOTO_CX
    this.photoContainer.y = PHOTO_CY
    this.photoContainer.eventMode = 'static'
    this.photoContainer.hitArea = new Rectangle(-PHOTO_MAX_W / 2, -PHOTO_MAX_H / 2, PHOTO_MAX_W, PHOTO_MAX_H)
    this.photoContainer.on('pointerdown', (e) => e.stopPropagation())

    // ── VIEW ALL button ───────────────────────────────────────────────────────
    const galleryBtn = this.buildPillButton('VIEW ALL', CANVAS_WIDTH / 2, VIEW_ALL_Y, 220, 52, () => this.onGallery())

    // ── Player text ───────────────────────────────────────────────────────────
    this.nameTxt = new Text({
      text: '',
      style: { fontFamily: 'monospace', fontSize: 26, fontWeight: 'bold', fill: 0xffffff, letterSpacing: 1.5 },
    })
    this.nameTxt.anchor.set(0.5)
    this.nameTxt.x = CANVAS_WIDTH / 2
    this.nameTxt.y = NAME_Y
    this.nameTxt.eventMode = 'none'

    this.detailTxt = new Text({
      text: '',
      style: { fontFamily: 'monospace', fontSize: 20, fill: 0x9999bb, letterSpacing: 1 },
    })
    this.detailTxt.anchor.set(0.5)
    this.detailTxt.x = CANVAS_WIDTH / 2
    this.detailTxt.y = DETAIL_Y
    this.detailTxt.eventMode = 'none'

    // ── Navigation arrows — sit outside panel, stop own propagation ──────────
    const prevBtn = this.buildArrow('left',  ARROW_L_X, ARROW_Y, () => this.navigate(-1))
    const nextBtn = this.buildArrow('right', ARROW_R_X, ARROW_Y, () => this.navigate(1))

    // ── Close button — top-right of canvas, outside panel ────────────────────
    const closeBtn = this.buildCloseButton(CLOSE_X, CLOSE_Y)

    // Draw order matters: backdrop at bottom, then panel, then photo + text
    // (photo/text are children of root, positioned in canvas coords — they render above panel)
    this.root.addChild(
      backdrop,
      this.panel,
      this.photoContainer,
      galleryBtn,
      this.nameTxt,
      this.detailTxt,
      prevBtn,
      nextBtn,
      closeBtn,
    )
  }

  show(index: number, layer: Container, fromFocused = false): void {
    this.currentIndex = this.clampIndex(index)

    if (!this.root.parent) {
      layer.addChild(this.root)
    }

    if (fromFocused) {
      this.crossfadeTo(this.currentIndex)
      return
    }

    this.updateContent(this.currentIndex)
    gsap.killTweensOf(this.root)
    gsap.to(this.root, { alpha: 1, duration: 0.35, ease: 'power2.out', overwrite: true })
  }

  hide(): void {
    gsap.killTweensOf(this.root)
    gsap.to(this.root, {
      alpha: 0,
      duration: 0.28,
      ease: 'power2.in',
      overwrite: true,
      onComplete: () => this.root.parent?.removeChild(this.root),
    })
  }

  destroy(): void {
    gsap.killTweensOf(this.root)
    gsap.killTweensOf(this.photoContainer)
    gsap.killTweensOf(this.nameTxt)
    gsap.killTweensOf(this.detailTxt)
    this.root.parent?.removeChild(this.root)
    this.root.destroy({ children: true })
  }

  private navigate(dir: -1 | 1): void {
    if (this.players.length === 0) return
    const next = (this.currentIndex + dir + this.players.length) % this.players.length
    this.crossfadeTo(next)
  }

  private crossfadeTo(index: number): void {
    gsap.to(this.photoContainer, {
      alpha: 0, duration: 0.2, ease: 'power2.in', overwrite: true,
      onComplete: () => {
        this.currentIndex = index
        this.setPhoto(index)
        gsap.to(this.photoContainer, { alpha: 1, duration: 0.25, ease: 'power2.out', overwrite: true })
      },
    })
    gsap.to([this.nameTxt, this.detailTxt], {
      alpha: 0, duration: 0.2, ease: 'power2.in', overwrite: true,
      onComplete: () => {
        this.setPlayerText(index)
        gsap.to([this.nameTxt, this.detailTxt], { alpha: 1, duration: 0.25, ease: 'power2.out', overwrite: true })
      },
    })
  }

  private updateContent(index: number): void {
    this.setPlayerText(index)
    this.setPhoto(index)
  }

  private setPlayerText(index: number): void {
    const player = this.players[index]
    if (!player) { this.nameTxt.text = ''; this.detailTxt.text = ''; return }

    this.nameTxt.text = player.name?.toUpperCase() ?? ''

    const parts: string[] = []
    if (player.country) parts.push(player.country)
    if (player.score) parts.push(player.score)
    else if (player.rank !== undefined) parts.push(`#${player.rank}`)
    this.detailTxt.text = parts.join('  ·  ')
  }

  private setPhoto(index: number): void {
    const player = this.players[index]
    if (!player?.photoUrl) {
      if (this.photoSprite) this.photoSprite.visible = false
      return
    }

    const tex = Assets.get<Texture>(player.photoUrl)
    if (!tex) {
      if (this.photoSprite) this.photoSprite.visible = false
      return
    }

    // Contain-scale: fit within PHOTO_MAX_W × PHOTO_MAX_H, preserve aspect ratio
    const containScale = Math.min(PHOTO_MAX_W / tex.width, PHOTO_MAX_H / tex.height)

    if (!this.photoSprite) {
      this.photoSprite = new Sprite(tex)
      this.photoSprite.anchor.set(0.5)
      this.photoContainer.addChild(this.photoSprite)
    } else {
      this.photoSprite.texture = tex
    }

    this.photoSprite.scale.set(containScale)
    this.photoSprite.visible = true
  }

  private buildPillButton(
    label: string, x: number, y: number, width: number, height: number, onTap: () => void,
  ): Container {
    const btn = new Container()
    btn.x = x
    btn.y = y

    const bg = new Graphics()
    bg.roundRect(-width / 2, -height / 2, width, height, height / 2)
    bg.fill({ color: 0x000000, alpha: 0.60 })
    bg.roundRect(-width / 2, -height / 2, width, height, height / 2)
    bg.stroke({ color: 0xffffff, width: 1.5, alpha: 0.40 })

    const txt = new Text({
      text: label,
      style: { fontFamily: 'monospace', fontSize: 15, fontWeight: 'bold', fill: 0xffffff, letterSpacing: 3 },
    })
    txt.anchor.set(0.5)

    btn.addChild(bg, txt)
    btn.eventMode = 'static'
    btn.cursor = 'pointer'
    btn.hitArea = new Rectangle(-width / 2 - 24, -height / 2 - 24, width + 48, height + 48)
    btn.on('pointerdown', (e) => { e.stopPropagation(); onTap() })
    return btn
  }

  private buildArrow(dir: 'left' | 'right', x: number, y: number, onTap: () => void): Container {
    const btn = new Container()
    btn.x = x
    btn.y = y

    // Subtle circle background for visibility
    const circleBg = new Graphics()
    circleBg.circle(0, 0, 32)
    circleBg.fill({ color: 0x000000, alpha: 0.45 })
    circleBg.circle(0, 0, 32)
    circleBg.stroke({ color: 0xffffff, width: 1, alpha: 0.25 })

    const chevron = new Graphics()
    if (dir === 'left') {
      chevron.moveTo(8, -16).lineTo(-8, 0).lineTo(8, 16)
    } else {
      chevron.moveTo(-8, -16).lineTo(8, 0).lineTo(-8, 16)
    }
    chevron.stroke({ color: 0xffffff, width: 2.5, alpha: 0.90, cap: 'round', join: 'round' })

    btn.addChild(circleBg, chevron)
    btn.eventMode = 'static'
    btn.cursor = 'pointer'
    btn.hitArea = new Rectangle(-40, -48, 80, 96)
    btn.on('pointerdown', (e) => { e.stopPropagation(); onTap() })
    return btn
  }

  private buildCloseButton(x: number, y: number): Container {
    const btn = new Container()
    btn.x = x
    btn.y = y

    const bg = new Graphics()
    bg.circle(0, 0, 26)
    bg.fill({ color: 0x000000, alpha: 0.55 })
    bg.circle(0, 0, 26)
    bg.stroke({ color: 0xffffff, width: 1.5, alpha: 0.35 })

    const mark = new Graphics()
    const D = 9
    mark.moveTo(-D, -D).lineTo(D, D)
    mark.moveTo(D, -D).lineTo(-D, D)
    mark.stroke({ color: 0xffffff, width: 2, alpha: 0.90, cap: 'round' })

    btn.addChild(bg, mark)
    btn.eventMode = 'static'
    btn.cursor = 'pointer'
    btn.hitArea = new Rectangle(-36, -36, 72, 72)
    btn.on('pointerdown', (e) => { e.stopPropagation(); this.onClose() })
    return btn
  }

  private clampIndex(index: number): number {
    if (this.players.length === 0) return 0
    return Math.max(0, Math.min(index, this.players.length - 1))
  }
}
