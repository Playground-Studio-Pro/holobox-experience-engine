import { Container, Graphics } from 'pixi.js'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/config/defaults'
import type { ResolvedSafeZone } from '@/spatial'

export class DigitalMode {
  readonly container: Container

  constructor(zone: ResolvedSafeZone) {
    this.container = new Container()
    this.container.label = 'mode:digital'
    this.build(zone)
  }

  private build(zone: ResolvedSafeZone): void {
    // CenterPiece container is anchored at canvas center — convert to relative.
    const rcx = zone.cx - CANVAS_WIDTH / 2
    const rcy = zone.cy - CANVAS_HEIGHT / 2
    const rx  = zone.width / 2
    const ry  = zone.height / 2

    const body = new Graphics()
    body.ellipse(rcx, rcy, rx, ry)
    body.fill({ color: 0xffffff, alpha: 0.03 })
    body.stroke({ color: 0xffffff, width: 1, alpha: 0.12 })

    const size = 24
    const crosshair = new Graphics()
    crosshair.moveTo(rcx - size, rcy).lineTo(rcx + size, rcy)
    crosshair.moveTo(rcx, rcy - size).lineTo(rcx, rcy + size)
    crosshair.stroke({ color: 0xffffff, width: 1, alpha: 0.3 })

    this.container.addChild(body, crosshair)
  }

  destroy(): void {
    this.container.destroy({ children: true })
  }
}
