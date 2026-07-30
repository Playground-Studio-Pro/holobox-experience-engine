import { Container, Graphics, Text, Assets, Sprite, FillGradient } from 'pixi.js'
import type { DecorationsConfig, DecorationItemConfig } from '@/config/types'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/config/defaults'

const TOP_BAND_H  = 175
const BOT_BAND_H  = 140
const GOLD        = 0xd4af37
const FONT_STACK  = '"Helvetica Neue", Helvetica, Arial, sans-serif'

export class DecorationLayer {
  private readonly front = new Container()
  private readonly back  = new Container()
  private destroyed = false

  async mount(
    backLayer:  Container,
    frontLayer: Container,
    config: DecorationsConfig,
  ): Promise<void> {
    if (!config.enabled) return

    backLayer.addChild(this.back)
    frontLayer.addChild(this.front)

    // Ambient vignette goes behind all objects in the back layer
    this.buildVignette(this.back)

    // If an asset is specified, load it; otherwise draw programmatically
    if (config.top) {
      const band = config.top.asset
        ? await this.buildAssetBand(config.top, 'top')
        : this.buildTopBand(config.top)
      if (band && !this.destroyed) this.front.addChild(band)
    }

    if (config.bottom) {
      const band = config.bottom.asset
        ? await this.buildAssetBand(config.bottom, 'bottom')
        : this.buildBottomBand(config.bottom)
      if (band && !this.destroyed) this.front.addChild(band)
    }
  }

  destroy(): void {
    if (this.destroyed) return
    this.destroyed = true
    this.front.destroy({ children: true })
    this.back.destroy({ children: true })
  }

  // ── Vignette ───────────────────────────────────────────────────────────────

  private buildVignette(container: Container): void {
    const topFade = new FillGradient({
      type: 'linear', start: { x: 0, y: 0 }, end: { x: 0, y: 1 }, textureSpace: 'local',
    })
    topFade.addColorStop(0, 'rgba(0,0,4,0.45)')
    topFade.addColorStop(1, 'rgba(0,0,4,0)')
    const topV = new Graphics()
    topV.rect(0, 0, CANVAS_WIDTH, 350)
    topV.fill({ fill: topFade })
    container.addChild(topV)

    const botFade = new FillGradient({
      type: 'linear', start: { x: 0, y: 0 }, end: { x: 0, y: 1 }, textureSpace: 'local',
    })
    botFade.addColorStop(0, 'rgba(0,0,4,0)')
    botFade.addColorStop(1, 'rgba(0,0,4,0.45)')
    const botV = new Graphics()
    botV.rect(0, CANVAS_HEIGHT - 350, CANVAS_WIDTH, 350)
    botV.fill({ fill: botFade })
    container.addChild(botV)
  }

  // ── Programmatic top band ─────────────────────────────────────────────────

  private buildTopBand(item: DecorationItemConfig): Container {
    const band = new Container()
    band.alpha = item.opacity ?? 1

    // Gradient background — solid at top, fades to transparent
    const grad = new FillGradient({
      type: 'linear', start: { x: 0, y: 0 }, end: { x: 0, y: 1 }, textureSpace: 'local',
    })
    grad.addColorStop(0,    'rgba(0,0,5,0.96)')
    grad.addColorStop(0.65, 'rgba(0,0,5,0.75)')
    grad.addColorStop(1,    'rgba(0,0,5,0)')
    const bg = new Graphics()
    bg.rect(0, 0, CANVAS_WIDTH, TOP_BAND_H)
    bg.fill({ fill: grad })
    band.addChild(bg)

    // Gold accent hairline
    const line = new Graphics()
    line.rect(64, TOP_BAND_H - 2, CANVAS_WIDTH - 128, 1)
    line.fill({ color: GOLD, alpha: 0.40 })
    band.addChild(line)

    if (item.title) {
      const titleTxt = new Text({
        text: item.title,
        style: {
          fontFamily: FONT_STACK,
          fontSize: 46,
          fontWeight: '300',
          fill: 0xffffff,
          letterSpacing: 10,
        },
      })
      titleTxt.anchor.set(0.5, 0)
      titleTxt.x = CANVAS_WIDTH / 2
      titleTxt.y = 28
      titleTxt.eventMode = 'none'
      band.addChild(titleTxt)
    }

    if (item.subtitle) {
      const subTxt = new Text({
        text: item.subtitle,
        style: {
          fontFamily: FONT_STACK,
          fontSize: 13,
          fontWeight: '400',
          fill: GOLD,
          letterSpacing: 5,
        },
      })
      subTxt.anchor.set(0.5, 0)
      subTxt.x = CANVAS_WIDTH / 2
      subTxt.y = 103
      subTxt.alpha = 0.90
      subTxt.eventMode = 'none'
      band.addChild(subTxt)
    }

    return band
  }

  // ── Programmatic bottom band ──────────────────────────────────────────────

  private buildBottomBand(item: DecorationItemConfig): Container {
    const band = new Container()
    band.alpha = item.opacity ?? 1

    // Gradient background — transparent at top, solid at bottom
    const grad = new FillGradient({
      type: 'linear', start: { x: 0, y: 0 }, end: { x: 0, y: 1 }, textureSpace: 'local',
    })
    grad.addColorStop(0,    'rgba(0,0,5,0)')
    grad.addColorStop(0.35, 'rgba(0,0,5,0.75)')
    grad.addColorStop(1,    'rgba(0,0,5,0.96)')
    const bg = new Graphics()
    bg.rect(0, CANVAS_HEIGHT - BOT_BAND_H, CANVAS_WIDTH, BOT_BAND_H)
    bg.fill({ fill: grad })
    band.addChild(bg)

    // Gold accent hairline
    const line = new Graphics()
    line.rect(64, CANVAS_HEIGHT - BOT_BAND_H + 1, CANVAS_WIDTH - 128, 1)
    line.fill({ color: GOLD, alpha: 0.25 })
    band.addChild(line)

    if (item.title) {
      const txt = new Text({
        text: item.title,
        style: {
          fontFamily: FONT_STACK,
          fontSize: 14,
          fontWeight: '300',
          fill: 0xffffff,
          letterSpacing: 6,
        },
      })
      txt.anchor.set(0.5, 0.5)
      txt.x = CANVAS_WIDTH / 2
      txt.y = CANVAS_HEIGHT - BOT_BAND_H / 2 + 8
      txt.alpha = 0.55
      txt.eventMode = 'none'
      band.addChild(txt)
    }

    return band
  }

  // ── Asset-based band (legacy / design-supplied PNG/SVG) ───────────────────

  private async buildAssetBand(
    item: DecorationItemConfig,
    position: 'top' | 'bottom',
  ): Promise<Container | null> {
    try {
      const texture = await Assets.load(item.asset!)
      const sprite  = new Sprite(texture)
      sprite.anchor.set(0.5, position === 'top' ? 0 : 1)
      sprite.x = CANVAS_WIDTH / 2
      sprite.y = position === 'top'
        ? (item.offsetY ?? 0)
        : CANVAS_HEIGHT + (item.offsetY ?? 0)
      if (item.scale   !== undefined) sprite.scale.set(item.scale)
      if (item.opacity !== undefined) sprite.alpha = item.opacity
      const c = new Container()
      c.addChild(sprite)
      return c
    } catch (err) {
      console.warn('[DecorationLayer] Failed to load asset', item.asset, err)
      return null
    }
  }
}
