export type SceneState = 'idle' | 'focused' | 'gallery'

export type TransitionHandler = (to: SceneState, from: SceneState) => void

const VALID_TRANSITIONS: Record<SceneState, SceneState[]> = {
  idle: ['focused'],
  focused: ['idle', 'gallery', 'focused'],
  gallery: ['idle', 'focused'],
}

export class SceneStateMachine {
  private current: SceneState = 'idle'
  private readonly handlers = new Set<TransitionHandler>()

  get state(): SceneState {
    return this.current
  }

  transition(to: SceneState): boolean {
    if (!VALID_TRANSITIONS[this.current].includes(to)) return false
    const from = this.current
    this.current = to
    this.handlers.forEach(h => h(to, from))
    return true
  }

  subscribe(handler: TransitionHandler): () => void {
    this.handlers.add(handler)
    return () => { this.handlers.delete(handler) }
  }

  reset(): void {
    this.current = 'idle'
    this.handlers.clear()
  }
}
