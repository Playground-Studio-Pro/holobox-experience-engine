import { Container, Graphics, Text } from 'pixi.js'

// Physical Holobox display: 2160×3840 px → canvas scale ÷2 = 1080×1920
// All measurements below are in canvas (÷2) coordinates.
const TROPHY_X = 431
const TROPHY_Y = 300
const TROPHY_W = 218
const TROPHY_H = 513

const PEDESTAL_X = TROPHY_X
const PEDESTAL_Y = TROPHY_Y + TROPHY_H
const PEDESTAL_W = TROPHY_W
const PEDESTAL_H = 1108

const C_TROPHY   = 0x00ee55  // green
const C_PEDESTAL = 0xff6600  // orange
const LINE_W = 2

/**
 * Dev overlay: two annotated rectangles showing the physical safe zones
 * of the trophy and pedestal inside the Holobox display.
 *
 * Hidden by default. Toggle with G key (via useModeToggle).
 * Mounted directly on the scene UI layer so coords are absolute (canvas 0,0 = top-left).
 */
export class PhysicalZoneOverlay {
  readonly container = new Container()

  constructor() {
    this.container.label  = 'physicalZoneOverlay'
    this.container.visible = false
    this.build()
  }

  private build(): void {
    const g = new Graphics()

    // Trophy rectangle
    g.rect(TROPHY_X, TROPHY_Y, TROPHY_W, TROPHY_H)
    g.fill({ color: C_TROPHY, alpha: 0.15 })
    g.rect(TROPHY_X, TROPHY_Y, TROPHY_W, TROPHY_H)
    g.stroke({ color: C_TROPHY, width: LINE_W })

    // Pedestal rectangle
    g.rect(PEDESTAL_X, PEDESTAL_Y, PEDESTAL_W, PEDESTAL_H)
    g.fill({ color: C_PEDESTAL, alpha: 0.10 })
    g.rect(PEDESTAL_X, PEDESTAL_Y, PEDESTAL_W, PEDESTAL_H)
    g.stroke({ color: C_PEDESTAL, width: LINE_W })

    // Vertical center guide line
    const cx = TROPHY_X + TROPHY_W / 2
    g.moveTo(cx, TROPHY_Y).lineTo(cx, PEDESTAL_Y + PEDESTAL_H)
    g.stroke({ color: 0xffffff, width: 1, alpha: 0.3 })

    this.container.addChild(g)

    // Labels
    this.label(
      `TROPHY\n${TROPHY_W * 2} × ${TROPHY_H * 2} px`,
      cx, TROPHY_Y + 14,
      C_TROPHY,
    )
    this.label(
      `PEDESTAL\n${PEDESTAL_W * 2} × ${PEDESTAL_H * 2} px`,
      cx, PEDESTAL_Y + 14,
      C_PEDESTAL,
    )

    // Side dimension callouts
    this.label(`${TROPHY_X * 2} px`, TROPHY_X / 2, TROPHY_Y + TROPHY_H / 2, 0xaaaaaa)
    this.label(`${(1080 - TROPHY_X - TROPHY_W) * 2} px`, TROPHY_X + TROPHY_W + (1080 - TROPHY_X - TROPHY_W) / 2, TROPHY_Y + TROPHY_H / 2, 0xaaaaaa)
    this.label(`${TROPHY_Y * 2} px`, cx + 36, TROPHY_Y / 2, 0xaaaaaa)
  }

  private label(text: string, x: number, y: number, color: number): void {
    const t = new Text({
      text,
      style: {
        fontFamily: 'monospace',
        fontSize: 11,
        fill: color,
        align: 'center',
      },
    })
    t.anchor.set(0.5, 0)
    t.x = x
    t.y = y
    this.container.addChild(t)
  }

  setVisible(visible: boolean): void {
    this.container.visible = visible
  }

  destroy(): void {
    this.container.destroy({ children: true })
  }
}
