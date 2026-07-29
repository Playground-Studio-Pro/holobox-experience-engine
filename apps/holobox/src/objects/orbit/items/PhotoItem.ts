import { Graphics } from 'pixi.js'
import { OrbitItem } from '../OrbitItem'
import type { OrbitItemType } from '../types'

const W = 140
const H = 180
const RADIUS = 12

export class PhotoItem extends OrbitItem {
  readonly type: OrbitItemType = 'photo'

  constructor() {
    super()
    this.container.label = 'orbit:photo'

    const hw = W / 2
    const hh = H / 2

    const card = new Graphics()
    card.roundRect(-hw, -hh, W, H, RADIUS)
    card.fill({ color: 0x0d0d1a, alpha: 0.78 })
    card.stroke({ color: 0xffffff, width: 2, alpha: 0.65 })

    this.container.addChild(card)
  }
}
