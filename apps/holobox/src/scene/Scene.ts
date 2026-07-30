import { Container } from 'pixi.js'
import type { SceneLayerName } from './index'

const LAYER_ORDER: SceneLayerName[] = [
  'background',
  'decorBack',
  'orbitBack',
  'centerpiece',
  'orbitFront',
  'decorFront',
  'effects',
  'interaction',
  'ui',
]

export class Scene {
  readonly root: Container
  private readonly layers: Record<SceneLayerName, Container>

  constructor() {
    this.root = new Container()
    this.root.label = 'scene-root'

    const layers = {} as Record<SceneLayerName, Container>

    for (const name of LAYER_ORDER) {
      const layer = new Container()
      layer.label = `layer:${name}`
      layers[name] = layer
      this.root.addChild(layer)
    }

    this.layers = layers
  }

  getLayer(name: SceneLayerName): Container {
    return this.layers[name]
  }

  mount(stage: Container): void {
    stage.addChild(this.root)
  }

  destroy(): void {
    if (this.root.parent) {
      this.root.parent.removeChild(this.root)
    }
    this.root.destroy({ children: true })
  }
}
