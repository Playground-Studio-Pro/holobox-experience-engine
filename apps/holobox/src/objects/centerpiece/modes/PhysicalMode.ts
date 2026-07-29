import { Container } from 'pixi.js'

export class PhysicalMode {
  readonly container: Container

  constructor() {
    this.container = new Container()
    this.container.label = 'mode:physical'
  }

  destroy(): void {
    this.container.destroy({ children: true })
  }
}
