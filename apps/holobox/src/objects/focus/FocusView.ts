import { Container, Graphics, Rectangle, Sprite, Text, Assets, FillGradient } from 'pixi.js'
import type { Texture } from 'pixi.js'
import { gsap } from 'gsap'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/config/defaults'
import type { PlayerData } from '@/config/types'

const FONT_STACK = '"Helvetica Neue", Helvetica, Arial, sans-serif'
const GOLD       = 0xd4af37

// ── Layout constants ──────────────────────────────────────────────────────────
const PANEL_W      = 880
const PANEL_H      = 940
const PANEL_X      = (CANVAS_WIDTH - PANEL_W) / 2   // 100
const PANEL_Y      = 70
const PANEL_RADIUS = 24

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
  // visual holds purely decorative elements (backdrop, panel bg, photo, text).
  // root stays at alpha=1 always so interactive controls are hittable immediately.
  private readonly visual: Container
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
    // root is always alpha=1 — interactive controls are hittable from the first frame.
    // Only this.visual fades in/out for the visual transition.

    // ── Visual layer — all decorative elements; fades in/out ─────────────────
    this.visual = new Container()
    this.visual.alpha = 0
    this.visual.eventMode = 'none'

    // Backdrop — slightly deeper to make photo pop
    const backdropShape = new Graphics()
    backdropShape.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    backdropShape.fill({ color: 0x000205, alpha: 0.65 })
    this.visual.addChild(backdropShape)

    // Panel — multi-layer crystal glass effect
    const panelVisual = new Container()
    panelVisual.x = PANEL_X
    panelVisual.y = PANEL_Y

    // Base dark fill — very slightly blue-black
    const panelBg = new Graphics()
    panelBg.roundRect(0, 0, PANEL_W, PANEL_H, PANEL_RADIUS)
    panelBg.fill({ color: 0x02060e, alpha: 0.68 })

    // Top-to-bottom inner gradient — lighter at top, adds glass depth
    const innerGrad = new FillGradient({
      type: 'linear', start: { x: 0, y: 0 }, end: { x: 0, y: 1 }, textureSpace: 'local',
    })
    innerGrad.addColorStop(0,    'rgba(255,255,255,0.06)')
    innerGrad.addColorStop(0.25, 'rgba(255,255,255,0.01)')
    innerGrad.addColorStop(1,    'rgba(255,255,255,0)')
    const panelSheen = new Graphics()
    panelSheen.roundRect(0, 0, PANEL_W, PANEL_H, PANEL_RADIUS)
    panelSheen.fill({ fill: innerGrad })

    // Top edge highlight — bright thin line
    const edgeHighlight = new Graphics()
    edgeHighlight.roundRect(1, 1, PANEL_W - 2, 3, PANEL_RADIUS)
    edgeHighlight.fill({ color: 0xffffff, alpha: 0.22 })

    // Bottom gold accent line
    const bottomAccent = new Graphics()
    bottomAccent.rect(40, PANEL_H - 1, PANEL_W - 80, 1)
    bottomAccent.fill({ color: GOLD, alpha: 0.20 })

    // Outer border
    const panelBorder = new Graphics()
    panelBorder.roundRect(0, 0, PANEL_W, PANEL_H, PANEL_RADIUS)
    panelBorder.stroke({ color: 0xffffff, width: 1, alpha: 0.14 })

    panelVisual.addChild(panelBg, panelSheen, edgeHighlight, bottomAccent, panelBorder)
    this.visual.addChild(panelVisual)

    // ── Photo container (inside visual — fades with scene) ────────────────────
    this.photoContainer = new Container()
    this.photoContainer.x = PHOTO_CX
    this.photoContainer.y = PHOTO_CY
    this.photoContainer.eventMode = 'none'
    this.visual.addChild(this.photoContainer)

    // ── Player text (inside visual — fades with scene) ────────────────────────
    this.nameTxt = new Text({
      text: '',
      style: { fontFamily: FONT_STACK, fontSize: 24, fontWeight: '300', fill: 0xffffff, letterSpacing: 7 },
    })
    this.nameTxt.anchor.set(0.5)
    this.nameTxt.x = CANVAS_WIDTH / 2
    this.nameTxt.y = NAME_Y
    this.nameTxt.eventMode = 'none'

    this.detailTxt = new Text({
      text: '',
      style: { fontFamily: FONT_STACK, fontSize: 15, fontWeight: '400', fill: GOLD, letterSpacing: 3 },
    })
    this.detailTxt.anchor.set(0.5)
    this.detailTxt.x = CANVAS_WIDTH / 2
    this.detailTxt.y = DETAIL_Y
    this.detailTxt.alpha = 0.85
    this.detailTxt.eventMode = 'none'

    this.visual.addChild(this.nameTxt, this.detailTxt)

    // ── Backdrop click area — full canvas, at root so always hittable ─────────
    const backdropClickArea = new Container()
    backdropClickArea.eventMode = 'static'
    backdropClickArea.cursor = 'default'
    backdropClickArea.hitArea = new Rectangle(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    backdropClickArea.on('pointerdown', () => this.onClose())

    // ── Panel interaction blocker — stops taps on panel from reaching backdrop ─
    // Layered above backdropClickArea so panel taps never trigger onClose.
    const panelBlocker = new Container()
    panelBlocker.x = PANEL_X
    panelBlocker.y = PANEL_Y
    panelBlocker.eventMode = 'static'
    panelBlocker.hitArea = new Rectangle(0, 0, PANEL_W, PANEL_H)
    panelBlocker.on('pointerdown', (e) => e.stopPropagation())

    // ── VIEW ALL button — at root so hittable from the very first frame ───────
    const galleryBtn = this.buildPillButton('VIEW ALL', CANVAS_WIDTH / 2, VIEW_ALL_Y, 220, 52, () => this.onGallery())

    // ── Navigation arrows ─────────────────────────────────────────────────────
    const prevBtn = this.buildArrow('left',  ARROW_L_X, ARROW_Y, () => this.navigate(-1))
    const nextBtn = this.buildArrow('right', ARROW_R_X, ARROW_Y, () => this.navigate(1))

    // ── Close button ──────────────────────────────────────────────────────────
    const closeBtn = this.buildCloseButton(CLOSE_X, CLOSE_Y)

    // Draw order: visual (fading bg) → backdrop hit area → panel blocker →
    // interactive controls above. frontmost child = last added = highest priority for events.
    this.root.addChild(
      this.visual,
      backdropClickArea,
      panelBlocker,
      galleryBtn,
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
    this.visual.alpha = 0
    this.visual.y = 20
    this.visual.scale.set(0.94)
    gsap.killTweensOf(this.visual)
    gsap.killTweensOf(this.visual.scale)
    gsap.to(this.visual, { alpha: 1, y: 0, duration: 0.45, ease: 'power3.out', overwrite: true })
    gsap.to(this.visual.scale, { x: 1, y: 1, duration: 0.45, ease: 'power3.out', overwrite: true })
  }

  hide(): void {
    // Disable all interaction immediately — prevents double-tap from triggering
    // a second transition while the fade-out animation is in progress.
    this.root.interactiveChildren = false

    gsap.killTweensOf(this.visual)
    gsap.killTweensOf(this.visual.scale)
    gsap.to(this.visual, {
      alpha: 0, y: 12,
      duration: 0.28, ease: 'power2.in', overwrite: true,
      onComplete: () => {
        this.visual.scale.set(1)
        this.visual.y = 0
        this.root.parent?.removeChild(this.root)
        this.root.interactiveChildren = true
      },
    })
    gsap.to(this.visual.scale, { x: 0.97, y: 0.97, duration: 0.28, ease: 'power2.in', overwrite: true })
  }

  destroy(): void {
    gsap.killTweensOf(this.visual)
    gsap.killTweensOf(this.visual.scale)
    gsap.killTweensOf(this.photoContainer)
    gsap.killTweensOf(this.photoContainer.scale)
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
        this.photoContainer.scale.set(0.95)
        gsap.to(this.photoContainer, { alpha: 1, duration: 0.3, ease: 'power2.out', overwrite: true })
        gsap.to(this.photoContainer.scale, { x: 1, y: 1, duration: 0.4, ease: 'back.out(1.2)', overwrite: true })
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
    bg.fill({ color: 0x000000, alpha: 0.55 })
    bg.roundRect(-width / 2, -height / 2, width, height, height / 2)
    bg.stroke({ color: 0xffffff, width: 1, alpha: 0.35 })

    const txt = new Text({
      text: label,
      style: { fontFamily: FONT_STACK, fontSize: 13, fontWeight: '400', fill: 0xffffff, letterSpacing: 4 },
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
