import { Container, Graphics, Text } from 'pixi.js'
import type { ExclusionZone } from '../types'

const COLOR = 0x888888

export class Placeholder {
  readonly container: Container

  constructor(zone: ExclusionZone) {
    this.container = new Container()
    this.container.label = 'dev:placeholder'
    this.build(zone)
  }

  private build(zone: ExclusionZone): void {
    const hw = zone.width / 2
    const hh = zone.height / 2

    const outline = new Graphics()
    outline.rect(-hw, -hh, zone.width, zone.height)
    outline.stroke({ color: COLOR, width: 1, alpha: 0.3 })

    const cross = new Graphics()
    cross.moveTo(-hw, -hh).lineTo(hw, hh)
    cross.moveTo(hw, -hh).lineTo(-hw, hh)
    cross.stroke({ color: COLOR, width: 1, alpha: 0.15 })

    const label = new Text({
      text: 'PLACEHOLDER',
      style: { fontFamily: 'monospace', fontSize: 11, fill: COLOR },
    })
    label.alpha = 0.5
    label.anchor.set(0.5)
    label.y = -hh + 20

    this.container.addChild(outline, cross, label)
  }

  setVisible(visible: boolean): void {
    this.container.visible = visible
  }

  destroy(): void {
    this.container.destroy({ children: true })
  }
}
