import { Container } from 'pixi.js'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/config/defaults'
import { env } from '@/config/env'
import { PhysicalMode } from './modes/PhysicalMode'
import { DigitalMode } from './modes/DigitalMode'
import { SafeZone } from './dev/SafeZone'
import { Placeholder } from './dev/Placeholder'
import { Glorifier } from './dev/Glorifier'
import type {
  CenterPieceConfig,
  CenterPieceDevConfig,
  ExclusionZone,
  ResolvedCenterPieceConfig,
} from './types'

const DEFAULTS: ResolvedCenterPieceConfig = {
  mode: 'physical',
  position: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 },
  exclusionZone: { width: 400, height: 500 },
  dev: {
    showPlaceholder: env.isDev,
    showGlorifier: env.isDev,
    showSafeZone: env.isDev,
  },
}

export class CenterPiece {
  readonly container: Container
  private readonly config: ResolvedCenterPieceConfig
  private mode: PhysicalMode | DigitalMode | null = null
  private safeZone: SafeZone | null = null
  private placeholder: Placeholder | null = null
  private glorifier: Glorifier | null = null

  constructor(config: CenterPieceConfig) {
    this.config = this.resolve(config)

    this.container = new Container()
    this.container.label = 'centerpiece'
    this.container.x = this.config.position.x
    this.container.y = this.config.position.y

    this.buildMode()
    this.buildDevHelpers()
  }

  getExclusionZone(): ExclusionZone {
    return { ...this.config.exclusionZone }
  }

  setDevVisible(key: keyof CenterPieceDevConfig, visible: boolean): void {
    if (key === 'showSafeZone') this.safeZone?.setVisible(visible)
    if (key === 'showPlaceholder') this.placeholder?.setVisible(visible)
    if (key === 'showGlorifier') this.glorifier?.setVisible(visible)
  }

  mount(layer: Container): void {
    layer.addChild(this.container)
  }

  destroy(): void {
    this.safeZone?.destroy()
    this.placeholder?.destroy()
    this.glorifier?.destroy()
    this.mode?.destroy()
    this.container.destroy({ children: true })
  }

  private resolve(config: CenterPieceConfig): ResolvedCenterPieceConfig {
    return {
      mode: config.mode,
      position: config.position ?? DEFAULTS.position,
      exclusionZone: {
        width: config.exclusionZone?.width ?? DEFAULTS.exclusionZone.width,
        height: config.exclusionZone?.height ?? DEFAULTS.exclusionZone.height,
      },
      dev: {
        showPlaceholder: config.dev?.showPlaceholder ?? DEFAULTS.dev.showPlaceholder,
        showGlorifier: config.dev?.showGlorifier ?? DEFAULTS.dev.showGlorifier,
        showSafeZone: config.dev?.showSafeZone ?? DEFAULTS.dev.showSafeZone,
      },
    }
  }

  private buildMode(): void {
    const { mode, exclusionZone } = this.config
    this.mode =
      mode === 'physical' ? new PhysicalMode() : new DigitalMode(exclusionZone)
    this.container.addChild(this.mode.container)
  }

  private buildDevHelpers(): void {
    const { exclusionZone, dev } = this.config

    this.safeZone = new SafeZone(exclusionZone)
    this.placeholder = new Placeholder(exclusionZone)
    this.glorifier = new Glorifier(exclusionZone)

    this.safeZone.setVisible(dev.showSafeZone)
    this.placeholder.setVisible(dev.showPlaceholder)
    this.glorifier.setVisible(dev.showGlorifier)

    this.container.addChild(
      this.safeZone.container,
      this.placeholder.container,
      this.glorifier.container,
    )
  }
}
