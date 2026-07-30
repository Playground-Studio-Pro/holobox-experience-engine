import { Assets } from 'pixi.js'
import type { Container, Ticker, Texture } from 'pixi.js'
import { lerp } from '@/utils'
import { PlayerCard } from './items/PlayerCard'
import type { OrbitEngineConfig, OrbitLayer, PlayerData } from './types'
import type { OrbitItem } from './OrbitItem'

const TWO_PI = Math.PI * 2
const MIN_SCALE = 0.65
const MAX_SCALE = 1.0
const MIN_ALPHA = 0.4
const MAX_ALPHA = 1.0

// Rate at which speedMultiplier closes the gap toward its target (per second).
// 1 - e^(-3.5 * 1.0) ≈ 97% closed after 1 second — smooth but responsive.
const SPEED_EASE_RATE = 3.5

const SWAP_COOLDOWN_SECS = 12

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

  // Photo rotation pool — cycles all available textures through orbit slots
  private allTextures: Texture[] = []
  private nextPhotoPool = 0
  private swapCooldowns: number[] = []

  constructor(config: OrbitEngineConfig) {
    this.config = config
  }

  async mount(backLayer: Container, frontLayer: Container): Promise<void> {
    this.backLayer = backLayer
    this.frontLayer = frontLayer

    const players = this.config.players ?? []
    const usePlayers = players.length > 0

    // Load textures — prefer player photoUrls, fall back to flat photos array.
    // Player textures are nullable: index N corresponds to players[N], null means no photo.
    const playerTextures = usePlayers ? await this.loadPlayerTextures(players) : []
    const legacyTextures = !usePlayers ? await this.loadTextures(this.config.photos ?? []) : []

    // Build the photo rotation pool from all non-null textures
    this.allTextures = playerTextures.filter((t): t is Texture => t !== null)

    const angleStep = TWO_PI / this.config.itemCount

    for (let i = 0; i < this.config.itemCount; i++) {
      const angle = angleStep * i
      const playerData = usePlayers ? players[i % players.length] : undefined
      const card = new PlayerCard(playerData, this.config.showCardFooter ?? true)

      if (usePlayers) {
        const tex = playerTextures[i % players.length] ?? null
        if (tex) card.setTexture(tex)
      } else if (legacyTextures.length > 0) {
        card.setTexture(legacyTextures[i % legacyTextures.length])
      }

      const initialY = this.config.center.y + this.config.ellipseY * Math.sin(angle)
      const layer = this.layerFor(initialY)
      card.currentLayer = layer
      this.layerContainer(layer).addChild(card.container)

      this.items.push(card)
      this.angles.push(angle)
      // Spread float phases so items never all bob in sync
      this.floatPhases.push((i / this.config.itemCount) * TWO_PI)
      // Stagger cooldowns so slots don't all swap at once; also staggers initial pool pointer
      this.swapCooldowns.push(i * (SWAP_COOLDOWN_SECS / this.config.itemCount))
    }

    // Staggered fade-in — items appear one by one as if materializing
    for (let i = 0; i < this.items.length; i++) {
      this.items[i].startEntrance(i * 0.12)
    }

    // Prime the pool pointer past the slots already in use
    this.nextPhotoPool = this.config.itemCount % Math.max(this.allTextures.length, 1)

    this.applyPositions()
  }

  getItems(): OrbitItem[] {
    return [...this.items]
  }

  /**
   * Smoothly transition between full speed and slow motion.
   * Call setSlowMotion(true) on touch start, false on touch end.
   */
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

    // Photo rotation — swap textures when a slot is at the far-back (low alpha)
    if (this.allTextures.length > this.config.itemCount) {
      for (let i = 0; i < this.items.length; i++) {
        this.swapCooldowns[i] -= dt
        const item = this.items[i]
        if (item.orbitAlpha < 0.50 && !item.isDetached && this.swapCooldowns[i] <= 0) {
          item.swapTexture(this.allTextures[this.nextPhotoPool])
          this.nextPhotoPool = (this.nextPhotoPool + 1) % this.allTextures.length
          this.swapCooldowns[i] = SWAP_COOLDOWN_SECS
        }
      }
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
    this.swapCooldowns = []
    this.allTextures = []
    this.backLayer = null
    this.frontLayer = null
  }

  private async loadTextures(photos: string[]): Promise<Texture[]> {
    if (photos.length === 0) return []
    try {
      return await Promise.all(photos.map((url) => Assets.load<Texture>(url)))
    } catch (err) {
      console.warn('[OrbitEngine] Failed to load photo textures', err)
      return []
    }
  }

  // Returns one entry per player — null where photoUrl is absent or fails to load.
  private async loadPlayerTextures(players: PlayerData[]): Promise<(Texture | null)[]> {
    return Promise.all(
      players.map(async (p) => {
        if (!p.photoUrl) return null
        try {
          return await Assets.load<Texture>(p.photoUrl)
        } catch (err) {
          console.warn('[OrbitEngine] Failed to load player texture', p.photoUrl, err)
          return null
        }
      }),
    )
  }

  private applyPositions(): void {
    const { center, ellipseX, ellipseY, floatAmplitude, floatFrequency } = this.config

    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i]
      const angle = this.angles[i]
      const sinA = Math.sin(angle)

      const floatY =
        floatAmplitude * Math.sin(this.elapsedSeconds * floatFrequency + this.floatPhases[i])
      const t = (sinA + 1) / 2

      // Always track — Gallery uses these to animate the item back to orbit
      item.orbitX = center.x + ellipseX * Math.cos(angle)
      item.orbitY = center.y + ellipseY * sinA + floatY
      item.orbitScale = lerp(MIN_SCALE, MAX_SCALE, t)
      item.orbitAlpha = lerp(MIN_ALPHA, MAX_ALPHA, t)

      // Gallery owns the container while detached — skip all writes
      if (item.isDetached) continue

      item.container.x = item.orbitX
      item.container.y = item.orbitY
      item.container.scale.set(item.orbitScale)
      item.container.alpha = item.orbitAlpha

      const target = this.layerFor(item.orbitY)
      if (item.currentLayer !== target) {
        this.layerContainer(target).addChild(item.container)
        item.currentLayer = target
      }
    }
  }

  private layerFor(itemY: number): OrbitLayer {
    return itemY >= this.config.layerSplit ? 'orbitFront' : 'orbitBack'
  }

  private layerContainer(layer: OrbitLayer): Container {
    return layer === 'orbitFront' ? this.frontLayer! : this.backLayer!
  }
}
