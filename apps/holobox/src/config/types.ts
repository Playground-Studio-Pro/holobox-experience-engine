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
  /** Canvas Y coordinate for the orbit center. Defaults to CANVAS_HEIGHT / 2. */
  centerY?: number
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
  /** URL to a PNG or SVG asset */
  asset?: string
  /** 0–1 opacity. Default 1. */
  opacity?: number
  /** Y offset from the anchor point, in canvas coordinates. Default 0. */
  offsetY?: number
  /** Uniform scale. Default 1. */
  scale?: number
}

export interface DecorationsConfig {
  enabled: boolean
  /** Top decoration — anchored to the top edge of the canvas */
  top?: DecorationItemConfig
  /** Bottom decoration — anchored to the bottom edge of the canvas */
  bottom?: DecorationItemConfig
}

/** Exhibition typography rendered at the bottom-left of the canvas. */
export interface FooterConfig {
  /** Small label above the name — e.g. event category or status. */
  label?: string
  /** Primary name line — large, prominent. */
  name?: string
  /** Supporting metadata below the name — e.g. tour / event name. */
  meta?: string
  /** Canvas X for the left edge of the text block. Default 60. */
  x?: number
  /** Canvas Y for the baseline of the meta line. Default CANVAS_HEIGHT - 100. */
  y?: number
}

// ── Editorial Composition ─────────────────────────────────────────────────────

/** A single curated photo slot in the editorial composition. */
export interface CompositionSlotConfig {
  /** Human-readable identifier — "hero", "supporting-a", "ghost-1", etc. */
  label?: string
  /** Index into assets.players[]. -1 skips texture load. */
  playerIndex: number
  /** Canvas X center of the slot */
  x: number
  /** Canvas Y center of the slot */
  y: number
  /** Photo display width in canvas px */
  width: number
  /** Photo display height in canvas px */
  height: number
  /** Corner radius. Default 14. */
  radius?: number
  /** Opacity: 1.0 for hero, ~0.15 for ghost. */
  alpha: number
  /** Per-slot blur strength. 0 or absent = no blur. */
  blur?: number
  /** Scene layer: 'back' = orbitBack (behind trophy), 'front' = orbitFront. Default 'front'. */
  layer?: 'back' | 'front'
}

export interface CompositionEllipseConfig {
  /** Canvas X center */
  cx: number
  /** Canvas Y center */
  cy: number
  /** X radius */
  rx: number
  /** Y radius */
  ry: number
  /** Stroke color — CSS hex string ("#rrggbb") or 0xrrggbb number */
  color?: string | number
  /** Stroke alpha. Default 0.18. */
  alpha?: number
  /** Stroke width in canvas px. Default 1. */
  lineWidth?: number
}

export interface EditorialCompositionConfig {
  enabled: boolean
  /** Curated photo slots (hero, supporting, ghost, etc.) */
  slots: CompositionSlotConfig[]
  /** Optional decorative orbit-path ellipse drawn on orbitBack */
  ellipse?: CompositionEllipseConfig
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
  footer?: FooterConfig
  composition?: EditorialCompositionConfig
}
