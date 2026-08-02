const TWO_PI = Math.PI * 2

interface MotionParams {
  // Secondary float — different frequency from orbit's primary float
  floatAmp:    number   // px
  floatFreq:   number   // Hz
  floatPhase:  number   // rad

  // Scale breathing — card appears to inhale and exhale
  breathPeriod: number  // s
  breathAmp:    number  // multiplier amplitude (e.g. 0.015 = ±1.5%)
  breathPhase:  number  // rad

  // Very slow depth drift — card appears to move slightly in Z
  depthDriftPeriod: number  // s (60–120)
  depthDriftAmp:    number  // multiplier amplitude (e.g. 0.012)
  depthDriftPhase:  number  // rad

  // Rotation drift — slow tilt
  rotPeriod:   number   // s
  rotAmp:      number   // rad
  rotPhase:    number   // rad

  // Horizontal sway
  dxAmp:       number   // px
  dxFreq:      number   // Hz
  dxPhase:     number   // rad

  // Orbital imperfection — extremely low frequency position bias
  // Makes each card sit slightly off the mathematical ellipse. So slow
  // (80–180 s period) that within any short viewing window it reads as
  // a fixed, intentional offset; over long sessions it drifts imperceptibly.
  imperfectXPeriod: number  // s
  imperfectYPeriod: number  // s
  imperfectXAmp:    number  // px
  imperfectYAmp:    number  // px

  // Per-card orbit speed variation
  speedVar:    number   // multiplier [0.96, 1.04]
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/**
 * Deterministic per-card secondary motion.
 *
 * Seed derivation: each card at index i uses seed = i * 2654435761 (Knuth's
 * multiplicative hash constant). Applying the hash at different offsets
 * (n = 1..17) produces well-distributed, uncorrelated floats in [0, 1].
 * Adjacent card indices produce very different hashes, so no two cards
 * share the same motion characteristics.
 *
 * Secondary motion is additive on top of OrbitEngine's primary ellipse + float:
 *   dy             — extra vertical drift at a different frequency
 *   dx             — horizontal sway + very-low-frequency imperfection
 *   rotation       — slow tilt drift (±~1.3° max)
 *   scaleMult      — breathing × depth drift (combined ≤ ±3% total)
 *   speedVar       — per-card orbit speed ±4%
 */
export class PhotoMotion {
  private readonly params: MotionParams[]

  constructor(cardCount: number) {
    this.params = Array.from({ length: cardCount }, (_, i) => this.derive(i))
  }

  getOffsets(cardIndex: number, elapsed: number): {
    dx: number
    dy: number
    rotation: number
    scaleMult: number
  } {
    const p = this.params[cardIndex]
    if (!p) return { dx: 0, dy: 0, rotation: 0, scaleMult: 1 }

    const dy         = p.floatAmp  * Math.sin(elapsed * p.floatFreq * TWO_PI + p.floatPhase)
    const sway       = p.dxAmp     * Math.sin(elapsed * p.dxFreq    * TWO_PI + p.dxPhase)
    const imperfectX = p.imperfectXAmp * Math.sin(elapsed * TWO_PI / p.imperfectXPeriod + p.floatPhase * 0.7)
    const imperfectY = p.imperfectYAmp * Math.sin(elapsed * TWO_PI / p.imperfectYPeriod + p.rotPhase   * 0.4)
    const dx         = sway + imperfectX

    const rotation   = p.rotAmp * Math.sin(elapsed * (TWO_PI / p.rotPeriod)       + p.rotPhase)

    const breathScale = 1 + p.breathAmp    * Math.sin(elapsed * (TWO_PI / p.breathPeriod)    + p.breathPhase)
    const depthScale  = 1 + p.depthDriftAmp * Math.sin(elapsed * (TWO_PI / p.depthDriftPeriod) + p.depthDriftPhase)
    const scaleMult   = breathScale * depthScale

    return { dx, dy: dy + imperfectY, rotation, scaleMult }
  }

  getSpeedVariation(cardIndex: number): number {
    return this.params[cardIndex]?.speedVar ?? 1.0
  }

  private derive(seed: number): MotionParams {
    // Two different large primes combine seed with offset → uncorrelated values.
    // >>> 0 keeps the result in uint32 range.
    const h = (n: number): number =>
      ((seed * 2654435761 + n * 2246822519) >>> 0) / 0xffffffff

    return {
      floatAmp:    lerp(2,    5,    h(1)),
      floatFreq:   lerp(0.09, 0.17, h(2)),
      floatPhase:  h(3)  * TWO_PI,

      breathPeriod: lerp(4.5,  8.0,  h(4)),
      breathAmp:    lerp(0.008, 0.018, h(5)),
      breathPhase:  h(6)  * TWO_PI,

      depthDriftPeriod: lerp(60, 120, h(7)),
      depthDriftAmp:    lerp(0.006, 0.014, h(8)),
      depthDriftPhase:  h(9)  * TWO_PI,

      rotPeriod:   lerp(14,   28,   h(10)),
      rotAmp:      lerp(0.012, 0.026, h(11)),
      rotPhase:    h(12) * TWO_PI,

      dxAmp:       lerp(1.0,  3.0,  h(13)),
      dxFreq:      lerp(0.06, 0.12, h(14)),
      dxPhase:     h(15) * TWO_PI,

      imperfectXPeriod: lerp(80,  180, h(16)),
      imperfectYPeriod: lerp(90,  200, h(17)),
      imperfectXAmp:    lerp(1.5,  4.0, h(18)),
      imperfectYAmp:    lerp(1.0,  3.0, h(19)),

      speedVar:    lerp(0.96, 1.04, h(20)),
    }
  }
}
