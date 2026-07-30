import { Container, Sprite, Graphics, Texture } from 'pixi.js'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/config/defaults'
import type { ResolvedSafeZone } from '@/spatial'

export class DigitalMode {
  readonly container: Container
  private threeRenderer: THREE.WebGLRenderer | null = null
  private destroyed = false

  constructor(zone: ResolvedSafeZone, modelPath: string | null) {
    this.container = new Container()
    this.container.label = 'mode:digital'

    // Crosshair placeholder — visible immediately while model loads
    this.buildPlaceholder(zone)

    if (modelPath) {
      this.loadModel(zone, modelPath).catch(err =>
        console.warn('[DigitalMode] GLB load failed:', err),
      )
    }
  }

  destroy(): void {
    this.destroyed = true
    if (this.threeRenderer) {
      this.threeRenderer.dispose()
      this.threeRenderer = null
    }
    this.container.destroy({ children: true })
  }

  // ── Placeholder ───────────────────────────────────────────────────────────

  private buildPlaceholder(zone: ResolvedSafeZone): void {
    const rcx = zone.cx - CANVAS_WIDTH / 2
    const rcy = zone.cy - CANVAS_HEIGHT / 2
    const rx  = zone.width / 2
    const ry  = zone.height / 2

    const body = new Graphics()
    body.ellipse(rcx, rcy, rx, ry)
    body.fill({ color: 0xffffff, alpha: 0.03 })
    body.stroke({ color: 0xffffff, width: 1, alpha: 0.12 })

    const crosshair = new Graphics()
    crosshair.moveTo(rcx - 24, rcy).lineTo(rcx + 24, rcy)
    crosshair.moveTo(rcx, rcy - 24).lineTo(rcx, rcy + 24)
    crosshair.stroke({ color: 0xffffff, width: 1, alpha: 0.30 })

    this.container.addChild(body, crosshair)
  }

  // ── GLB load + Three.js offscreen render → PixiJS sprite ─────────────────

  private async loadModel(zone: ResolvedSafeZone, modelPath: string): Promise<void> {
    const W = Math.round(zone.width)
    const H = Math.round(zone.height)

    // Offscreen canvas — not attached to DOM; WebGL works on detached canvases.
    const offscreen = document.createElement('canvas')
    offscreen.width  = W
    offscreen.height = H

    this.threeRenderer = new THREE.WebGLRenderer({ canvas: offscreen, alpha: true, antialias: true })
    this.threeRenderer.setSize(W, H)
    this.threeRenderer.setClearColor(0x000000, 0)

    const scene  = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(40, W / H, 0.01, 1000)

    // Minimal lighting — proof of concept only
    scene.add(new THREE.AmbientLight(0xffffff, 2.0))
    const sun = new THREE.DirectionalLight(0xffffff, 1.5)
    sun.position.set(1, 2, 3)
    scene.add(sun)

    // Load the GLB
    const gltf = await new Promise<{ scene: THREE.Object3D }>((resolve, reject) => {
      new GLTFLoader().load(modelPath, resolve as (g: unknown) => void, undefined, reject)
    })

    if (this.destroyed) return

    const model = gltf.scene
    scene.add(model)

    // Center and frame the model to fill the camera view
    const box    = new THREE.Box3().setFromObject(model)
    const center = box.getCenter(new THREE.Vector3())
    const size   = box.getSize(new THREE.Vector3())
    model.position.sub(center)

    const maxDim = Math.max(size.x, size.y, size.z)
    const fovRad = (camera.fov * Math.PI) / 180
    const dist   = (maxDim / 2) / Math.tan(fovRad / 2)
    camera.position.set(0, 0, dist * 1.4)
    camera.lookAt(0, 0, 0)

    this.threeRenderer.render(scene, camera)

    if (this.destroyed) return

    // Bake the Three.js render into a PixiJS texture and sprite
    const texture = Texture.from({ resource: offscreen })
    const sprite  = new Sprite(texture)
    sprite.anchor.set(0.5)
    // Position relative to CenterPiece container (anchored at canvas center)
    sprite.x = zone.cx - CANVAS_WIDTH / 2
    sprite.y = zone.cy - CANVAS_HEIGHT / 2
    sprite.width  = zone.width
    sprite.height = zone.height

    // Replace placeholder with the rendered trophy
    this.container.removeChildren()
    this.container.addChild(sprite)
  }
}
