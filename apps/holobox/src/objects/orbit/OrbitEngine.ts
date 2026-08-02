import { Assets } from 'pixi.js'
import { gsap } from 'gsap'
import type { Container, Ticker, Texture } from 'pixi.js'
import { lerp } from '@/utils'
import { PlayerCard } from './items/PlayerCard'
import { PhotoScheduler } from './PhotoScheduler'
import { PhotoMotion } from './PhotoMotion'
import { ArchiveGhostLayer } from './ArchiveGhostLayer'
import type { OrbitEngineConfig, OrbitLayer, PlayerData } from './types'
import type { OrbitItem } from './OrbitItem'

const TWO_PI = Math.PI * 2

// Fallback depth range — overridden by config when present.
// project.json ships minAlpha: 0.15, minScale: 0.55 for a much more dramatic
// depth gradient than these fallbacks; always prefer the config values.
const DEFAULT_MIN_ALPHA = 0.40
const DEFAULT_MAX_ALPHA = 1.0
const DEFAULT_MIN_SCALE = 0.65
const DEFAULT_MAX_SCALE = 1.0

const BACK_ALPHA_THRESHOLD = 0.28
const SPEED_EASE_RATE = 3.5

// ── Part 1 / Ticket 0012 — Orbital breathing ─────────────────────────────────
const BREATH_AMP_X    = 0.020
const BREATH_AMP_Y    = 0.010
const BREATH_PERIOD_X = 51
const BREATH_PERIOD_Y = 67

// ── Part 2 / Ticket 0012 — Ambient velocity drift ────────────────────────────
const VEL_DRIFT_AMP    = 0.030
const VEL_DRIFT_PERIOD = 67

// ── Part 6 / Ticket 0012 — Depth-based luminance ─────────────────────────────
const LUMINANCE_MIN = 0.93
const LUMINANCE_MAX = 1.02

// ── Part 8 / Ticket 0012 — Neighbor awareness ────────────────────────────────
const NEIGHBOR_NUDGE_PX  = 3.5
const NEIGHBOR_NUDGE_DUR = 0.5

// ── Part 2 / Ticket 0013 — Hero rotation ─────────────────────────────────────
const HERO_SCALE_BOOST  = 0.042  // +4.2% scale at peak
const HERO_ALPHA_BOOST  = 0.040  // slight brightness lift
const HERO_SLOW_FACTOR  = 0.14   // hero orbits 14% slower
const HERO_RISE_DUR     = 1.6    // s — fade into hero state
const HERO_FALL_DUR     = 1.4    // s — graceful release
const HERO_HOLD_MIN     = 6.0    // s
const HERO_HOLD_MAX     = 10.0   // s
const HERO_GAP          = 1.5    // s gap between release and next selection

// ── Part 5 / Ticket 0013 — Trophy influence ───────────────────────────────────
const TROPHY_DIM_MAX = 0.12   // up to −12% alpha as card passes deepest behind trophy

// ── Part 7 / Ticket 0013 — Composition drift ─────────────────────────────────
// A very slow angular "folding" that creates non-uniform spacing.
// Each card's effective angle is nudged by a slow sine whose reference direction
// rotates over COMP_DRIFT_PERIOD seconds.
const COMP_DRIFT_AMP    = 0.04   // radians (~2.3°) peak per-card spread
const COMP_DRIFT_PERIOD = 240    // s

export class OrbitEngine {
  private readonly config: OrbitEngineConfig
  private items: OrbitItem[] = []
  private angles: number[] = []
  private floatPhases: number[] = []
  private backLayer: Container | null = null
  private frontLayer: Container | null = null

  private elapsedSeconds  = 0
  private speedMultiplier = 1.0
  private targetSpeedMultiplier = 1.0

  private allTextures:  Texture[] = []
  private scheduler:    PhotoScheduler | null = null
  private photoMotion:  PhotoMotion   | null = null
  private archiveGhosts: ArchiveGhostLayer | null = null

