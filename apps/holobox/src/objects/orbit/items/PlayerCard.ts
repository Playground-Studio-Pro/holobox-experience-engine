import { Container, Graphics, Sprite, Text, BlurFilter } from 'pixi.js'
import type { Texture } from 'pixi.js'
import { gsap } from 'gsap'
import { OrbitItem } from '../OrbitItem'
import type { OrbitItemType } from '../types'
import type { PlayerData } from '@/config/types'

const W = 140
const H = 180
const RADIUS = 12
const FOOTER_H = 58

const hw = W / 2   // 70
const hh = H / 2   // 90

// Palette
const C_CARD_BG   = 0x08080e
const C_PHOTO_BG  = 0x0e0e22
const C_FOOTER_BG = 0x040409
const C_ACCENT    = 0xd4af37
const C_TEXT_PRIMARY   = 0xffffff
const C_TEXT_SECONDARY = 0x9999bb
const C_AVATAR_RING    = 0x26264a

const PLACEHOLDER_NAME    = 'PLAYER NAME'
const PLACEHOLDER_COUNTRY = '---'
const PLACEHOLDER_SCORE   = '--'

export class PlayerCard extends OrbitItem {
  readonly type: OrbitItemType = 'card'

  private readonly shadow: Container
  private readonly outerGlow: Container
  private readonly innerGlow: Container

  private readonly photoContainer: Container
  private readonly avatarPlaceholder: Container
  private photoSprite: Sprite | null = null

  // Dimensions used by setTexture — computed in constructor based on footer flag
  private readonly photoDisplayW: number
  private readonly photoDisplayH: number
  private readonly photoCenterY: number

  // Optional footer text — only created when showFooter=true
  private readonly nameTxt: Text | null
  private readonly countryTxt: Text | null
  private readonly scoreTxt: Text | null

