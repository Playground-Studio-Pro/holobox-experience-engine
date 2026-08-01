/**
 * Ensures every item in a collection is drawn once before any repeats.
 * Reshuffles only after the pool is exhausted.
 * Items can be excluded per draw (e.g., currently visible on screen).
 */
export class ShuffleBag<T> {
  private readonly source: T[]
  private pool: T[]

  constructor(items: T[]) {
    this.source = [...items]
    this.pool   = []
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

    // Find first pool item not currently visible
    const idx = this.pool.findIndex((item) => !skip.has(item))

    if (idx !== -1) {
      const [item] = this.pool.splice(idx, 1)
      if (this.pool.length === 0) this.refill()
      return item
    }

    // All pool items are excluded (more slots than players). Take any.
    const item = this.pool.shift()!
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
  }
}
