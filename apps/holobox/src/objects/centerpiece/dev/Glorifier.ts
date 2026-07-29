import { Container, Graphics, Text } from 'pixi.js'
import type { ExclusionZone } from '../types'

const COLOR = 0x4466ff
const GAP = 10
const HEIGHT = 64
const TOP_WIDTH_RATIO = 0.7

export class Glorifier {
  readonly container: Container

  constructor(zone: ExclusionZone) {
    this.container = new Container()
    this.container.label = 'dev:glorifier'
    this.build(zone)
  }

  private build(zone: ExclusionZone): void {
    const y0 = zone.height / 2 + GAP
    const y1 = y0 + HEIGHT
    const tw = (zone.width * TOP_WIDTH_RATIO) / 2
    const bw = zone.width / 2

    const pedestal = new Graphics()
    pedestal.poly([-tw, y0, tw, y0, bw, y1, -bw, y1])
    pedestal.fill({ color: COLOR, alpha: 0.2 })
    pedestal.stroke({ color: COLOR, width: 1.5, alpha: 0.7 })

    const label = new Text({
      text: 'GLORIFIER',
      style: { fontFamily: 'monospace', fontSize: 11, fill: COLOR },
    })
    label.alpha = 0.65
    label.anchor.set(0.5)
    label.y = y0 + HEIGHT / 2

    this.container.addChild(pedestal, label)
  }

  setVisible(visible: boolean): void {
    this.container.visible = visible
  }

  destroy(): void {
    this.container.destroy({ children: true })
  }
}
