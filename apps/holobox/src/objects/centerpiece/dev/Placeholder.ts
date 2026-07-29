import { Container, Graphics, Text } from 'pixi.js'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/config/defaults'
import type { ResolvedSafeZone } from '@/spatial'

const COLOR = 0x888888

export class Placeholder {
  readonly container: Container

  constructor(zone: ResolvedSafeZone) {
    this.container = new Container()
    this.container.label = 'dev:placeholder'
    this.build(zone)
  }

  private build(zone: ResolvedSafeZone): void {
    // CenterPiece container is anchored at canvas center — convert absolute px to relative.
    const rx = zone.x - CANVAS_WIDTH / 2
    const ry = zone.y - CANVAS_HEIGHT / 2
    const w = zone.width
    const h = zone.height

    const outline = new Graphics()
    outline.rect(rx, ry, w, h)
    outline.stroke({ color: COLOR, width: 1, alpha: 0.3 })

    const cross = new Graphics()
    cross.moveTo(rx, ry).lineTo(rx + w, ry + h)
    cross.moveTo(rx + w, ry).lineTo(rx, ry + h)
    cross.stroke({ color: COLOR, width: 1, alpha: 0.15 })

    const label = new Text({
      text: 'PLACEHOLDER',
      style: { fontFamily: 'monospace', fontSize: 11, fill: COLOR },
    })
    label.alpha = 0.5
    label.anchor.set(0.5)
    label.x = rx + w / 2
    label.y = ry + 20

    this.container.addChild(outline, cross, label)
  }

  setVisible(visible: boolean): void {
    this.container.visible = visible
  }

  destroy(): void {
    this.container.destroy({ children: true })
  }
}