  // Neighbor nudge proxies (Part 8 / 0012)
  private neighborNudges: { x: number; y: number }[] = []

  // Per-photo spatial personality (Part 8 / 0013) — reset on every swap
  // Gives each photograph a unique but stable positional identity during its lifetime.
  private photoPersonality: Array<{ dx: number; dy: number; scaleMult: number }> = []

  // Hero rotation (Part 2 / 0013)
  private heroProxies: Array<{ v: number }> = []
  private heroIndex  = -1
  private heroTimer  = 2.0  // initial delay before first hero selection
  private heroActive = false

  // Phase offsets chosen randomly at construction — each session feels different
  private readonly breathPhaseX:   number
  private readonly breathPhaseY:   number
  private readonly velDriftPhase:  number
  private readonly compDriftPhase: number

  constructor(config: OrbitEngineConfig) {
    this.config         = config
    this.breathPhaseX   = Math.random() * TWO_PI
    this.breathPhaseY   = Math.random() * TWO_PI
    this.velDriftPhase  = Math.random() * TWO_PI
    this.compDriftPhase = Math.random() * TWO_PI
  }

  async mount(backLayer: Container, frontLayer: Container): Promise<void> {
    this.backLayer  = backLayer
    this.frontLayer = frontLayer

    const players    = this.config.players ?? []
    const usePlayers = players.length > 0

    const playerTextures = usePlayers ? await this.loadPlayerTextures(players) : []
    const legacyTextures = !usePlayers ? await this.loadTextures(this.config.photos ?? []) : []

    this.allTextures = playerTextures.filter((t): t is Texture => t !== null)

    const angleStep    = TWO_PI / this.config.itemCount
    const anchorAngles = this.config.anchorAngles

    for (let i = 0; i < this.config.itemCount; i++) {
      // Part 7 (Ticket 0013) — use project.json anchorAngles when provided.
      // These create intentional non-uniform compositional spacing instead of the
      // default mathematically-perfect distribution.
      const angle      = anchorAngles ? (anchorAngles[i] ?? angleStep * i) : angleStep * i
      const playerData = usePlayers ? players[i % players.length] : undefined
      const card       = new PlayerCard(playerData, this.config.showCardFooter ?? true)

      if (usePlayers) {
        const tex = playerTextures[i % players.length] ?? null
        if (tex) card.setTexture(tex)
      } else if (legacyTextures.length > 0) {
        card.setTexture(legacyTextures[i % legacyTextures.length])
      }

      const initialY = this.config.center.y + this.config.ellipseY * Math.sin(angle)
      const layer    = this.layerFor(initialY)
      card.currentLayer = layer
      this.layerContainer(layer).addChild(card.container)

      this.items.push(card)
      this.angles.push(angle)
      this.floatPhases.push((i / this.config.itemCount) * TWO_PI)
      this.neighborNudges.push({ x: 0, y: 0 })
      this.heroProxies.push({ v: 0 })
      this.photoPersonality.push(this.randomPersonality())
    }

    this.photoMotion = new PhotoMotion(this.config.itemCount)

    if (this.allTextures.length > this.config.itemCount) {
      const scheduler = new PhotoScheduler(
        this.allTextures.length,
        this.config.itemCount,
        this.config.scheduler ?? {},
      )
      for (let i = 0; i < this.config.itemCount; i++) {
        scheduler.initSlot(i, i % this.allTextures.length)
      }
      this.scheduler = scheduler
    }

    // ── Part 6 (Ticket 0013) — Archive ghost layer ───────────────────────────
    // Scheduler must be created first so getActiveSet() can seed the ghost layer,
    // preventing any texture from appearing in both an orbit slot and a ghost.
    if (this.allTextures.length > 0) {
      this.archiveGhosts = new ArchiveGhostLayer(this.config.center, this.config.speed)
      this.archiveGhosts.mount(
        backLayer,
        this.allTextures,
        this.scheduler?.getActiveSet() ?? new Set(),
      )
    }

    // Staggered fade-in so cards materialise one by one
    for (let i = 0; i < this.items.length; i++) {
      this.items[i].startEntrance(i * 0.12)
    }

    this.applyPositions()
  }

