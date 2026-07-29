import type { ProjectConfig } from './types'

export const CANVAS_WIDTH = 1080
export const CANVAS_HEIGHT = 1920
export const TARGET_FPS = 60

export const DEFAULT_CONFIG: ProjectConfig = {
  experience: 'default',
  version: '0.1.0',
  name: 'Holobox',
  centerpiece: {
    mode: 'physical',
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
  },
  theme: {
    primaryColor: '#ffffff',
    accentColor: '#d4af37',
    backgroundColor: '#000000',
  },
  motion: {
    orbitSpeed: 0.3,
    floatAmplitude: 8,
    pulseFrequency: 0.5,
  },
}
