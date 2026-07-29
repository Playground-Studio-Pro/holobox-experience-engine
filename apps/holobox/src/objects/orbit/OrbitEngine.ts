import type { Container, Ticker } from 'pixi.js'
import { lerp } from '@/utils'
import { PhotoItem } from './items/PhotoItem'
import type { OrbitEngineConfig, OrbitLayer } from './types'
import type { OrbitItem } from './OrbitItem'

const TWO_PI = Math.PI * 2
const MIN_SCALE = 0.65
const MAX_SCALE = 1.0
const MIN_ALPHA = 0.4
const MAX_ALPHA = 1.0

export class OrbitEngine {
  private readonly config: OrbitEngineConfig
  private items: OrbitItem[] = []
  private angles: number[] = []
  private backLayer: Container | null = null
  private frontLayer: Container | null = null

  constructor(config: OrbitEngineConfig) {
    this.config = config
  }

  mount(backLayer: Container, frontLayer: Container): void {
    this.backLayer = backLayer
    this.frontLayer = frontLayer

    const angleStep = TWO_PI / this.config.itemCount

    for (let i = 0; i < this.config.itemCount; i++) {
      const angle = angleStep * i
      const item = new PhotoItem()
      const layer = this.layerFor(Math.sin(angle))

      item.currentLayer = layer
      this.layerContainer(layer).addChild(item.container)

      this.items.push(item)
      this.angles.push(angle)
    }

    this.applyPositions()
  }

  update(ticker: Ticker): void {
    const step = (this.config.speed / 60) * ticker.deltaTime

    for (let i = 0; i < this.angles.length; i++) {
      this.angles[i] = (this.angles[i] + step) % TWO_PI
    }

    this.applyPositions()
  }

  destroy(): void {
    for (const item of this.items) {
      item.destroy()
    }
    this.items = []
    this.angles = []
    this.backLayer = null
    this.frontLayer = null
  }

  private applyPositions(): void {
    const { center, ellipseX, ellipseY } = this.config

    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i]
      const angle = this.angles[i]
      const sinA = Math.sin(angle)

      item.container.x = center.x + ellipseX * Math.cos(angle)
      item.container.y = center.y + ellipseY * sinA

      const t = (sinA + 1) / 2
      item.container.scale.set(lerp(MIN_SCALE, MAX_SCALE, t))
      item.container.alpha = lerp(MIN_ALPHA, MAX_ALPHA, t)

      const target = this.layerFor(sinA)
      if (item.currentLayer !== target) {
        this.layerContainer(target).addChild(item.container)
        item.currentLayer = target
      }
    }
  }

  private layerFor(sinAngle: number): OrbitLayer {
    return sinAngle >= 0 ? 'orbitFront' : 'orbitBack'
  }

  private layerContainer(layer: OrbitLayer): Container {
    return layer === 'orbitFront' ? this.frontLayer! : this.backLayer!
  }
}
