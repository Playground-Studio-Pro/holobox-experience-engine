import { Container, Sprite, Assets } from 'pixi.js'
import type { Texture } from 'pixi.js'
import { gsap } from 'gsap'
import type { CompositionSlotConfig, LivingMemoryConfig, PlayerData } from '@/config/types'
import type { FloatingMotionSystem } from '@/objects/motion/FloatingMotionSystem'
import { ShuffleBag } from './ShuffleBag'
import { lerp } from '@/utils'
import { CANVAS_WIDTH } from '@/config/defaults'

// Horizontal center of the display — trophy origin
const STAGE_CX = CANVAS_WIDTH / 2

// Depth scale formula — mirrors useAmbientMotion's scale assignment
function depthScale(depth: number): number {
  return lerp(0.65, 1.0, depth)
}

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
  // direction vector from slot toward stage center (normalized)
  towardCenterX:      number
  towardCenterY:      number
}

/**
 * Continuously rotates photographs through editorial composition slots.
 *
 * - Ghost slots cycle fastest (8–12 s), supporting mid (15–20 s), hero slowest (60–90 s).
 * - ShuffleBag guarantees every player appears before any repeats.
 * - Visible player indices are never reassigned to another slot simultaneously.
 * - Transitions animate alpha + scale (exit shrinks, enter grows from trophy direction).
 * - pause() / resume() stop/restart scheduling without losing queue state.
 *
 * Does not know anything about golf. Operates on any PlayerData collection.
 */
export class LivingMemorySystem {
  private readonly managedSlots: ManagedSlot[]
  private readonly bag: ShuffleBag<number>
  private readonly exitDur:  number
  private readonly enterDur: number
  private paused   = false
  private destroyed = false

  constructor(
    containers:          Container[],
    slots:                 CompositionSlotConfig[],
    private readonly players:  PlayerData[],
    private readonly floating: FloatingMotionSystem,
    private readonly config:   LivingMemoryConfig,
    orbitCenterY:        number,
  ) {
    const playerIndices = players.map((_, i) => i)
    this.bag = new ShuffleBag(playerIndices)

    const totalDur = config.transitionDuration ?? 0.9
    this.exitDur  = totalDur * 0.42
    this.enterDur = totalDur * 0.58

    this.managedSlots = slots.map((slot, i) => {
      const group: SlotGroup = slot.label === 'hero'
        ? 'hero'
        : slot.blur ? 'ghost' : 'supporting'

      const dx  = STAGE_CX  - slot.x
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

    // Kick off background texture loading for all players so transitions never stall
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
      if (ms.timer !== null) {
        clearTimeout(ms.timer)
        ms.timer = null
      }
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

    // Claim this index immediately so no other slot draws it concurrently
    ms.currentPlayerIndex = nextIndex
    ms.transitioning      = true

    const player = this.players[nextIndex]
    if (!player?.photoUrl) {
      ms.transitioning = false
      this.scheduleNext(ms)
      return
    }

    Assets.load<Texture>(player.photoUrl)
      .then((texture) => {
        if (this.paused || this.destroyed) {
          // Paused during load — abort cleanly; restore slot to idle state
          ms.transitioning = false
          return
        }
        this.runTransition(ms, texture, () => {
          ms.transitioning = false
          this.scheduleNext(ms)
        })
      })
      .catch(() => {
        ms.transitioning = false
        this.scheduleNext(ms)
      })
  }

  private runTransition(ms: ManagedSlot, texture: Texture, onComplete: () => void): void {
    const { container, slot, baseScale, towardCenterX, towardCenterY } = ms
    const proxy   = this.floating.getBaseProxy(container)

    // How far toward trophy center the entry starts (pixels in slot local space)
    const ENTRY_PX = 32
    const EXIT_PX  = 18

    // ── Exit: shrink toward trophy center while fading ────────────────────────
    if (proxy) {
      gsap.to(proxy, {
        baseX: slot.x - towardCenterX * EXIT_PX,
        baseY: slot.y - towardCenterY * EXIT_PX,
        duration: this.exitDur, ease: 'power2.in', overwrite: true,
      })
    }
    gsap.to(container, {
      alpha: 0,
      duration: this.exitDur, ease: 'power2.in', overwrite: true,
    })
    gsap.to(container.scale, {
      x: baseScale * 0.74, y: baseScale * 0.74,
      duration: this.exitDur, ease: 'power2.in', overwrite: true,
      onComplete: () => {
        if (this.destroyed) return

        // ── Swap texture ────────────────────────────────────────────────────
        this.swapTexture(container, slot, texture)

        // ── Enter: emerge from trophy direction ─────────────────────────────
        if (proxy) {
          proxy.baseX = slot.x + towardCenterX * ENTRY_PX
          proxy.baseY = slot.y + towardCenterY * ENTRY_PX
        }
        container.scale.set(baseScale * 0.74)
        container.alpha = 0

        if (proxy) {
          gsap.to(proxy, {
            baseX: slot.x, baseY: slot.y,
            duration: this.enterDur, ease: 'power2.out', overwrite: true,
          })
        }
        gsap.to(container, {
          alpha: slot.alpha,
          duration: this.enterDur, ease: 'power2.out', overwrite: true,
        })
        gsap.to(container.scale, {
          x: baseScale, y: baseScale,
          duration: this.enterDur, ease: 'back.out(1.04)', overwrite: true,
          onComplete,
        })
      },
    })
  }

  /**
   * Swap the sprite texture inside a composition photo container.
   *
   * Child hierarchy (set by CompositionPhoto + injectShadow in useAmbientMotion):
   *   Non-ghost: container → [shadowCt, photoContainer → [mask, sprite]]
   *   Ghost:     container → [photoContainer → [mask, sprite]]
   *
   * Ghost detection: slot.blur is truthy ↔ no shadow was injected.
   */
  private swapTexture(container: Container, slot: CompositionSlotConfig, texture: Texture): void {
    const photoContainerIdx = slot.blur ? 0 : 1
    const photoContainer = container.children[photoContainerIdx] as Container | undefined
    if (!photoContainer) return

    // Sprite lives at index 1, after the mask Graphics at index 0
    const sprite = photoContainer.children[1]
    if (!sprite || !(sprite instanceof Sprite)) return

    const coverScale = Math.max(slot.width / texture.width, slot.height / texture.height)
    sprite.texture = texture
    sprite.scale.set(coverScale)
  }
}
