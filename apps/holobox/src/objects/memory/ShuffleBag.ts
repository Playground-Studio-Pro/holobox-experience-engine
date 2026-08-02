/**
 * Ensures every item in a collection is drawn once before any repeats.
 * Reshuffles only after the pool is exhausted.
 * Items can be excluded per draw (e.g., currently visible on screen).
 *
 * When historySize > 0, items drawn at the tail of one round are pushed
 * away from the head of the next round, preventing the same item from
 * appearing twice in quick succession across round boundaries.
 */
export class ShuffleBag<T> {
  private readonly source: T[]
  private pool: T[]
  private readonly historySize: number
  private recentlyDrawn: T[] = []

  constructor(items: T[], historySize = 0) {
    this.source      = [...items]
    this.historySize = historySize
    this.pool        = []
    this.refill()
  }

  /**
   * Draw the next item, skipping anything in `exclude`.
   * If every remaining pool item is excluded, draws the least-recently-seen
   * excluded item rather than blocking indefinitely.
   * Returns null only when the source is empty.
   */
  next(exclude?: Set<T>): T | null {
    if (this.source.length === 0) return null

    const skip = exclude ?? new Set<T>()
    let idx = this.pool.findIndex((item) => !skip.has(item))

    if (idx === -1) {
      // Pool is exhausted of non-excluded items — refill early and try again.
      // This prevents returning a currently-visible item as the "deadlock escape",
      // which would create a duplicate on screen.
      this.refill()
      idx = this.pool.findIndex((item) => !skip.has(item))
    }

    let item: T
    if (idx !== -1) {
      ;[item] = this.pool.splice(idx, 1)
    } else {
      // Truly impossible to avoid a duplicate (source.length <= exclude.size).
      // Take front as last resort so the system doesn't stall.
      item = this.pool.shift()!
    }

    if (this.historySize > 0) {
      this.recentlyDrawn.push(item)
      if (this.recentlyDrawn.length > this.historySize) this.recentlyDrawn.shift()
    }

    if (this.pool.length === 0) this.refill()
    return item
  }

  get remaining(): number {
    return this.pool.length
  }

  private refill(): void {
    this.pool = [...this.source]
    // Fisher–Yates shuffle
    for (let i = this.pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[this.pool[i], this.pool[j]] = [this.pool[j], this.pool[i]]
    }

    // Push history items away from the front of the new round so a player
    // that just appeared at the end of round N doesn't lead round N+1.
    if (this.recentlyDrawn.length > 0 && this.pool.length > this.recentlyDrawn.length) {
      const histSet = new Set(this.recentlyDrawn)
      const guard   = Math.min(this.recentlyDrawn.length, Math.floor(this.pool.length / 2))
      for (let i = 0; i < guard; i++) {
        if (histSet.has(this.pool[i])) {
          for (let j = guard; j < this.pool.length; j++) {
            if (!histSet.has(this.pool[j])) {
              ;[this.pool[i], this.pool[j]] = [this.pool[j], this.pool[i]]
              break
            }
          }
        }
      }
    }
  }
}
