import { Container, Graphics, Rectangle, Sprite, Text, Assets } from 'pixi.js'
import type { Texture, FederatedPointerEvent, FederatedWheelEvent } from 'pixi.js'
import { gsap } from 'gsap'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/config/defaults'
import type { PlayerData } from '@/config/types'

const FONT_STACK = '"Helvetica Neue", Helvetica, Arial, sans-serif'
const GOLD       = 0xd4af37

// ── Layout ────────────────────────────────────────────────────────────────────
const HEADER_H     = 128
const COLS         = 3
const THUMB_SIZE   = 240
const THUMB_RADIUS = 14
// Three equal columns with symmetric gutters
const GUTTER       = (CANVAS_WIDTH - COLS * THUMB_SIZE) / (COLS + 1)  // ~90px
const COL_CENTERS  = [
  GUTTER + THUMB_SIZE / 2,                              // 210
  GUTTER + THUMB_SIZE + GUTTER + THUMB_SIZE / 2,        // 540
  GUTTER + THUMB_SIZE + GUTTER + THUMB_SIZE + GUTTER + THUMB_SIZE / 2,  // 870
]
const ROW_GAP      = 80
const ROW_SPACING  = THUMB_SIZE + ROW_GAP               // 320
const GRID_PAD_TOP = 50
const GRID_PAD_BOT = 80

export class GridGallery {
  private readonly root: Container
  private scrollContent!: Container
  private scrollY    = 0
  private maxScroll  = 0
  private isDragging = false
  private dragStartGlobalY  = 0
  private dragStartScrollY  = 0

  constructor(
    private readonly players: PlayerData[],
    private readonly onSelectIndex: (index: number) => void,
    private readonly onClose: () => void,
  ) {
    this.root = new Container()
    this.root.label = 'gallery:grid'
    this.root.alpha = 0

    this.build()
  }

  open(layer: Container): void {
    // Reset scroll each time gallery is opened
    this.scrollY = 0
    this.scrollContent.y = HEADER_H

    this.root.alpha = 0
    this.root.y = 70
    if (!this.root.parent) layer.addChild(this.root)

    gsap.killTweensOf(this.root)
    gsap.to(this.root, { alpha: 1, y: 0, duration: 0.42, ease: 'power3.out', overwrite: true })
  }

  close(): void {
    gsap.killTweensOf(this.root)
    gsap.to(this.root, {
      alpha: 0, y: 40,
      duration: 0.25, ease: 'power2.in', overwrite: true,
      onComplete: () => {
        this.root.y = 0
        this.root.parent?.removeChild(this.root)
      },
    })
  }

  destroy(): void {
    gsap.killTweensOf(this.root)
    this.root.parent?.removeChild(this.root)
    this.root.destroy({ children: true })
  }

