import type { Vec2, CenterPieceMode } from '@/types'

export type { CenterPieceMode }

export interface ExclusionZone {
  width: number
  height: number
}

export interface CenterPieceDevConfig {
  showPlaceholder: boolean
  showGlorifier: boolean
  showSafeZone: boolean
}

export interface CenterPieceConfig {
  mode: CenterPieceMode
  model?: string
  position?: Vec2
  exclusionZone?: Partial<ExclusionZone>
  dev?: Partial<CenterPieceDevConfig>
}

export interface ResolvedCenterPieceConfig {
  mode: CenterPieceMode
  model: string | null
  position: Vec2
  exclusionZone: ExclusionZone
  dev: CenterPieceDevConfig
}
