import { Container, Graphics } from 'pixi.js'
import type { ExclusionZone } from '../types'

export class DigitalMode {
  readonly container: Container

  constructor(zone: ExclusionZone) {
    this.container = new Container()
    this.container.label = 'mode:digital'
    this.build(zone)
  }

  private build(zone: ExclusionZone): void {
    const rx = zone.width / 2
    const ry = zone.height / 2

    const body = new Graphics()
    body.ellipse(0, 0, rx, ry)
    body.fill({ color: 0xffffff, alpha: 0.03 })
    body.stroke({ color: 0xffffff, width: 1, alpha: 0.12 })

    const crosshair = new Graphics()
    const size = 24
    crosshair.moveTo(-size, 0).lineTo(size, 0)
    crosshair.moveTo(0, -size).lineTo(0, size)
    crosshair.stroke({ color: 0xffffff, width: 1, alpha: 0.3 })

    this.container.addChild(body, crosshair)
  }

  destroy(): void {
    this.container.destroy({ children: true })
  }
}