  constructor(data?: PlayerData, showFooter = true) {
    super()
    this.container.label = 'orbit:player-card'

    // ── Geometry —─────────────────────────────────────────────────────────────
    const photoH     = showFooter ? H - FOOTER_H : H   // 122 or 180
    const footerY    = hh - FOOTER_H                   // +32 (only used when showFooter)
    const photoTop   = -hh                             // -90
    const photoCtrY  = photoTop + photoH / 2           // -29 with footer, 0 without
    this.photoCenterY  = photoCtrY
    this.photoDisplayW = W
    this.photoDisplayH = photoH

    // ── Glow layers ────────────────────────────────────────────────────────────
    const shadowShape = new Graphics()
    shadowShape.roundRect(-hw, -hh, W, H, RADIUS)
    shadowShape.fill({ color: 0x000000, alpha: 0.85 })
    this.shadow = new Container()
    this.shadow.addChild(shadowShape)
    this.shadow.filters = [new BlurFilter({ strength: 16 })]
    this.shadow.y = 16
    this.shadow.alpha = 0

    const outerGlowShape = new Graphics()
    outerGlowShape.roundRect(-hw, -hh, W, H, RADIUS)
    outerGlowShape.fill({ color: C_ACCENT, alpha: 0.55 })
    this.outerGlow = new Container()
    this.outerGlow.addChild(outerGlowShape)
    this.outerGlow.filters = [new BlurFilter({ strength: 28 })]
    this.outerGlow.alpha = 0

    const innerGlowShape = new Graphics()
    innerGlowShape.roundRect(-hw, -hh, W, H, RADIUS)
    innerGlowShape.fill({ color: C_ACCENT, alpha: 0.8 })
    this.innerGlow = new Container()
    this.innerGlow.addChild(innerGlowShape)
    this.innerGlow.filters = [new BlurFilter({ strength: 10 })]
    this.innerGlow.alpha = 0

    // ── Masked content container ────────────────────────────────────────────────
    const content = new Container()
    const cardMask = new Graphics()
    cardMask.roundRect(-hw, -hh, W, H, RADIUS)
    cardMask.fill({ color: 0xffffff, alpha: 1 })
    content.addChild(cardMask)
    content.mask = cardMask

    // Card background
    const cardBg = new Graphics()
    cardBg.rect(-hw, -hh, W, H)
    cardBg.fill({ color: C_CARD_BG, alpha: 1 })

    // Top-edge luminance (subtle premium detail)
    const topEdge = new Graphics()
    topEdge.rect(-hw + RADIUS, -hh, W - RADIUS * 2, 2)
    topEdge.fill({ color: 0xffffff, alpha: 0.1 })

    // Photo zone background
    const photoBg = new Graphics()
    photoBg.rect(-hw, photoTop, W, photoH)
    photoBg.fill({ color: C_PHOTO_BG, alpha: 1 })

    // Avatar placeholder — person silhouette; hidden once texture loads
    const HEAD_Y  = photoCtrY - 14
    const BODY_TOP = HEAD_Y + 14
    const BODY_BOT = photoCtrY + 28

    const avatar = new Graphics()
    avatar.circle(0, HEAD_Y, 12)
    avatar.stroke({ color: C_AVATAR_RING, width: 1.5, alpha: 0.7 })
    avatar.poly([-14, BODY_TOP, 14, BODY_TOP, 18, BODY_BOT, -18, BODY_BOT])
    avatar.stroke({ color: C_AVATAR_RING, width: 1.5, alpha: 0.5 })

    this.avatarPlaceholder = new Container()
    this.avatarPlaceholder.addChild(avatar)

    this.photoContainer = new Container()
    this.photoContainer.label = 'card:photo'
    this.photoContainer.addChild(photoBg, this.avatarPlaceholder)

    content.addChild(cardBg, topEdge, this.photoContainer)

    // ── Optional footer ─────────────────────────────────────────────────────────
    if (showFooter) {
      const footerBg = new Graphics()
      footerBg.rect(-hw, footerY, W, FOOTER_H)
      footerBg.fill({ color: C_FOOTER_BG, alpha: 1 })

      const accentLine = new Graphics()
      accentLine.moveTo(-hw + 14, footerY + 1).lineTo(hw - 14, footerY + 1)
      accentLine.stroke({ color: C_ACCENT, width: 1, alpha: 0.55 })

      this.nameTxt = new Text({
        text: data?.name?.toUpperCase() ?? PLACEHOLDER_NAME,
        style: { fontFamily: 'monospace', fontSize: 11, fontWeight: 'bold', fill: C_TEXT_PRIMARY, letterSpacing: 0.5 },
      })
      this.nameTxt.anchor.set(0.5, 0)
      this.nameTxt.x = 0
      this.nameTxt.y = footerY + 9
      this.nameTxt.alpha = data?.name ? 1 : 0.38

      this.countryTxt = new Text({
        text: data?.country ?? PLACEHOLDER_COUNTRY,
        style: { fontFamily: 'monospace', fontSize: 9, fill: C_TEXT_SECONDARY },
      })
      this.countryTxt.anchor.set(0, 0)
      this.countryTxt.x = -hw + 10
      this.countryTxt.y = footerY + 28
      this.countryTxt.alpha = data?.country ? 1 : 0.32

      this.scoreTxt = new Text({
        text: data?.score ?? PLACEHOLDER_SCORE,
        style: { fontFamily: 'monospace', fontSize: 9, fontWeight: 'bold', fill: C_ACCENT },
      })
      this.scoreTxt.anchor.set(1, 0)
      this.scoreTxt.x = hw - 10
      this.scoreTxt.y = footerY + 28
      this.scoreTxt.alpha = data?.score ? 1 : 0.32

      content.addChild(footerBg, accentLine, this.nameTxt, this.countryTxt, this.scoreTxt)
    } else {
      this.nameTxt    = null
      this.countryTxt = null
      this.scoreTxt   = null
    }

    // ── Border — outside mask so it always renders on top ──────────────────────
    const cardBorder = new Graphics()
    cardBorder.roundRect(-hw, -hh, W, H, RADIUS)
    cardBorder.stroke({ color: C_ACCENT, width: 1.5, alpha: 0.65 })

    this.visual.addChild(this.shadow, this.outerGlow, this.innerGlow, content, cardBorder)

    // Apply initial data if provided
    if (data) this.setData(data)
  }

  setData(data: PlayerData): void {
    if (this.nameTxt && data.name) {
      this.nameTxt.text = data.name.toUpperCase()
      this.nameTxt.alpha = 1
    }
    if (this.countryTxt && data.country) {
      this.countryTxt.text = data.country
      this.countryTxt.alpha = 1
    }
    if (this.scoreTxt) {
      if (data.score) {
        this.scoreTxt.text = data.score
        this.scoreTxt.alpha = 1
      } else if (data.rank !== undefined) {
        this.scoreTxt.text = `#${data.rank}`
        this.scoreTxt.alpha = 1
      }
    }
  }

  setTexture(texture: Texture): void {
    const scaleX = this.photoDisplayW / texture.width
    const scaleY = this.photoDisplayH / texture.height
    const coverScale = Math.max(scaleX, scaleY)

    if (this.photoSprite) {
      this.photoSprite.texture = texture
      this.photoSprite.scale.set(coverScale)
      return
    }

    const sprite = new Sprite(texture)
    sprite.anchor.set(0.5)
    sprite.x = 0
    sprite.y = this.photoCenterY
    sprite.scale.set(coverScale)

    this.photoContainer.addChild(sprite)
    this.photoSprite = sprite
    this.avatarPlaceholder.visible = false
  }

