export interface EngineConfig {
  canvas: HTMLCanvasElement
  width: number
  height: number
  targetFps: number
}

export interface EngineState {
  isRunning: boolean
  currentExperience: string | null
  fps: number
}
