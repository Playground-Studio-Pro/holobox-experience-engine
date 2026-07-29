import { Container, Graphics, Text } from 'pixi.js'
import type { ExclusionZone } from '../types'

const COLOR = 0x00ccff
const TICK = 18

export class SafeZone {
  readonly container: Container

  constructor(zone: ExclusionZone) {
    this.container = new Container()
    this.container.label = 'dev:safe-zone'
    this.build(zone)
  }

  private build(zone: ExclusionZone): void {
    const hw = zone.width / 2
    const hh = zone.height / 2

    const fill = new Graphics()
    fill.rect(-hw, -hh, zone.width, zone.height)
    fill.fill({ color: COLOR, alpha: 0.04 })
    fill.stroke({ color: COLOR, width: 1, alpha: 0.35 })

    const ticks = new Graphics()
    ticks.moveTo(-hw, -hh + TICK).lineTo(-hw, -hh).lineTo(-hw + TICK, -hh)
    ticks.moveTo(hw, -hh + TICK).lineTo(hw, -hh).lineTo(hw - TICK, -hh)
    ticks.moveTo(hw, hh - TICK).lineTo(hw, hh).lineTo(hw - TICK, hh)
    ticks.moveTo(-hw, hh - TICK).lineTo(-hw, hh).lineTo(-hw + TICK, hh)
    ticks.stroke({ color: COLOR, width: 2, alpha: 0.8 })

    const label = new Text({
      text: 'SAFE ZONE',
      style: { fontFamily: 'monospace', fontSize: 11, fill: COLOR },
    })
    label.alpha = 0.6
    label.x = -hw + 8
    label.y = -hh + 6

    this.container.addChild(fill, ticks, label)
  }

  setVisible(visible: boolean): void {
    this.container.visible = visible
  }

  destroy(): void {
    this.container.destroy({ children: true })
  }
}
