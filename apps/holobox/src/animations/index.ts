import type { AnimationType } from '@/types'

export interface AnimationDescriptor {
  type: AnimationType
  duration: number
  ease: string
  repeat: number
  yoyo: boolean
}

export type AnimationStack = AnimationDescriptor[]
