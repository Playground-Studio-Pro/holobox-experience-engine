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
