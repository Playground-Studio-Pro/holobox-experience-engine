import { Container, Graphics, Assets } from 'pixi.js'
import type { Texture } from 'pixi.js'
import { CompositionPhoto } from './CompositionPhoto'
import type { EditorialCompositionConfig } from '@/config/types'
import type { PlayerData } from '@/config/types'

type LayerMap = {
  back: Container
  front: Container
}

export class EditorialComposition {
  private readonly config: EditorialCompositionConfig
  private photos: CompositionPhoto[] = []
  private ellipsis: Graphics | null = null

  constructor(config: EditorialCompositionConfig) {
    this.config = config
  }

  async mount(layers: LayerMap, players: PlayerData[]): Promise<void> {
    if (!this.config.enabled) return

    if (this.config.ellipse) {
      const e = this.config.ellipse
      const color = typeof e.color === 'string'
        ? parseInt(e.color.replace('#', ''), 16)
        : (e.color ?? 0x888888)

      const g = new Graphics()
      g.ellipse(e.cx, e.cy, e.rx, e.ry)
      g.stroke({ color, alpha: e.alpha ?? 0.18, width: e.lineWidth ?? 1 })
      layers.back.addChild(g)
      this.ellipsis = g
    }

    const textureLoads: Promise<void>[] = []

    for (const slot of this.config.slots) {
      const photo = new CompositionPhoto({
        width: slot.width,
        height: slot.height,
        radius: slot.radius,
        alpha: slot.alpha,
        blur: slot.blur,
      })

      photo.container.x = slot.x
      photo.container.y = slot.y

      const layer = slot.layer === 'back' ? layers.back : layers.front
      layer.addChild(photo.container)
      this.photos.push(photo)

      if (slot.playerIndex >= 0 && slot.playerIndex < players.length) {
        const player = players[slot.playerIndex]
        if (player.photoUrl) {
          const load = Assets.load<Texture>(player.photoUrl)
            .then((tex) => photo.setTexture(tex))
            .catch((err) =>
              console.warn('[EditorialComposition] texture load failed', player.photoUrl, err),
            )
          textureLoads.push(load)
        }
      }
    }

    await Promise.allSettled(textureLoads)
  }

  /** Returns the raw PixiJS containers for all mounted photo slots. */
  getPhotoContainers(): Container[] {
    return this.photos.map((p) => p.container)
  }

  destroy(): void {
    for (const photo of this.photos) {
      photo.destroy()
    }
    this.photos = []

    if (this.ellipsis) {
      this.ellipsis.destroy()
      this.ellipsis = null
    }
  }
}
