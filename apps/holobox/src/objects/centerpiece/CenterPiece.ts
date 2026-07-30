import { Container } from 'pixi.js'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/config/defaults'
import { env } from '@/config/env'
import { resolveSafeZone } from '@/spatial'
import type { ResolvedSafeZone } from '@/spatial'
import { PhysicalMode } from './modes/PhysicalMode'
import { DigitalMode } from './modes/DigitalMode'
import { SafeZone } from './dev/SafeZone'
import { Placeholder } from './dev/Placeholder'
import { Glorifier } from './dev/Glorifier'
import type {
  CenterPieceConfig,
  CenterPieceDevConfig,
  CenterPieceMode,
  ResolvedCenterPieceConfig,
} from './types'

const DEFAULT_SAFE_ZONE_SHAPE = {
  shape: 'rect' as const,
  x: 0.25,
  y: 0.30,
  width: 0.50,
  height: 0.30,
}

const DEFAULTS: ResolvedCenterPieceConfig = {
  mode: 'physical',
  model: null,
  position: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 },
  safeZone: resolveSafeZone(DEFAULT_SAFE_ZONE_SHAPE, CANVAS_WIDTH, CANVAS_HEIGHT),
  dev: {
    showPlaceholder: env.isDev,
    showGlorifier: env.isDev,
    showSafeZone: env.isDev,
  },
}

export class CenterPiece {
  readonly container: Container
  private readonly config: ResolvedCenterPieceConfig
  private currentMode: CenterPieceMode
  private mode: PhysicalMode | DigitalMode | null = null
  private safeZoneOverlay: SafeZone | null = null
  private placeholder: Placeholder | null = null
  private glorifier: Glorifier | null = null

  constructor(config: CenterPieceConfig) {
    this.config = this.resolve(config)
    this.currentMode = this.config.mode

    this.container = new Container()
    this.container.label = 'centerpiece'
    this.container.x = this.config.position.x
    this.container.y = this.config.position.y

    this.buildMode()
    this.buildDevHelpers()
  }

  getMode(): CenterPieceMode {
    return this.currentMode
  }

  /** Toggle between physical and digital modes at runtime (dev shortcut). */
  setMode(mode: CenterPieceMode): void {
    if (this.currentMode === mode) return
    this.currentMode = mode

    if (this.mode) {
      this.container.removeChild(this.mode.container)
      this.mode.destroy()
    }

    // Rebuild at index 0 — before dev helper overlays
    this.mode = mode === 'physical'
      ? new PhysicalMode()
      : new DigitalMode(this.config.safeZone, this.config.model)

    this.container.addChildAt(this.mode.container, 0)
  }

  getSafeZone(): ResolvedSafeZone {
    return this.config.safeZone
  }

  setDevVisible(key: keyof CenterPieceDevConfig, visible: boolean): void {
    if (key === 'showSafeZone')    this.safeZoneOverlay?.setVisible(visible)
    if (key === 'showPlaceholder') this.placeholder?.setVisible(visible)
    if (key === 'showGlorifier')   this.glorifier?.setVisible(visible)
  }

  mount(layer: Container): void {
    layer.addChild(this.container)
  }

  destroy(): void {
    this.safeZoneOverlay?.destroy()
    this.placeholder?.destroy()
    this.glorifier?.destroy()
    this.mode?.destroy()
    this.container.destroy({ children: true })
  }

  private resolve(config: CenterPieceConfig): ResolvedCenterPieceConfig {
    const safeZoneShape = config.safeZone ?? DEFAULT_SAFE_ZONE_SHAPE
    return {
      mode: config.mode,
      model: config.model ?? DEFAULTS.model,
      position: config.position ?? DEFAULTS.position,
      safeZone: resolveSafeZone(safeZoneShape, CANVAS_WIDTH, CANVAS_HEIGHT),
      dev: {
        showPlaceholder: config.dev?.showPlaceholder ?? DEFAULTS.dev.showPlaceholder,
        showGlorifier: config.dev?.showGlorifier ?? DEFAULTS.dev.showGlorifier,
        showSafeZone: config.dev?.showSafeZone ?? DEFAULTS.dev.showSafeZone,
      },
    }
  }

  private buildMode(): void {
    this.mode = this.currentMode === 'physical'
      ? new PhysicalMode()
      : new DigitalMode(this.config.safeZone, this.config.model)
    this.container.addChild(this.mode.container)
  }

  private buildDevHelpers(): void {
    const { safeZone, dev } = this.config

    this.safeZoneOverlay = new SafeZone(safeZone)
    this.placeholder     = new Placeholder(safeZone)
    this.glorifier       = new Glorifier(safeZone)

    this.safeZoneOverlay.setVisible(dev.showSafeZone)
    this.placeholder.setVisible(dev.showPlaceholder)
    this.glorifier.setVisible(dev.showGlorifier)

    this.container.addChild(
      this.safeZoneOverlay.container,
      this.placeholder.container,
      this.glorifier.container,
    )
  }
}
