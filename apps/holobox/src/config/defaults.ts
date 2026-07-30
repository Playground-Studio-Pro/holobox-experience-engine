import type { ProjectConfig, InstallationConfig, DecorationsConfig } from './types'

export const DEFAULT_DECORATIONS: DecorationsConfig = {
  enabled: false,
}

export const CANVAS_WIDTH = 1080
export const CANVAS_HEIGHT = 1920
export const TARGET_FPS = 60

// ── Default installation profile ──────────────────────────────────────────────
// Used as the final fallback when installation.json is absent or incomplete.
// These values describe a generic centered physical object — not device-specific.

export const DEFAULT_INSTALLATION: InstallationConfig = {
  centerpiece: {
    safeZone: {
      shape: 'rect',
      x: 0.25,
      y: 0.30,
      width: 0.50,
      height: 0.30,
    },
    layerSplit: 0.50,
  },
}

// ── Default experience config ─────────────────────────────────────────────────

export const DEFAULT_CONFIG: ProjectConfig = {
  experience: 'default',
  version: '0.1.0',
  name: 'Holobox',
  centerpiece: {
    mode: 'physical',
    safeZone: DEFAULT_INSTALLATION.centerpiece!.safeZone,
    layerSplit: DEFAULT_INSTALLATION.centerpiece!.layerSplit,
    dev: {
      showPlaceholder: true,
      showGlorifier: true,
      showSafeZone: true,
    },
  },
  orbit: {
    itemCount: 8,
    ellipseX: 420,
    ellipseY: 280,
    showCardFooter: true,
  },
  theme: {
    primaryColor: '#ffffff',
    accentColor: '#d4af37',
    backgroundColor: '#000000',
  },
  motion: {
    orbitSpeed: 0.3,
    floatAmplitude: 8,
    floatFrequency: 0.4,
    slowMotionScale: 0.15,
  },
  interaction: {
    focusTimeoutMs: 5000,
  },
  gallery: {
    targetX: CANVAS_WIDTH / 2,
    targetY: 380,
    targetScale: 3.0,
    closeButtonY: 730,
  },
  assets: {
    photos: [],
    players: [],
  },
  decorations: DEFAULT_DECORATIONS,
}