  private build(): void {
    // ── Background — full canvas, absorbs all taps that miss the grid ─────────
    // Root itself captures events; only the explicit close button calls onClose.
    const bg = new Graphics()
    bg.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    bg.fill({ color: 0x030609, alpha: 0.94 })
    this.root.addChild(bg)

    // ── Scrollable content area ───────────────────────────────────────────────
    const numRows     = Math.ceil(this.players.length / COLS)
    const contentH    = GRID_PAD_TOP + numRows * THUMB_SIZE + (numRows - 1) * ROW_GAP + GRID_PAD_BOT
    const viewportH   = CANVAS_HEIGHT - HEADER_H
    this.maxScroll    = Math.max(0, contentH - viewportH)

    // Clipping mask — shows only the region below the fixed header
    const clipMask = new Graphics()
    clipMask.rect(0, HEADER_H, CANVAS_WIDTH, viewportH)
    clipMask.fill({ color: 0xffffff, alpha: 1 })
    // Mask must be a child of the scene to get correct coordinates
    this.root.addChild(clipMask)

    this.scrollContent = new Container()
    this.scrollContent.y = HEADER_H   // initial position: content starts right below header

    for (let i = 0; i < this.players.length; i++) {
      const col = i % COLS
      const row = Math.floor(i / COLS)
      const x   = COL_CENTERS[col]
      const y   = GRID_PAD_TOP + THUMB_SIZE / 2 + row * ROW_SPACING
      const thumb = this.buildThumbnail(this.players[i], i, x, y)
      this.scrollContent.addChild(thumb)
    }

    const scrollViewport = new Container()
    scrollViewport.addChild(this.scrollContent)
    scrollViewport.mask = clipMask
    this.root.addChild(scrollViewport)

    // ── Fixed header — rendered last so it always appears on top ──────────────
    this.root.addChild(this.buildHeader())

    // ── Pointer drag — capture on root so dragging over thumbs still works ────
    this.root.eventMode = 'static'
    this.root.hitArea   = new Rectangle(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    this.root.on('pointerdown', (e: FederatedPointerEvent) => {
      this.isDragging        = true
      this.dragStartGlobalY  = e.globalY
      this.dragStartScrollY  = this.scrollY
    })
    this.root.on('pointermove', (e: FederatedPointerEvent) => {
      if (!this.isDragging) return
      const dy = this.dragStartGlobalY - e.globalY
      this.applyScroll(this.dragStartScrollY + dy)
    })
    this.root.on('pointerup',        () => { this.isDragging = false })
    this.root.on('pointerupoutside', () => { this.isDragging = false })

    // ── Mouse-wheel scroll ────────────────────────────────────────────────────
    this.root.on('wheel', (e: FederatedWheelEvent) => {
      this.applyScroll(this.scrollY + e.deltaY * 0.8)
    })
  }

  private applyScroll(targetY: number): void {
    this.scrollY = Math.max(0, Math.min(this.maxScroll, targetY))
    this.scrollContent.y = HEADER_H - this.scrollY
  }

  private buildHeader(): Container {
    const header = new Container()

    // Header background — solid matching gallery bg
    const headerBg = new Graphics()
    headerBg.rect(0, 0, CANVAS_WIDTH, HEADER_H)
    headerBg.fill({ color: 0x030609, alpha: 1 })

    // Gold accent divider at header bottom
    const divider = new Graphics()
    divider.rect(64, HEADER_H - 1, CANVAS_WIDTH - 128, 1)
    divider.fill({ color: GOLD, alpha: 0.25 })

    // Gallery label — small, above main title
    const label = new Text({
      text: 'COLLECTION',
      style: { fontFamily: FONT_STACK, fontSize: 11, fontWeight: '400', fill: GOLD, letterSpacing: 5 },
    })
    label.anchor.set(0.5, 1)
    label.x = CANVAS_WIDTH / 2
    label.y = HEADER_H / 2 - 6
    label.alpha = 0.80
    label.eventMode = 'none'

    // Title — centered, light weight
    const title = new Text({
      text: 'ALL PHOTOS',
      style: { fontFamily: FONT_STACK, fontSize: 22, fontWeight: '300', fill: 0xffffff, letterSpacing: 8 },
    })
    title.anchor.set(0.5, 0)
    title.x = CANVAS_WIDTH / 2
    title.y = HEADER_H / 2 + 2
    title.eventMode = 'none'

    // Photo count — subtle, top-left
    const count = new Text({
      text: `${this.players.length} PHOTOS`,
      style: { fontFamily: FONT_STACK, fontSize: 11, fontWeight: '300', fill: 0xffffff, letterSpacing: 3 },
    })
    count.anchor.set(0, 0.5)
    count.x = 64
    count.y = HEADER_H / 2
    count.alpha = 0.35
    count.eventMode = 'none'

    // Close button — top-right with safe margin
    const closeBtn = this.buildCloseButton(CANVAS_WIDTH - 64, HEADER_H / 2)

    header.addChild(headerBg, divider, label, title, count, closeBtn)
    return header
  }

  private buildThumbnail(player: PlayerData, index: number, x: number, y: number): Container {
    const thumb = new Container()
    thumb.x = x
    thumb.y = y

    const hw = THUMB_SIZE / 2

    // Placeholder background
    const bg = new Graphics()
    bg.roundRect(-hw, -hw, THUMB_SIZE, THUMB_SIZE, THUMB_RADIUS)
    bg.fill({ color: 0x0d1020, alpha: 1 })

    // Rounded-rect mask for photo
    const mask = new Graphics()
    mask.roundRect(-hw, -hw, THUMB_SIZE, THUMB_SIZE, THUMB_RADIUS)
    mask.fill({ color: 0xffffff, alpha: 1 })

    let photoSprite: Sprite | null = null
    if (player.photoUrl) {
      const tex = Assets.get<Texture>(player.photoUrl)
      if (tex) {
        const coverScale = Math.max(THUMB_SIZE / tex.width, THUMB_SIZE / tex.height)
        photoSprite = new Sprite(tex)
        photoSprite.anchor.set(0.5)
        photoSprite.scale.set(coverScale)
        photoSprite.mask = mask
      }
    }

    // Name label at the bottom of the thumbnail (hidden when name is empty)
    const hasName = !!player.name
    const NAME_H  = hasName ? 48 : 0
    let nameBg: Graphics | null = null
    let nameTxt: Text | null = null
    if (hasName) {
      nameBg = new Graphics()
      nameBg.rect(-hw, hw - NAME_H, THUMB_SIZE, NAME_H)
      nameBg.fill({ color: 0x000000, alpha: 0.68 })

      nameTxt = new Text({
        text: player.name!.toUpperCase(),
        style: { fontFamily: 'monospace', fontSize: 12, fontWeight: 'bold', fill: 0xffffff, letterSpacing: 0.5 },
      })
      nameTxt.anchor.set(0.5, 1)
      nameTxt.x = 0
      nameTxt.y = hw - 10
    }

    // Border
    const border = new Graphics()
    border.roundRect(-hw, -hw, THUMB_SIZE, THUMB_SIZE, THUMB_RADIUS)
    border.stroke({ color: 0xffffff, width: 1, alpha: 0.15 })

    thumb.addChild(bg)
    if (photoSprite) thumb.addChild(mask, photoSprite)
    if (nameBg)      thumb.addChild(nameBg)
    if (nameTxt)     thumb.addChild(nameTxt)
    thumb.addChild(border)

    // ── Tap detection ─────────────────────────────────────────────────────────
    // We must NOT stopPropagation on pointerdown — the root needs it for drag tracking.
    // Instead, compare position at pointerup to decide tap vs. drag.
    let tapStartY = 0
    thumb.eventMode = 'static'
    thumb.cursor    = 'pointer'
    thumb.hitArea   = new Rectangle(-hw, -hw, THUMB_SIZE, THUMB_SIZE)
    thumb.on('pointerdown', (e: FederatedPointerEvent) => {
      tapStartY = e.globalY
      // Do NOT stopPropagation — let root track drag start
    })
    thumb.on('pointerup', (e: FederatedPointerEvent) => {
      const moved = Math.abs(e.globalY - tapStartY)
      if (moved < 12) {
        this.onSelectIndex(index)
      }
      // Let pointerup bubble to root so isDragging resets correctly.
    })

    return thumb
  }

  private buildCloseButton(x: number, y: number): Container {
    const btn = new Container()
    btn.x = x
    btn.y = y

    const SIZE = 52
    const bg = new Graphics()
    bg.circle(0, 0, SIZE / 2)
    bg.fill({ color: 0x000000, alpha: 0.50 })
    bg.circle(0, 0, SIZE / 2)
    bg.stroke({ color: 0xffffff, width: 1.5, alpha: 0.35 })

    const mark = new Graphics()
    const D = 10
    mark.moveTo(-D, -D).lineTo(D, D)
    mark.moveTo(D, -D).lineTo(-D, D)
    mark.stroke({ color: 0xffffff, width: 2.5, alpha: 0.90, cap: 'round' })

    btn.addChild(bg, mark)
    btn.eventMode = 'static'
    btn.cursor    = 'pointer'
    btn.hitArea   = new Rectangle(-36, -36, 72, 72)
    btn.on('pointerdown', (e: FederatedPointerEvent) => {
      e.stopPropagation()
      this.onClose()
    })
    return btn
  }
}
