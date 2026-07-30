import type { CenterPieceMode } from '@/types'
import type { SafeZoneShape } from '@/spatial'

// ── Installation Profile ──────────────────────────────────────────────────────
// Describes the physical Holobox installation — device geometry and object
// placement. Lives in installation.json, separate from any experience.
// Multiple experiences deployed on the same device share this file.

export interface InstallationConfig {
  centerpiece?: {
    /** Occupied screen region of the physical or digital object. Normalized 0–1. */
    safeZone?: SafeZoneShape
    /** Normalized Y (0–1) below which orbit items render in front of the centerpiece. */
    layerSplit?: number
  }
}

// ── Experience Configuration ──────────────────────────────────────────────────

export interface CenterPieceConfig {
  mode: CenterPieceMode
  model?: string
  /** Occupied screen region. Normalized 0–1. Typically comes from installation.json. */
  safeZone?: SafeZoneShape
  /** Normalized Y split for front/back orbit layer routing. Typically from installation.json. */
  layerSplit?: number
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
  /** When false, the card renders photo-only: no name, country, score, or footer background. Default true. */
  showCardFooter?: boolean
}

export interface ThemeConfig {
  primaryColor: string
  accentColor: string
  backgroundColor: string
}

export interface MotionProfile {
  orbitSpeed: number
  floatAmplitude: number
  floatFrequency: number
  slowMotionScale: number
}

export interface InteractionConfig {
  focusTimeoutMs: number
}

export interface GalleryConfig {
  targetX: number
  targetY: number
  targetScale: number
  /** Y position of the close button in canvas coordinates. Defaults to targetY + 350. */
  closeButtonY?: number
}

/**
 * Data contract for a media item in the content pipeline.
 * mediaType defaults to 'photo' when absent.
 * All display fields are optional so the card degrades gracefully with partial data.
 */
export interface PlayerData {
  /** 'photo' (default) or 'video'. Controls orbit texture loading and future rendering. */
  mediaType?: 'photo' | 'video'
  /** Display name */
  name?: string
  /** Country name or ISO 3166-1 alpha-2 code */
  country?: string
  /** Tournament rank */
  rank?: number
  /** Score display string, e.g. "-12" or "E" */
  score?: string
  /** Photo asset URL — used for orbit texture and gallery thumbnail */
  photoUrl?: string
  /** Video asset URL — reserved for future video rendering support */
  videoUrl?: string
}

export interface AssetsConfig {
  /** Legacy flat photo list. Prefer `players` for new experiences. */
  photos: string[]
  /** Structured media items (photos and videos). Takes precedence over `photos` when non-empty. */
  players?: PlayerData[]
}

// ── Scene Decorations ──────────────────────────────────────────────────────────

export interface DecorationItemConfig {
  /** URL to an SVG or PNG asset (optional — band is drawn programmatically when absent) */
  asset?: string
  /** 0–1 opacity. Default 1. */
  opacity?: number
  /** Y offset from the anchor point, in canvas coordinates. Default 0. */
  offsetY?: number
  /** Uniform scale. Default 1. */
  scale?: number
  /** Primary display text drawn programmatically on the band */
  title?: string
  /** Secondary text drawn below title */
  subtitle?: string
}

export interface DecorationsConfig {
  enabled: boolean
  /** Top decoration — anchored to the top edge of the canvas */
  top?: DecorationItemConfig
  /** Bottom decoration — anchored to the bottom edge of the canvas */
  bottom?: DecorationItemConfig
}

export interface ProjectConfig {
  experience: string
  version: string
  name: string
  centerpiece: CenterPieceConfig
  orbit: OrbitConfig
  theme?: ThemeConfig
  motion?: MotionProfile
  interaction?: InteractionConfig
  gallery?: GalleryConfig
  assets?: AssetsConfig
  decorations?: DecorationsConfig
}
