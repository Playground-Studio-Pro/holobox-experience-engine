import type { InteractionState } from '@/types'

export { InteractionEngine } from './InteractionEngine'
export { SceneStateMachine } from './SceneStateMachine'
export type { SceneState, TransitionHandler } from './SceneStateMachine'

export interface InteractionEvent {
  type: 'tap' | 'hold' | 'swipe' | 'release'
  targetId: string | null
  position: { x: number; y: number }
  timestamp: number
}

export interface InteractionHandler {
  state: InteractionState
  onEvent: (event: InteractionEvent) => void
}
