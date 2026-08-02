import type { Vec2, OrbitItemType } from '@/types'
import type { PlayerData } from '@/config/types'
import type { PhotoSchedulerConfig } from './PhotoScheduler'

export type { OrbitItemType }
export type { PlayerData }
export type { PhotoSchedulerConfig }

export type OrbitLayer = 'orbitBack' | 'orbitFront'

export interface OrbitEngineConfig {
  itemCount: number
  ellipseX: number
  ellipseY: number
  speed: number
  center: Vec2
  floatAmplitude: number
  floatFrequency: number
  slowMotionScale: number
  /**
   * Canvas-px Y threshold for front/back layer routing.
   * Items with orbitY >= layerSplit render in orbitFront (in front of the centerpiece).
   * Items with orbitY <  layerSplit render in orbitBack  (behind the centerpiece).
   * Derived from InstallationConfig.centerpiece.layerSplit × CANVAS_HEIGHT.
   */
  layerSplit: number
  /** When false, cards render photo-only with no footer text. Default true. */
  showCardFooter?: boolean
  /** Legacy flat photo list. Used when `players` is empty. */
  photos?: string[]
  /** Structured player data. Takes precedence over `photos` when non-empty. */
  players?: PlayerData[]
  /** Photo rotation timing. Omit to use defaults (18–34 s per slot). */
  scheduler?: PhotoSchedulerConfig
  /** Minimum alpha at the back of the orbit. Default 0.40. */
  minAlpha?: number
  /** Maximum alpha at the front of the orbit. Default 1.0. */
  maxAlpha?: number
  /** Minimum scale at the back of the orbit. Default 0.65. */
  minScale?: number
  /** Maximum scale at the front of the orbit. Default 1.0. */
  maxScale?: number
  /**
   * Custom starting angles (radians) for each card.
   * When provided, cards use these positions instead of uniform spacing.
   * Length should equal itemCount.
   */
  anchorAngles?: number[]
}
