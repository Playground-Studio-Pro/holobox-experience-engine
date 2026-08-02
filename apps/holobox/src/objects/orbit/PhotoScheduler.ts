import { ShuffleBag } from '@/objects/memory/ShuffleBag'

export interface PhotoSchedulerConfig {
  /** Minimum seconds between texture swaps per slot. Default 18. */
  swapIntervalMin?: number
  /** Maximum seconds between texture swaps per slot. Default 34. */
  swapIntervalMax?: number
}

/**
 * Manages which photo texture appears in each orbit slot and when it changes.
 *
 * Replaces OrbitEngine's flat sequential pool + fixed cooldown with:
 *  - Per-slot random intervals (18–34 s by default)
 *  - ShuffleBag with history buffer (slotCount + 4) so the same player
 *    never appears at the end of one round and the start of the next
 *  - Swap deferred until the card reaches the back of the orbit (low alpha),
 *    so the transition is never visible to the viewer
 */
export class PhotoScheduler {
  private readonly bag: ShuffleBag<number>
  private readonly timers:  number[]   // seconds remaining until each slot wants a swap
  private readonly pending: boolean[]  // timer expired; swap queued for back-of-orbit
  private readonly visible: number[]   // current texture index per slot (−1 = unknown)
  private readonly intervalMin: number
  private readonly intervalMax: number

  constructor(textureCount: number, slotCount: number, config: PhotoSchedulerConfig = {}) {
    this.intervalMin = config.swapIntervalMin ?? 18
    this.intervalMax = config.swapIntervalMax ?? 34

    const historySize = slotCount + 4
    this.bag = new ShuffleBag(
      Array.from({ length: textureCount }, (_, i) => i),
      historySize,
    )

    // Spread first swaps across 1.5× the full interval (e.g. 18–69 s for an 18–34 s interval)
    // so all slots never change at once. After the first swap each slot picks a fresh
    // random interval and they drift into a natural, non-synchronized pattern.
    const firstWaveSpread = this.intervalMin + this.intervalMax  // e.g. 52 s
    this.timers = Array.from({ length: slotCount }, (_, i) =>
      this.intervalMin + (i / Math.max(slotCount - 1, 1)) * firstWaveSpread,
    )
    this.pending = Array(slotCount).fill(false)
    this.visible = Array(slotCount).fill(-1)
  }

  /**
   * Advance slot timer by dt seconds.
   * Returns true when the slot should swap right now
   * (timer has expired AND the card is at the back of the orbit).
   */
  tick(slotIndex: number, dt: number, atBack: boolean): boolean {
    if (!this.pending[slotIndex]) {
      this.timers[slotIndex] -= dt
      if (this.timers[slotIndex] <= 0) {
        this.pending[slotIndex] = true
      }
    }
    return this.pending[slotIndex] && atBack
  }

  /** Draw the next texture index, excluding all currently visible textures. */
  nextIndex(): number | null {
    const exclude = new Set(this.visible.filter((v) => v >= 0))
    return this.bag.next(exclude)
  }

  /** Record that slot i is now showing textureIndex. Resets its timer. */
  confirmSwap(slotIndex: number, textureIndex: number): void {
    this.visible[slotIndex] = textureIndex
    this.pending[slotIndex] = false
    this.timers[slotIndex]  =
      this.intervalMin + Math.random() * (this.intervalMax - this.intervalMin)
  }

  /** Assign initial texture index for a slot at mount time (no timer reset). */
  initSlot(slotIndex: number, textureIndex: number): void {
    this.visible[slotIndex] = textureIndex
  }

  /**
   * Returns the set of texture indices currently assigned to any orbit slot.
   * Used by external systems (e.g. ArchiveGhostLayer) to guarantee no texture
   * appears in two visible objects simultaneously.
   */
  getActiveSet(): Set<number> {
    return new Set(this.visible.filter((v) => v >= 0))
  }
}
