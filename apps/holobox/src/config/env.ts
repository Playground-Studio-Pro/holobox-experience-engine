import { CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_FPS } from './defaults'

export const env = {
  appName: import.meta.env.VITE_APP_NAME ?? 'Holobox Experience Engine',
  appVersion: import.meta.env.VITE_APP_VERSION ?? '0.1.0',
  canvasWidth: Number(import.meta.env.VITE_CANVAS_WIDTH) || CANVAS_WIDTH,
  canvasHeight: Number(import.meta.env.VITE_CANVAS_HEIGHT) || CANVAS_HEIGHT,
  targetFps: Number(import.meta.env.VITE_TARGET_FPS) || TARGET_FPS,
  isDev: import.meta.env.DEV,
} as const