  getItems(): OrbitItem[] {
    return [...this.items]
  }

  setSlowMotion(active: boolean): void {
    this.targetSpeedMultiplier = active ? this.config.slowMotionScale : 1.0
  }

  update(ticker: Ticker): void {
    const dt = ticker.deltaMS / 1000

    const smoothFactor = 1 - Math.exp(-SPEED_EASE_RATE * dt)
    this.speedMultiplier = lerp(this.speedMultiplier, this.targetSpeedMultiplier, smoothFactor)

    this.elapsedSeconds += dt

    // ── Velocity drift (Part 2 / 0012) ──────────────────────────────────────
    const velDrift = 1 + VEL_DRIFT_AMP * Math.sin(
      this.elapsedSeconds * (TWO_PI / VEL_DRIFT_PERIOD) + this.velDriftPhase,
    )
    const baseStep = this.config.speed * dt * this.speedMultiplier * velDrift

    for (let i = 0; i < this.angles.length; i++) {
      const speedVar   = this.photoMotion?.getSpeedVariation(i) ?? 1.0
      // Part 2 (Ticket 0013) — hero card orbits slightly slower, creating a
      // natural "lingering" quality without any visible UI treatment.
      const heroSlow   = 1 - HERO_SLOW_FACTOR * this.heroProxies[i].v
      this.angles[i]   = (this.angles[i] + baseStep * speedVar * heroSlow) % TWO_PI
    }

    // ── Hero rotation (Part 2 / Ticket 0013) ────────────────────────────────
    this.heroTimer -= dt
    if (this.heroTimer <= 0) {
      if (this.heroActive) {
        this.releaseHero()
      } else {
        this.selectHero()
      }
    }

    // ── Photo rotation via scheduler ─────────────────────────────────────────
    if (this.scheduler) {
      for (let i = 0; i < this.items.length; i++) {
        const item   = this.items[i]
        const atBack = item.orbitAlpha < BACK_ALPHA_THRESHOLD
        if (this.scheduler.tick(i, dt, atBack) && !item.isDetached) {
          const nextIdx = this.scheduler.nextIndex()
          if (nextIdx !== null) {
            item.swapTexture(this.allTextures[nextIdx], nextIdx)
            this.scheduler.confirmSwap(i, nextIdx)
            // Ticket 0014 — keep ghost layer free of textures now in orbit
            this.archiveGhosts?.updateExclusions(this.allTextures, this.scheduler.getActiveSet())
            // Part 8 (Ticket 0013) — new photo, new personality
            this.photoPersonality[i] = this.randomPersonality()
            // Part 8 (Ticket 0012) — neighbor awareness
            this.nudgeNeighbors(i)
          }
        }
      }
    }

    // ── Archive ghosts ───────────────────────────────────────────────────────
    const { ellipseX, ellipseY } = this.getBreathingEllipse()
    this.archiveGhosts?.update(ticker, ellipseX, ellipseY)

    this.applyPositions()
  }

  destroy(): void {
    for (const nudge of this.neighborNudges) gsap.killTweensOf(nudge)
    for (const proxy of this.heroProxies)   gsap.killTweensOf(proxy)
    for (const item of this.items)          item.destroy()
    this.archiveGhosts?.destroy()
    this.items           = []
    this.angles          = []
    this.floatPhases     = []
    this.neighborNudges  = []
    this.heroProxies     = []
    this.photoPersonality = []
    this.allTextures     = []
    this.scheduler       = null
    this.photoMotion     = null
    this.archiveGhosts   = null
    this.backLayer       = null
    this.frontLayer      = null
  }

  // ── Private ────────────────────────────────────────────────────────────────

