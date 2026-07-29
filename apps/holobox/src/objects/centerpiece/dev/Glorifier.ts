import { Container, Graphics, BlurFilter } from 'pixi.js'
import { gsap } from 'gsap'
import type { ExclusionZone } from '../types'

// Gap between exclusion zone bottom edge and pedestal top
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

  constructor(zone: ExclusionZone) {
    this.container = new Container()
    this.container.label = 'glorifier'
    this.build(zone)
    this.animate()
  }

  private build(zone: ExclusionZone): void {
    const halfH = zone.height / 2
    const pedestalTop = halfH + GAP  // first surface below exclusion zone

    // ── Upward light beam ──────────────────────────────────────────────────────
    // Tall narrow column of blurred gold light rising from the pedestal into
    // the trophy zone. Gives the impression the pedestal is illuminating whatever
    // rests above it.
    const beamStartY = -halfH + 80   // beam enters from well inside exclusion zone
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
    // Soft elliptical glow sitting at the pedestal's top surface. Suggests the
    // display platform is lit from within.
    const haloShape = new Graphics()
    haloShape.ellipse(0, pedestalTop, 56, 12)
    haloShape.fill({ color: C_ACCENT, alpha: 1 })

    this.halo = new Container()
    this.halo.addChild(haloShape)
    this.halo.filters = [new BlurFilter({ strength: 22 })]
    this.halo.alpha = 0.3
    this.container.addChild(this.halo)

    // ── Pedestal ───────────────────────────────────────────────────────────────
    // Multi-tier base drawn from top to bottom. Each tier is a trapezoid (slightly
    // wider at the bottom) with a gold top edge. The column narrows and rises, the
    // base fans out with a wide footing.
    //
    // Tier definitions: [yTop, yBot, halfWidthTop, halfWidthBot]
    const tiers: [number, number, number, number][] = [
      [pedestalTop,       pedestalTop + 16,  46,  46],  // display platform (flat)
      [pedestalTop + 16,  pedestalTop + 28,  28,  26],  // transition taper
      [pedestalTop + 28,  pedestalTop + 30,  26,  24],  // thin gap seam
      [pedestalTop + 30,  pedestalTop + 100, 24,  22],  // column shaft
      [pedestalTop + 100, pedestalTop + 116, 22,  70],  // column-to-base flare
      [pedestalTop + 116, pedestalTop + 138, 70,  86],  // base tier 1
      [pedestalTop + 138, pedestalTop + 158, 86, 104],  // base tier 2
    ]

    const ped = new Graphics()

    for (const [yt, yb, hwt, hwb] of tiers) {
      // Body fill
      ped.poly([-hwt, yt, hwt, yt, hwb, yb, -hwb, yb])
      ped.fill({ color: C_BODY })
    }

    // Top edge accent on each tier (gold lines)
    for (const [yt, , hwt] of tiers) {
      ped.moveTo(-hwt + 2, yt).lineTo(hwt - 2, yt)
      ped.stroke({ color: C_ACCENT, width: 1.5, alpha: 0.7 })
    }

    // Bottom edge of last tier
    const last = tiers[tiers.length - 1]
    ped.moveTo(-last[3] + 2, last[1]).lineTo(last[3] - 2, last[1])
    ped.stroke({ color: C_ACCENT, width: 1.5, alpha: 0.7 })

    // Vertical gold lines on column shaft edges
    const colTop = pedestalTop + 30
    const colBot = pedestalTop + 100
    const colHw = 24
    ped.moveTo(-colHw, colTop + 4).lineTo(-colHw, colBot - 4)
    ped.moveTo(colHw, colTop + 4).lineTo(colHw, colBot - 4)
    ped.stroke({ color: C_ACCENT_DIM, width: 1, alpha: 0.35 })

    // Highlight face on the display platform (top tier)
    ped.rect(-(46 - 6), pedestalTop + 2, (46 - 6) * 2, 12)
    ped.fill({ color: C_MID })

    this.container.addChild(ped)
  }

  private animate(): void {
    // Beam pulses slowly between dim and bright
    gsap.to(this.beam, {
      alpha: 0.42,
      duration: 2.8,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
    })

    // Halo pulses with a slight delay — not in sync with beam
    gsap.to(this.halo, {
      alpha: 0.62,
      duration: 2.1,
      delay: 1.1,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
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
