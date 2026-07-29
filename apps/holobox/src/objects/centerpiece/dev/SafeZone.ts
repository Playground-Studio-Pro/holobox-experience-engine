import { Container, Graphics, Text } from 'pixi.js'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/config/defaults'
import type { ResolvedSafeZone } from '@/spatial'

const COLOR = 0x00ccff
const TICK = 18

export class SafeZone {
  readonly container: Container

  constructor(zone: ResolvedSafeZone) {
    this.container = new Container()
    this.container.label = 'dev:safe-zone'
    this.build(zone)
  }

  private build(zone: ResolvedSafeZone): void {
    // CenterPiece container is anchored at canvas center — convert absolute px to relative.
    const rx = zone.x - CANVAS_WIDTH / 2
    const ry = zone.y - CANVAS_HEIGHT / 2
    const w = zone.width
    const h = zone.height

    const fill = new Graphics()
    fill.rect(rx, ry, w, h)
    fill.fill({ color: COLOR, alpha: 0.04 })
    fill.stroke({ color: COLOR, width: 1, alpha: 0.35 })

    const ticks = new Graphics()
    ticks.moveTo(rx,     ry + TICK).lineTo(rx,     ry).lineTo(rx + TICK,     ry)
    ticks.moveTo(rx + w, ry + TICK).lineTo(rx + w, ry).lineTo(rx + w - TICK, ry)
    ticks.moveTo(rx + w, ry + h - TICK).lineTo(rx + w, ry + h).lineTo(rx + w - TICK, ry + h)
    ticks.moveTo(rx,     ry + h - TICK).lineTo(rx,     ry + h).lineTo(rx + TICK,     ry + h)
    ticks.stroke({ color: COLOR, width: 2, alpha: 0.8 })

    const label = new Text({
      text: 'SAFE ZONE',
      style: { fontFamily: 'monospace', fontSize: 11, fill: COLOR },
    })
    label.alpha = 0.6
    label.x = rx + 8
    label.y = ry + 6

    this.container.addChild(fill, ticks, label)
  }

  setVisible(visible: boolean): void {
    this.container.visible = visible
  }

  destroy(): void {
    this.container.destroy({ children: true })
  }
}
