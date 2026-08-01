import { Container, Sprite, Assets } from 'pixi.js'
import type { Texture } from 'pixi.js'
import { gsap } from 'gsap'
import type { CompositionSlotConfig, LivingMemoryConfig, PlayerData } from '@/config/types'
import type { FloatingMotionSystem } from '@/objects/motion/FloatingMotionSystem'
import { ShuffleBag } from './ShuffleBag'
import { lerp } from '@/utils'
import { CANVAS_WIDTH } from '@/config/defaults'

const STAGE_CX = CANVAS_WIDTH / 2

function depthScale(depth: number): number {
  return lerp(0.65, 1.0, depth)
}

// Per-group transition duration multipliers (applied to config.transitionDuration)
// Ghost: fast — they're previews, always changing, barely noticed
// Supporting: medium — discovered on second look
// Hero: slow — a quiet revelation, felt more than watched
const GROUP_DUR_MULT: Record<SlotGroup, number> = {
  ghost:      0.68,
  supporting: 1.30,
  hero:       2.10,
}

// Scale range during transition — very small delta so the change is atmospheric
const EXIT_SCALE_RATIO  = 0.91  // shrink to 91% while fading (9% is barely visible)
const ENTRY_SCALE_START = 0.91  // emerge from same scale as exit

// Positional drift toward trophy — small enough to be subliminal
const ENTRY_OFFSET_PX = 14  // px from trophy direction at entry start
const EXIT_OFFSET_PX  = 8   // px drift away from trophy on exit

// Easing — sine gives the most organic, gradual, never-mechanical feel
const EXIT_EASE_POS   = 'sine.in'
const EXIT_EASE_ALPHA = 'sine.in'
const EXIT_EASE_SCALE = 'sine.in'
const ENTER_EASE_POS  = 'sine.out'
const ENTER_EASE_ALPHA = 'sine.out'
const ENTER_EASE_SCALE = 'sine.out'

type SlotGroup = 'hero' | 'supporting' | 'ghost'

interface ManagedSlot {
  idx:                number
  group:              SlotGroup
  container:          Container
  slot:               CompositionSlotConfig
  baseScale:          number
  currentPlayerIndex: number
  timer:              ReturnType<typeof setTimeout> | null
  transitioning:      boolean
  towardCenterX:      number
  towardCenterY:      number
}

/**
 * Continuously rotates photographs through editorial composition slots.
 *
 * The goal is that observers discover photographs have changed —
 * never that they watch them change.
 *
 * Transitions are atmospheric: very subtle scale and position shifts
 * with sine easing. Durations are depth-group dependent:
 *   Ghost → 68% of base (fast preview cycling)
 *   Supporting → 130% of base (graceful)
 *   Hero → 210% of base (quiet revelation)
 *
 * pause() / resume() preserve exact queue state across focus sessions.
 */
export class LivingMemorySystem {
  private readonly managedSlots: ManagedSlot[]
  private readonly bag:          ShuffleBag<number>
  private readonly baseDur:      number
  private paused    = false
  private destroyed = false

  constructor(
    containers:          Container[],
    slots:               CompositionSlotConfig[],
    private readonly players:  PlayerData[],
    private readonly floating: FloatingMotionSystem,
    private readonly config:   LivingMemoryConfig,
    orbitCenterY:        number,
  ) {
    const playerIndices = players.map((_, i) => i)
    this.bag    = new ShuffleBag(playerIndices)
    this.baseDur = config.transitionDuration ?? 1.0

    this.managedSlots = slots.map((slot, i) => {
      const group: SlotGroup = slot.label === 'hero'
        ? 'hero'
        : slot.blur ? 'ghost' : 'supporting'

      const dx  = STAGE_CX    - slot.x
      const dy  = orbitCenterY - slot.y
      const len = Math.sqrt(dx * dx + dy * dy)

      return {
        idx:                i,
        group,
        container:          containers[i],
        slot,
        baseScale:          depthScale(slot.depth ?? 0.5),
        currentPlayerIndex: slot.playerIndex,
        timer:              null,
        transitioning:      false,
        towardCenterX:      len > 0 ? dx / len : 0,
        towardCenterY:      len > 0 ? dy / len : 0,
      }
    })
  }

  mount(): void {
    if (!this.config.enabled) return

    // Pre-load all player textures so transitions never wait on a network fetch
    for (const player of this.players) {
      if (player.photoUrl) {
        Assets.load(player.photoUrl).catch(() => { /* silent */ })
      }
    }

    for (const ms of this.managedSlots) {
      this.scheduleNext(ms)
    }
  }

  pause(): void {
    if (this.paused) return
    this.paused = true
    for (const ms of this.managedSlots) {
      if (ms.timer !== null) { clearTimeout(ms.timer); ms.timer = null }
    }
  }

  resume(): void {
    if (!this.config.enabled || !this.paused) return
    this.paused = false
    for (const ms of this.managedSlots) {
      if (!ms.transitioning) this.scheduleNext(ms)
    }
  }

