import { Container, Text, Graphics, Sprite, Assets } from 'pixi.js'
import type { FooterConfig } from '@/config/types'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/config/defaults'

const DEFAULT_X = 60
const DEFAULT_Y = CANVAS_HEIGHT - 100

const SPONSOR_MARGIN_X = 60

export class FooterLayer {
  readonly container = new Container()

  async mount(layer: Container, config: FooterConfig): Promise<void> {
    const x = config.x ?? DEFAULT_X
    const baseY = config.y ?? DEFAULT_Y

    if (config.label) {
      const label = new Text({
        text: config.label,
        style: {
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: 18,
          fontWeight: 'normal',
          fill: 0x888888,
          letterSpacing: 4,
        },
      })
      label.x = x
      label.y = baseY - 120
      this.container.addChild(label)
    }

    if (config.name) {
      const name = new Text({
        text: config.name,
        style: {
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: 28,
          fontWeight: 'normal',
          fill: 0x111111,
          letterSpacing: 1,
        },
      })
      name.x = x
      name.y = baseY - 52
      this.container.addChild(name)
    }

    if (config.name) {
      const rule = new Graphics()
      rule.moveTo(x, baseY - 24)
      rule.lineTo(x + 200, baseY - 24)
      rule.stroke({ color: 0xcccccc, width: 1 })
      this.container.addChild(rule)
    }

    if (config.meta) {
      const meta = new Text({
        text: config.meta,
        style: {
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: 20,
          fontWeight: 'normal',
          fill: 0x555555,
          letterSpacing: 3,
        },
      })
      meta.x = x
      meta.y = baseY - 14
      this.container.addChild(meta)
    }

    if (config.sponsor?.asset) {
      try {
        const texture = await Assets.load(config.sponsor.asset)
        const sprite  = new Sprite(texture)
        // anchor(1,1) → x/y mark the bottom-right corner of the sprite.
        // We set y = baseY + 6 so the logo bottom aligns with the meta text bottom
        // (meta top = baseY - 14, meta height ≈ 20px → bottom ≈ baseY + 6).
        sprite.anchor.set(1, 1)
        sprite.x = CANVAS_WIDTH - SPONSOR_MARGIN_X
        sprite.y = baseY + 6
        if (config.sponsor.scale   !== undefined) sprite.scale.set(config.sponsor.scale)
        if (config.sponsor.opacity !== undefined) sprite.alpha = config.sponsor.opacity
        this.container.addChild(sprite)
      } catch (err) {
        console.warn('[FooterLayer] Failed to load sponsor asset', config.sponsor.asset, err)
      }
    }

    layer.addChild(this.container)
  }

  destroy(): void {
    this.container.destroy({ children: true })
  }
}
