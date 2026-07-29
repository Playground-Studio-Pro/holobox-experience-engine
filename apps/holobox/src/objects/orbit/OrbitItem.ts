import { Container } from 'pixi.js'
import type { OrbitItemType, OrbitLayer } from './types'

export abstract class OrbitItem {
  abstract readonly type: OrbitItemType
  readonly container: Container
  currentLayer: OrbitLayer = 'orbitBack'

  constructor() {
    this.container = new Container()
  }

  destroy(): void {
    this.container.destroy({ children: true })
  }
}
