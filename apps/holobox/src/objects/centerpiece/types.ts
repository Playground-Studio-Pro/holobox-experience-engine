import type { Vec2, CenterPieceMode } from '@/types'
import type { SafeZoneShape, ResolvedSafeZone } from '@/spatial'

export type { CenterPieceMode }
export type { ResolvedSafeZone }

export interface CenterPieceDevConfig {
  showPlaceholder: boolean
  showGlorifier: boolean
  showSafeZone: boolean
}

export interface CenterPieceConfig {
  mode: CenterPieceMode
  model?: string
  position?: Vec2
  safeZone?: SafeZoneShape
  layerSplit?: number
  dev?: Partial<CenterPieceDevConfig>
}

export interface ResolvedCenterPieceConfig {
  mode: CenterPieceMode
  model: string | null
  position: Vec2
  safeZone: ResolvedSafeZone
  dev: CenterPieceDevConfig
}
