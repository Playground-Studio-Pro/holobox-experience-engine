import { Container, Graphics, BlurFilter } from 'pixi.js'
import { gsap } from 'gsap'
import { CANVAS_HEIGHT } from '@/config/defaults'
import type { ResolvedSafeZone } from '@/spatial'

// Gap between safe zone bottom edge and pedestal top surface
const GAP = 14

// Palette
const C_BODY = 0x06060e
const C_MID = 0x0c0c1c
const C_ACCENT = 0xd4af37
const C_ACCENT_DIM = 0xa88428

export class Glorifier {
  readonly container: Container
  private beam!: Container
  private halo!: Container

  constructor(zone: ResolvedSafeZone) {
    this.container = new Container()
    this.container.label = 'glorifier'
    this.build(zone)
    this.animate()
  }

  private build(zone: ResolvedSafeZone): void {
    // CenterPiece container is anchored at canvas center.
    // Convert safe zone bounds to container-relative Y coordinates.
    const containerY = CANVAS_HEIGHT / 2
    const relTop    = zone.y      - containerY  // top of safe zone, relative to container
    const relBottom = zone.bottom - containerY  // bottom of safe zone, relative to container

    const pedestalTop = relBottom + GAP  // first surface below safe zone

    // ── Upward light beam ──────────────────────────────────────────────────────
    const beamStartY = relTop + 80  // beam enters from 80px below the top of safe zone
    const beamHeight = pedestalTop - beamStartY
    const BEAM_W = 16

    const beamShape = new Graphics()
    beamShape.rect(-BEAM_W / 2, beamStartY, BEAM_W, beamHeight)
    beamShape.fill({ color: C_ACCENT, alpha: 1 })

    this.beam = new Container()
    this.beam.addChild(beamShape)
    this.beam.filters = [new BlurFilter({ strength: 20 })]
    this.beam.alpha = 0.18
    this.container.addChild(this.beam)

    // ── Platform halo ──────────────────────────────────────────────────────────
    const haloShape = new Graphics()
    haloShape.ellipse(0, pedestalTop, 56, 12)
    haloShape.fill({ color: C_ACCENT, alpha: 1 })

    this.halo = new Container()
    this.halo.addChild(haloShape)
    this.halo.filters = [new BlurFilter({ strength: 22 })]
    this.halo.alpha = 0.3
    this.container.addChild(this.halo)

    // ── Pedestal ───────────────────────────────────────────────────────────────
    const tiers: [number, number, number, number][] = [
      [pedestalTop,       pedestalTop + 16,  46,  46],
      [pedestalTop + 16,  pedestalTop + 28,  28,  26],
      [pedestalTop + 28,  pedestalTop + 30,  26,  24],
      [pedestalTop + 30,  pedestalTop + 100, 24,  22],
      [pedestalTop + 100, pedestalTop + 116, 22,  70],
      [pedestalTop + 116, pedestalTop + 138, 70,  86],
      [pedestalTop + 138, pedestalTop + 158, 86, 104],
    ]

    const ped = new Graphics()

    for (const [yt, yb, hwt, hwb] of tiers) {
      ped.poly([-hwt, yt, hwt, yt, hwb, yb, -hwb, yb])
      ped.fill({ color: C_BODY })
    }

    for (const [yt, , hwt] of tiers) {
      ped.moveTo(-hwt + 2, yt).lineTo(hwt - 2, yt)
      ped.stroke({ color: C_ACCENT, width: 1.5, alpha: 0.7 })
    }

    const last = tiers[tiers.length - 1]
    ped.moveTo(-last[3] + 2, last[1]).lineTo(last[3] - 2, last[1])
    ped.stroke({ color: C_ACCENT, width: 1.5, alpha: 0.7 })

    const colTop = pedestalTop + 30
    const colBot = pedestalTop + 100
    const colHw = 24
    ped.moveTo(-colHw, colTop + 4).lineTo(-colHw, colBot - 4)
    ped.moveTo(colHw, colTop + 4).lineTo(colHw, colBot - 4)
    ped.stroke({ color: C_ACCENT_DIM, width: 1, alpha: 0.35 })

    ped.rect(-(46 - 6), pedestalTop + 2, (46 - 6) * 2, 12)
    ped.fill({ color: C_MID })

    this.container.addChild(ped)
  }

  private animate(): void {
    gsap.to(this.beam, {
      alpha: 0.42, duration: 2.8, ease: 'sine.inOut', repeat: -1, yoyo: true,
    })
    gsap.to(this.halo, {
      alpha: 0.62, duration: 2.1, delay: 1.1, ease: 'sine.inOut', repeat: -1, yoyo: true,
    })
  }

  setVisible(visible: boolean): void {
    this.container.visible = visible
  }

  destroy(): void {
    gsap.killTweensOf(this.beam)
    gsap.killTweensOf(this.halo)
    this.container.destroy({ children: true })
  }
}
