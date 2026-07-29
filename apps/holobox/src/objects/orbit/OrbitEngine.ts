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

// Rate at which speedMultiplier closes the gap toward its target (per second).
// 1 - e^(-3.5 * 1.0) ≈ 97% closed after 1 second — smooth but responsive.
const SPEED_EASE_RATE = 3.5

export class OrbitEngine {
  private readonly config: OrbitEngineConfig
  private items: OrbitItem[] = []
  private angles: number[] = []
  private floatPhases: number[] = []
  private backLayer: Container | null = null
  private frontLayer: Container | null = null

  private elapsedSeconds = 0
  private speedMultiplier = 1.0
  private targetSpeedMultiplier = 1.0

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
      // Spread float phases so items never all bob in sync
      this.floatPhases.push((i / this.config.itemCount) * TWO_PI)
    }

    this.applyPositions()
  }

  /**
   * Smoothly transition between full speed and slow motion.
   * Call setSlowMotion(true) on touch start, false on touch end.
   */
  getItems(): OrbitItem[] {
    return [...this.items]
  }

  setSlowMotion(active: boolean): void {
    this.targetSpeedMultiplier = active ? this.config.slowMotionScale : 1.0
  }

  update(ticker: Ticker): void {
    const dt = ticker.deltaMS / 1000

    // Exponential ease toward target multiplier — frame-rate independent
    const smoothFactor = 1 - Math.exp(-SPEED_EASE_RATE * dt)
    this.speedMultiplier = lerp(this.speedMultiplier, this.targetSpeedMultiplier, smoothFactor)

    // Float runs at full rate regardless of orbit speed multiplier
    this.elapsedSeconds += dt

    const step = this.config.speed * dt * this.speedMultiplier
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
    this.floatPhases = []
    this.backLayer = null
    this.frontLayer = null
  }

  private applyPositions(): void {
    const { center, ellipseX, ellipseY, floatAmplitude, floatFrequency } = this.config

    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i]
      const angle = this.angles[i]
      const sinA = Math.sin(angle)

      const floatY = floatAmplitude * Math.sin(this.elapsedSeconds * floatFrequency + this.floatPhases[i])

      item.container.x = center.x + ellipseX * Math.cos(angle)
      item.container.y = center.y + ellipseY * sinA + floatY

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
