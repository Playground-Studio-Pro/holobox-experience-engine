// ── Normalized shape definitions ──────────────────────────────────────────────
// All coordinate values are normalized to [0, 1] relative to canvas dimensions.
// Add new shapes here; all consumers interact via containsPx() only.

export interface RectZone {
  shape: 'rect'
  x: number       // left edge, normalized (0–1)
  y: number       // top edge, normalized (0–1)
  width: number   // normalized
  height: number  // normalized
}

// Future shapes:
// export interface EllipseZone { shape: 'ellipse'; cx: number; cy: number; rx: number; ry: number }
// export interface PolygonZone { shape: 'polygon'; points: [number, number][] }

export type SafeZoneShape = RectZone

// ── Resolved safe zone (absolute canvas pixels) ───────────────────────────────
// Computed once at boot from SafeZoneShape + canvas dimensions.
// All engine systems that need pixel geometry use this type.

export interface ResolvedSafeZone {
  shape: 'rect'
  x: number       // left edge in canvas px
  y: number       // top edge in canvas px
  width: number   // canvas px
  height: number  // canvas px
  cx: number      // horizontal center in canvas px
  cy: number      // vertical center in canvas px
  right: number   // right edge in canvas px
  bottom: number  // bottom edge in canvas px
}

export function resolveSafeZone(
  zone: SafeZoneShape,
  canvasW: number,
  canvasH: number,
): ResolvedSafeZone {
  switch (zone.shape) {
    case 'rect': {
      const x = zone.x * canvasW
      const y = zone.y * canvasH
      const width = zone.width * canvasW
      const height = zone.height * canvasH
      return {
        shape: 'rect',
        x, y, width, height,
        cx: x + width / 2,
        cy: y + height / 2,
        right: x + width,
        bottom: y + height,
      }
    }
    default:
      // SafeZoneShape currently has a single member, so TypeScript cannot narrow
      // this branch to `never` — a compile-time exhaustiveness guard would not
      // type-check. Once a second shape is added, re-introduce:
      //     const _exhaustive: never = zone
      // and the compiler will flag any unhandled case.
      throw new Error(`[SafeZone] Unhandled shape: ${JSON.stringify(zone)}`)
  }
}

// Point containment in absolute canvas pixels.
export function containsPx(resolved: ResolvedSafeZone, px: number, py: number): boolean {
  if (resolved.shape === 'rect') {
    return px >= resolved.x && px <= resolved.right && py >= resolved.y && py <= resolved.bottom
  }
  return false
}