  private getBreathingEllipse(): { ellipseX: number; ellipseY: number } {
    const breathX = 1 + BREATH_AMP_X * Math.sin(
      this.elapsedSeconds * (TWO_PI / BREATH_PERIOD_X) + this.breathPhaseX,
    )
    const breathY = 1 + BREATH_AMP_Y * Math.sin(
      this.elapsedSeconds * (TWO_PI / BREATH_PERIOD_Y) + this.breathPhaseY,
    )
    return {
      ellipseX: this.config.ellipseX * breathX,
      ellipseY: this.config.ellipseY * breathY,
    }
  }

  /**
   * Elect a new hero card. Weights toward cards with higher orbit alpha
   * (front-facing, fully visible) so the elevated treatment is always legible.
   */
  private selectHero(): void {
    const candidates: number[] = []
    let totalWeight = 0
    const weights: number[] = []

    for (let i = 0; i < this.items.length; i++) {
      if (!this.items[i].isDetached && this.items[i].orbitAlpha > 0.62) {
        const w = this.items[i].orbitAlpha
        candidates.push(i)
        weights.push(w)
        totalWeight += w
      }
    }

    if (candidates.length === 0) { this.heroTimer = 2.0; return }

    // Weighted random selection — front cards are slightly more likely to become hero
    let pick  = Math.random() * totalWeight
    let newHero = candidates[0]
    for (let j = 0; j < candidates.length; j++) {
      pick -= weights[j]
      if (pick <= 0) { newHero = candidates[j]; break }
    }

    this.heroIndex  = newHero
    this.heroActive = true
    this.heroTimer  = HERO_HOLD_MIN + Math.random() * (HERO_HOLD_MAX - HERO_HOLD_MIN)
    gsap.to(this.heroProxies[newHero], { v: 1, duration: HERO_RISE_DUR, ease: 'power2.inOut', overwrite: true })
  }

  /** Gracefully step the current hero down and schedule the gap before next selection. */
  private releaseHero(): void {
    if (this.heroIndex >= 0) {
      gsap.to(this.heroProxies[this.heroIndex], { v: 0, duration: HERO_FALL_DUR, ease: 'power2.inOut', overwrite: true })
      this.heroIndex = -1
    }
    this.heroActive = false
    this.heroTimer  = HERO_GAP
  }

  /** Adjacent cards briefly shift outward — the orbit makes room for the arriving photo. */
  private nudgeNeighbors(swappedIndex: number): void {
    const n = this.items.length
    for (const offset of [-1, 1]) {
      const adj   = (swappedIndex + offset + n) % n
      const nudge = this.neighborNudges[adj]
      nudge.x = Math.cos(this.angles[adj]) * NEIGHBOR_NUDGE_PX
      nudge.y = Math.sin(this.angles[adj]) * NEIGHBOR_NUDGE_PX
      gsap.to(nudge, { x: 0, y: 0, duration: NEIGHBOR_NUDGE_DUR, ease: 'power2.inOut', overwrite: true })
    }
  }

  /** Each photograph occupies orbit space slightly differently.
   *  Values are stable for the photo's lifetime, reset on the next swap. */
  private randomPersonality(): { dx: number; dy: number; scaleMult: number } {
    return {
      dx:        (Math.random() - 0.5) * 10,   // ±5 px
      dy:        (Math.random() - 0.5) * 8,    // ±4 px
      scaleMult: 0.97 + Math.random() * 0.06,  // 0.97–1.03
    }
  }

  private applyPositions(): void {
    const { center, floatAmplitude, floatFrequency } = this.config
    const minAlpha = this.config.minAlpha ?? DEFAULT_MIN_ALPHA
    const maxAlpha = this.config.maxAlpha ?? DEFAULT_MAX_ALPHA
    const minScale = this.config.minScale ?? DEFAULT_MIN_SCALE
    const maxScale = this.config.maxScale ?? DEFAULT_MAX_SCALE

    const { ellipseX, ellipseY } = this.getBreathingEllipse()

    // Trophy influence geometry: deepest-behind point is top of orbit
    const minY = center.y - ellipseY  // orbitY at deepest behind-trophy position

    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i]

