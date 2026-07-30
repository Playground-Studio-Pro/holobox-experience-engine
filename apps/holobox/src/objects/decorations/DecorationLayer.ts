import { Container, Graphics, Assets, Sprite, FillGradient } from 'pixi.js'
import type { DecorationsConfig, DecorationItemConfig } from '@/config/types'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/config/defaults'

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

    this.buildVignette(this.back)

    const [topSprite, bottomSprite] = await Promise.all([
      config.top?.asset    ? this.loadSprite(config.top)    : Promise.resolve(null),
      config.bottom?.asset ? this.loadSprite(config.bottom) : Promise.resolve(null),
    ])

    if (this.destroyed) return

    if (topSprite) {
      topSprite.anchor.set(0.5, 0)
      topSprite.x = CANVAS_WIDTH / 2
      topSprite.y = config.top?.offsetY ?? 0
      this.front.addChild(topSprite)
    }

    if (bottomSprite) {
      bottomSprite.anchor.set(0.5, 1)
      bottomSprite.x = CANVAS_WIDTH / 2
      bottomSprite.y = CANVAS_HEIGHT + (config.bottom?.offsetY ?? 0)
      this.front.addChild(bottomSprite)
    }
  }

  destroy(): void {
    if (this.destroyed) return
    this.destroyed = true
    this.front.destroy({ children: true })
    this.back.destroy({ children: true })
  }

  // ── Ambient vignette ──────────────────────────────────────────────────────

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

  // ── Asset loader ──────────────────────────────────────────────────────────

  private async loadSprite(item: DecorationItemConfig): Promise<Sprite | null> {
    if (!item.asset) return null
    try {
      const texture = await Assets.load(item.asset)
      const sprite  = new Sprite(texture)
      if (item.scale   !== undefined) sprite.scale.set(item.scale)
      if (item.opacity !== undefined) sprite.alpha = item.opacity
      return sprite
    } catch (err) {
      console.warn('[DecorationLayer] Failed to load asset', item.asset, err)
      return null
    }
  }
}
