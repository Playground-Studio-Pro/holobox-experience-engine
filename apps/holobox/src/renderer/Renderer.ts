import { Application } from 'pixi.js'

export interface RendererConfig {
  width: number
  height: number
  antialias: boolean
  resolution: number
}

export class Renderer {
  readonly app: Application
  private resizeObserver: ResizeObserver | null = null

  constructor(private readonly config: RendererConfig) {
    this.app = new Application()
  }

  async init(canvas: HTMLCanvasElement, container: HTMLElement): Promise<void> {
    await this.app.init({
      canvas,
      width: this.config.width,
      height: this.config.height,
      backgroundAlpha: 0,
      antialias: this.config.antialias,
      resolution: this.config.resolution,
      autoDensity: true,
    })

    this.app.ticker.maxFPS = 60

    this.applyScale(canvas, container)

    this.resizeObserver = new ResizeObserver(() => this.applyScale(canvas, container))
    this.resizeObserver.observe(container)
  }

  get stage() {
    return this.app.stage
  }

  get ticker() {
    return this.app.ticker
  }

  private applyScale(canvas: HTMLCanvasElement, container: HTMLElement): void {
    const scale = Math.min(
      container.clientWidth / this.config.width,
      container.clientHeight / this.config.height,
    )
    canvas.style.transform = `scale(${scale})`
  }

  destroy(): void {
    this.resizeObserver?.disconnect()
    this.resizeObserver = null
    this.app.destroy()
  }
}