      // ── Part 7 (Ticket 0013) — Composition drift ─────────────────────────
      // A slow sine creates non-uniform angular spacing that drifts around the
      // orbit over COMP_DRIFT_PERIOD seconds. Amplitude is ~2.3° — imperceptible
      // as movement but prevents the orbit from ever feeling mathematically regular.
      const compDriftT = this.elapsedSeconds * (TWO_PI / COMP_DRIFT_PERIOD) + this.compDriftPhase
      const compOffset = COMP_DRIFT_AMP * Math.sin(this.angles[i] * 2 + compDriftT)
      const effectiveAngle = this.angles[i] + compOffset

      const sinA = Math.sin(effectiveAngle)
      const t    = (sinA + 1) / 2

      const floatY = floatAmplitude * Math.sin(
        this.elapsedSeconds * floatFrequency + this.floatPhases[i],
      )

      item.orbitX     = center.x + ellipseX * Math.cos(effectiveAngle)
      item.orbitY     = center.y + ellipseY * sinA + floatY
      item.orbitScale = lerp(minScale, maxScale, t)
      item.orbitAlpha = lerp(minAlpha, maxAlpha, t)

      if (item.isDetached) continue

      // ── Part 5 (Ticket 0013) — Trophy influence ─────────────────────────
      // Cards behind the trophy (y < layerSplit) dim as they pass deeper.
      // The effect is strongest at the top of the orbit (farthest behind the trophy)
      // and zero at the layer split (just entering back layer).
      const isBehind   = item.orbitY < this.config.layerSplit
      const layerRange = this.config.layerSplit - minY
      const behindT    = isBehind && layerRange > 0
        ? Math.max(0, (this.config.layerSplit - item.orbitY) / layerRange)
        : 0
      const trophyDim  = 1 - behindT * TROPHY_DIM_MAX

      // ── Part 6 (Ticket 0012) — Depth-based luminance ────────────────────
      const luminance = lerp(LUMINANCE_MIN, LUMINANCE_MAX, t)

      // ── Part 2 (Ticket 0013) — Hero elevation ────────────────────────────
      const heroT          = this.heroProxies[i].v
      const heroScaleMult  = 1 + HERO_SCALE_BOOST * heroT
      const heroAlphaMult  = 1 + HERO_ALPHA_BOOST * heroT

      // ── Secondary motion (Ticket 0011) ───────────────────────────────────
      const motion = this.photoMotion?.getOffsets(i, this.elapsedSeconds)

      // ── Per-photo spatial personality (Part 8 / Ticket 0013) ─────────────
      const personality = this.photoPersonality[i]

      // ── Neighbor nudge (Part 8 / Ticket 0012) ────────────────────────────
      const nudge = this.neighborNudges[i]

      item.container.x = item.orbitX
        + (motion?.dx ?? 0)
        + personality.dx
        + nudge.x

      item.container.y = item.orbitY
        + (motion?.dy ?? 0)
        + personality.dy
        + nudge.y

      item.container.rotation = motion?.rotation ?? 0

      item.container.scale.set(
        item.orbitScale
        * (motion?.scaleMult ?? 1)
        * personality.scaleMult
        * heroScaleMult,
      )

      item.container.alpha = Math.min(1,
        item.orbitAlpha * luminance * trophyDim * heroAlphaMult,
      )

      const target = this.layerFor(item.orbitY)
      if (item.currentLayer !== target) {
        this.layerContainer(target).addChild(item.container)
        item.currentLayer = target
      }
    }
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

  private layerFor(itemY: number): OrbitLayer {
    return itemY >= this.config.layerSplit ? 'orbitFront' : 'orbitBack'
  }

  private layerContainer(layer: OrbitLayer): Container {
    return layer === 'orbitFront' ? this.frontLayer! : this.backLayer!
  }
}
