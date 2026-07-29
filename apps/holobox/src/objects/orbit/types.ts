import type { Vec2, OrbitItemType } from '@/types'
import type { PlayerData } from '@/config/types'

export type { OrbitItemType }
export type { PlayerData }

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
}
