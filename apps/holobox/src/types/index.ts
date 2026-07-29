export type CenterPieceMode = 'physical' | 'digital'

export type InteractionState =
  | 'idle'
  | 'hover'
  | 'touch'
  | 'focus'
  | 'gallery'
  | 'return'
  | 'reset'

export type OrbitItemType = 'photo' | 'video' | 'card' | 'logo' | 'text'

export type AnimationType =
  | 'orbit'
  | 'float'
  | 'pulse'
  | 'glow'
  | 'scale'
  | 'rotate'
  | 'fade'
  | 'blur'
  | 'focus'

export interface Vec2 {
  x: number
  y: number
}

export interface Vec3 extends Vec2 {
  z: number
}
