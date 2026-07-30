import { Container, Assets, Sprite } from 'pixi.js'
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

    const [topSprite, bottomSprite] = await Promise.all([
      this.loadSprite(config.top),
      this.loadSprite(config.bottom),
    ])

    if (this.destroyed) return

    if (topSprite) {
      topSprite.anchor.set(0.5, 0)
      topSprite.x = CANVAS_WIDTH / 2
      topSprite.y = config.top?.offsetY ?? 0
      if (config.top?.scale   !== undefined) topSprite.scale.set(config.top.scale)
      if (config.top?.opacity !== undefined) topSprite.alpha = config.top.opacity
      this.front.addChild(topSprite)
    }

    if (bottomSprite) {
      bottomSprite.anchor.set(0.5, 1)
      bottomSprite.x = CANVAS_WIDTH / 2
      bottomSprite.y = CANVAS_HEIGHT + (config.bottom?.offsetY ?? 0)
      if (config.bottom?.scale   !== undefined) bottomSprite.scale.set(config.bottom.scale)
      if (config.bottom?.opacity !== undefined) bottomSprite.alpha = config.bottom.opacity
      this.front.addChild(bottomSprite)
    }
  }

  destroy(): void {
    if (this.destroyed) return
    this.destroyed = true
    this.front.destroy({ children: true })
    this.back.destroy({ children: true })
  }

  private async loadSprite(item?: DecorationItemConfig): Promise<Sprite | null> {
    if (!item?.asset) return null
    try {
      const texture = await Assets.load(item.asset)
      return new Sprite(texture)
    } catch (err) {
      console.warn('[DecorationLayer] Failed to load asset', item.asset, err)
      return null
    }
  }
}
