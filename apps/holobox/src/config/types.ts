import type { CenterPieceMode } from '@/types'

export interface CenterPieceConfig {
  mode: CenterPieceMode
  exclusionZone?: {
    width?: number
    height?: number
  }
  dev?: {
    showPlaceholder?: boolean
    showGlorifier?: boolean
    showSafeZone?: boolean
  }
}

export interface OrbitConfig {
  itemCount: number
  ellipseX?: number
  ellipseY?: number
}

export interface ThemeConfig {
  primaryColor: string
  accentColor: string
  backgroundColor: string
}

export interface MotionProfile {
  orbitSpeed: number
  floatAmplitude: number
  pulseFrequency: number
}

export interface ProjectConfig {
  experience: string
  version: string
  name: string
  centerpiece: CenterPieceConfig
  orbit: OrbitConfig
  theme?: ThemeConfig
  motion?: MotionProfile
}