  destroy(): void {
    this.destroyed = true
    this.pause()
    for (const ms of this.managedSlots) {
      gsap.killTweensOf(ms.container)
      gsap.killTweensOf(ms.container.scale)
      const proxy = this.floating.getBaseProxy(ms.container)
      if (proxy) gsap.killTweensOf(proxy)
    }
    this.managedSlots.length = 0
  }

  // ── Private ────────────────────────────────────────────────────────────────

  private scheduleNext(ms: ManagedSlot): void {
    if (this.paused || this.destroyed) return
    const interval = this.randomInterval(ms.group)
    ms.timer = setTimeout(() => {
      ms.timer = null
      if (!this.paused && !this.destroyed) this.replacePhoto(ms)
    }, interval * 1000)
  }

  private randomInterval(group: SlotGroup): number {
    const { min, max } = group === 'hero'
      ? this.config.heroInterval
      : group === 'supporting'
        ? this.config.supportInterval
        : this.config.ghostInterval
    return min + Math.random() * (max - min)
  }

  private visibleIndices(): Set<number> {
    return new Set(this.managedSlots.map((ms) => ms.currentPlayerIndex))
  }

  private replacePhoto(ms: ManagedSlot): void {
    if (ms.transitioning || this.paused || this.destroyed) return

    const nextIndex = this.bag.next(this.visibleIndices())
    if (nextIndex === null) return

    ms.currentPlayerIndex = nextIndex
    ms.transitioning      = true

    const player = this.players[nextIndex]
    if (!player?.photoUrl) { ms.transitioning = false; this.scheduleNext(ms); return }

    Assets.load<Texture>(player.photoUrl)
      .then((texture) => {
        if (this.paused || this.destroyed) { ms.transitioning = false; return }
        this.runTransition(ms, texture, () => { ms.transitioning = false; this.scheduleNext(ms) })
      })
      .catch(() => { ms.transitioning = false; this.scheduleNext(ms) })
  }

  private runTransition(ms: ManagedSlot, texture: Texture, onComplete: () => void): void {
    const { container, slot, baseScale, towardCenterX, towardCenterY } = ms
    const proxy = this.floating.getBaseProxy(container)

    const totalDur = this.baseDur * GROUP_DUR_MULT[ms.group]
    const exitDur  = totalDur * 0.42
    const enterDur = totalDur * 0.58

    // ── Exit: barely moves — fades and drifts away from trophy ───────────────
    if (proxy) {
      gsap.to(proxy, {
        baseX: slot.x - towardCenterX * EXIT_OFFSET_PX,
        baseY: slot.y - towardCenterY * EXIT_OFFSET_PX,
        duration: exitDur, ease: EXIT_EASE_POS, overwrite: true,
      })
    }
    gsap.to(container, { alpha: 0, duration: exitDur, ease: EXIT_EASE_ALPHA, overwrite: true })
    gsap.to(container.scale, {
      x: baseScale * EXIT_SCALE_RATIO, y: baseScale * EXIT_SCALE_RATIO,
      duration: exitDur, ease: EXIT_EASE_SCALE, overwrite: true,
      onComplete: () => {
        if (this.paused || this.destroyed) {
          // Aborted mid-transition — snap container back to valid idle state
          if (!this.destroyed) {
            container.alpha = slot.alpha
            container.scale.set(baseScale)
            if (proxy) { proxy.baseX = slot.x; proxy.baseY = slot.y }
          }
          ms.transitioning = false
          return
        }

        // ── Swap ────────────────────────────────────────────────────────────
        this.swapTexture(container, slot, texture)

        // ── Enter: drifts in from trophy direction ─────────────────────────
        if (proxy) {
          proxy.baseX = slot.x + towardCenterX * ENTRY_OFFSET_PX
          proxy.baseY = slot.y + towardCenterY * ENTRY_OFFSET_PX
        }
        container.scale.set(baseScale * ENTRY_SCALE_START)
        container.alpha = 0

        if (proxy) {
          gsap.to(proxy, { baseX: slot.x, baseY: slot.y, duration: enterDur, ease: ENTER_EASE_POS, overwrite: true })
        }
        gsap.to(container, { alpha: slot.alpha, duration: enterDur, ease: ENTER_EASE_ALPHA, overwrite: true })
        gsap.to(container.scale, {
          x: baseScale, y: baseScale,
          duration: enterDur, ease: ENTER_EASE_SCALE, overwrite: true,
          onComplete,
        })
      },
    })
  }

  /**
   * Swap sprite texture without recreating any objects.
   * Navigates the fixed CompositionPhoto + injectShadow child hierarchy:
   *   Non-ghost: container → [shadowCt, photoContainer → [mask, sprite]]
   *   Ghost:     container → [photoContainer → [mask, sprite]]
   */
  private swapTexture(container: Container, slot: CompositionSlotConfig, texture: Texture): void {
    const photoContainerIdx = slot.blur ? 0 : 1
    const photoContainer = container.children[photoContainerIdx] as Container | undefined
    if (!photoContainer) return

    const sprite = photoContainer.children[1]
    if (!sprite || !(sprite instanceof Sprite)) return

    sprite.texture = texture
    sprite.scale.set(Math.max(slot.width / texture.width, slot.height / texture.height))
  }
}
