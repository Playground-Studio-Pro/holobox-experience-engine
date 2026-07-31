import { Container, Graphics, Sprite, BlurFilter } from 'pixi.js'
import type { Texture } from 'pixi.js'

export interface CompositionPhotoOptions {
  width: number
  height: number
  radius?: number
  alpha?: number
  blur?: number
}

export class CompositionPhoto {
  readonly container = new Container()
  private readonly photoContainer: Container
  private readonly w: number
  private readonly h: number
  private sprite: Sprite | null = null

  constructor(opts: CompositionPhotoOptions) {
    this.w = opts.width
    this.h = opts.height

    const hw = opts.width / 2
    const hh = opts.height / 2
    const r = opts.radius ?? 14

    const photoContainer = new Container()

    const mask = new Graphics()
    mask.roundRect(-hw, -hh, opts.width, opts.height, r)
    mask.fill({ color: 0xffffff })

    photoContainer.addChild(mask)
    photoContainer.mask = mask
    this.photoContainer = photoContainer

    this.container.addChild(photoContainer)
    this.container.alpha = opts.alpha ?? 1

    if (opts.blur && opts.blur > 0) {
      this.container.filters = [new BlurFilter({ strength: opts.blur })]
    }
  }

  setTexture(texture: Texture): void {
    const scaleX = this.w / texture.width
    const scaleY = this.h / texture.height
    const coverScale = Math.max(scaleX, scaleY)

    if (this.sprite) {
      this.sprite.texture = texture
      this.sprite.scale.set(coverScale)
      return
    }

    const sprite = new Sprite(texture)
    sprite.anchor.set(0.5)
    sprite.scale.set(coverScale)
    this.photoContainer.addChild(sprite)
    this.sprite = sprite
  }

  destroy(): void {
    this.container.destroy({ children: true })
  }
}