  override swapTexture(tex: Texture, seed = 0): void {
    if (!this.photoSprite) {
      this.setTexture(tex)
      return
    }

    // ── Procedural timing (Part 4) ─────────────────────────────────────────
    // All durations are derived from the incoming photo's seed so the
    // installation never repeats exactly the same transition twice.
    const h    = (n: number) => ((seed * 2654435761 + n * 2246822519) >>> 0) / 0xffffffff
    const exitDur  = 0.55 + h(1) * 0.30   // 550–850 ms
    const trailDur = 0.14 + h(2) * 0.12   // 140–260 ms (brief ghost)
    const fadeDur  = 0.45 + h(3) * 0.35   // 450–800 ms
    const blurDur  = 0.60 + h(4) * 0.50   // 600–1100 ms
    const scaleDur = 0.70 + h(5) * 0.50   // 700–1200 ms

    // ── Spatial handoff — exit (Part 3) ────────────────────────────────────
    // Old photo recedes: it shrinks, loses focus, dims, and fades.
    // The viewer perceives it as moving away into depth, not as a cut.
    const exit = this.photoSprite
    gsap.killTweensOf(exit)
    gsap.killTweensOf(exit.scale)

    const exitBlur = new BlurFilter({ strength: 0, quality: 3 })
    exitBlur.padding = 28
    exit.filters = [exitBlur]

    const exitCoverScale = exit.scale.x
    gsap.to(exit.scale, {
      x: exitCoverScale * 0.91, y: exitCoverScale * 0.91,
      duration: exitDur, ease: 'sine.in',
    })
    gsap.to(exitBlur,  { strength: 4, duration: exitDur, ease: 'sine.in' })
    // Brief ghost phase before final fade
    gsap.to(exit, {
      alpha: 0.08, duration: trailDur, ease: 'power2.out',
      onComplete: () => {
        gsap.to(exit, {
          alpha: 0, duration: exitDur * 0.55, ease: 'power2.in',
          onComplete: () => { exit.parent?.removeChild(exit); exit.destroy() },
        })
      },
    })

    // ── Spatial handoff — enter (Part 3, 5) ─────────────────────────────────
    // New photo appears as if coming from slightly behind the trophy:
    // smaller, blurred, dim — then recovers to full presence.
    // Null the pointer so setTexture creates a new Sprite (old sprite remains
    // as a separate child and fades out independently).
    this.photoSprite = null
    this.setTexture(tex)
    const incoming    = this.photoSprite!
    const coverScale  = incoming.scale.x

    // Entry state: slightly behind (smaller) and dim
    incoming.alpha = 0
    incoming.scale.set(coverScale * 0.91)

    // Progressive focus — photo acquires sharpness as it "approaches"
    const entryBlur = new BlurFilter({ strength: 5, quality: 3 })
    entryBlur.padding = 28
    incoming.filters = [entryBlur]

    gsap.to(incoming,       { alpha: 1,      duration: fadeDur,  ease: 'power2.out' })
    gsap.to(incoming.scale, { x: coverScale, y: coverScale, duration: scaleDur, ease: 'power2.out' })
    gsap.to(entryBlur, {
      strength: 0, duration: blurDur, ease: 'power2.out',
      onComplete: () => { incoming.filters = [] },
    })
  }

  focus(): void {
    gsap.to(this.outerGlow, { alpha: 0.9,  duration: 0.13, ease: 'power2.out', overwrite: true })
    gsap.to(this.innerGlow, { alpha: 0.95, duration: 0.13, ease: 'power2.out', overwrite: true })
    gsap.to(this.shadow,    { alpha: 0.85, duration: 0.13, ease: 'power2.out', overwrite: true })
    gsap.to(this.visual.scale, { x: 1.12, y: 1.12, duration: 0.35, ease: 'back.out(1.5)', delay: 0.08, overwrite: true })
  }

  unfocus(duration = 0.3): void {
    gsap.to(this.visual.scale, { x: 1, y: 1, duration, ease: 'power2.inOut', overwrite: true })
    gsap.to(this.outerGlow,    { alpha: 0, duration, ease: 'power2.in', overwrite: true })
    gsap.to(this.innerGlow,    { alpha: 0, duration, ease: 'power2.in', overwrite: true })
    gsap.to(this.shadow,       { alpha: 0, duration, ease: 'power2.in', overwrite: true })
  }

  override fadeGlowForGallery(duration: number): void {
    gsap.to(this.outerGlow, { alpha: 0, duration, ease: 'power1.in', overwrite: true })
    gsap.to(this.innerGlow, { alpha: 0, duration, ease: 'power1.in', overwrite: true })
    gsap.to(this.shadow,    { alpha: 0, duration, ease: 'power1.in', overwrite: true })
    gsap.to(this.visual.scale, { x: 1, y: 1, duration: duration * 0.7, ease: 'power2.inOut', overwrite: true })
  }

  destroy(): void {
    gsap.killTweensOf(this.outerGlow)
    gsap.killTweensOf(this.innerGlow)
    gsap.killTweensOf(this.shadow)
    super.destroy()
  }
}
