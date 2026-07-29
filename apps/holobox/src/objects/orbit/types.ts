import type { Vec2, OrbitItemType } from '@/types'

export type { OrbitItemType }

export type OrbitLayer = 'orbitBack' | 'orbitFront'

export interface OrbitEngineConfig {
  itemCount: number
  ellipseX: number
  ellipseY: number
  speed: number
  center: Vec2
}
