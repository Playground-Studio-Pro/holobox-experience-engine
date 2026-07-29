import { useEffect, useRef } from 'react'
import type { Ticker } from 'pixi.js'
import { OrbitEngine } from '@/objects/orbit'
import type { Scene } from '@/scene'
import type { Renderer } from '@/renderer'
import { DEFAULT_CONFIG, CANVAS_WIDTH, CANVAS_HEIGHT } from '@/config/defaults'

export function useOrbit(
  rendererRef: React.RefObject<Renderer | null>,
  sceneRef: React.RefObject<Scene | null>,
  sceneReady: boolean,
) {
  const engineRef = useRef<OrbitEngine | null>(null)

  useEffect(() => {
    const renderer = rendererRef.current
    const scene = sceneRef.current
    if (!sceneReady || !renderer || !scene) return

    const { orbit, motion } = DEFAULT_CONFIG

    const engine = new OrbitEngine({
      itemCount: orbit.itemCount,
      ellipseX: orbit.ellipseX ?? 420,
      ellipseY: orbit.ellipseY ?? 280,
      speed: motion?.orbitSpeed ?? 0.3,
      center: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 },
    })

    engineRef.current = engine
    engine.mount(
      scene.getLayer('orbitBack'),
      scene.getLayer('orbitFront'),
    )

    const onTick = (ticker: Ticker) => engine.update(ticker)
    renderer.ticker.add(onTick)

    return () => {
      renderer.ticker.remove(onTick)
      engine.destroy()
      engineRef.current = null
    }
  }, [rendererRef, sceneRef, sceneReady])

  return engineRef
}
